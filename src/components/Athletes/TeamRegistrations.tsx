"use client";

/**
 * TeamRegistrations - Gerenciamento de Vínculos do Atleta com Equipes
 * 
 * Funcionalidades:
 * - Visualizar vínculos ativos e histórico
 * - Adicionar novo vínculo
 * - Encerrar vínculo existente
 * - Validar R15 (categoria) e gênero
 * 
 * Regras:
 * - RDB10: Períodos não sobrepostos por pessoa+equipe+temporada
 * - R38: Atleta deve ter equipe para atuar na temporada
 * - R15/R16: Validação de categoria por idade
 * - R13: Estado "dispensada" encerra participações automaticamente
 */

import React, { useState, useMemo } from "react";
import {
  Users,
  Plus,
  Calendar,
  AlertTriangle,
  Clock,
  History,
  ChevronRight,
  CheckCircle,
  X,
  Loader2,
  Shield,
  Tag,
} from "lucide-react";

// ============================================================================
// TIPOS
// ============================================================================

interface Team {
  id: string;
  name: string;
  gender: "male" | "female";
  category?: {
    id: number;
    code: string;
    name: string;
    min_age?: number;
    max_age?: number;
  };
}

interface Season {
  id: string;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  status: "planned" | "active" | "ended" | "interrupted";
}

interface Category {
  id: number;
  code: string;
  name: string;
  min_age?: number;
  max_age?: number;
}

interface TeamRegistration {
  id: string;
  athlete_id: string;
  team_id: string;
  season_id: string;
  category_id: number;
  organization_id: string;
  role?: string;
  start_at: string;
  end_at?: string | null;
  team?: Team;
  season?: Season;
  category?: Category;
  created_at: string;
}

interface TeamRegistrationsProps {
  /** ID do atleta */
  athleteId: string;
  /** Data de nascimento do atleta (para validação R15) */
  birthDate?: string;
  /** Gênero do atleta (para filtrar equipes) */
  athleteGender?: "male" | "female";
  /** Lista de registros de equipe */
  registrations: TeamRegistration[];
  /** Se está carregando */
  loading?: boolean;
  /** Lista de equipes disponíveis */
  availableTeams?: Team[];
  /** Lista de temporadas disponíveis */
  availableSeasons?: Season[];
  /** Lista de categorias disponíveis */
  availableCategories?: Category[];
  /** Callback ao adicionar vínculo */
  onAddRegistration?: (registration: {
    team_id: string;
    season_id: string;
    category_id: number;
    start_at: string;
    role?: string;
  }) => Promise<void>;
  /** Callback ao encerrar vínculo */
  onEndRegistration?: (registrationId: string, endDate: string) => Promise<void>;
  /** Desabilitar ações */
  disabled?: boolean;
  /** Classes CSS adicionais */
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calcula a idade a partir da data de nascimento
 */
function calculateAge(birthDate: string, referenceDate?: string): number {
  const birth = new Date(birthDate);
  const ref = referenceDate ? new Date(referenceDate) : new Date();
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Formata data para exibição
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Verifica se o registro está ativo
 */
function isActiveRegistration(registration: TeamRegistration): boolean {
  if (!registration.end_at) return true;
  return new Date(registration.end_at) >= new Date();
}

/**
 * Calcula categoria natural baseado na idade
 */
function getNaturalCategoryLevel(categories: Category[], age: number): number {
  // Ordena categorias por max_age para encontrar a categoria natural
  const sorted = [...categories].sort((a, b) => (a.max_age || 99) - (b.max_age || 99));
  for (const cat of sorted) {
    if (cat.max_age && age <= cat.max_age) {
      return cat.id;
    }
  }
  return sorted[sorted.length - 1]?.id || 0;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export default function TeamRegistrations({
  athleteId,
  birthDate,
  athleteGender,
  registrations,
  loading = false,
  availableTeams = [],
  availableSeasons = [],
  availableCategories = [],
  onAddRegistration,
  onEndRegistration,
  disabled = false,
  className = "",
}: TeamRegistrationsProps) {
  // Estados
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<TeamRegistration | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state para adicionar
  const [newTeamId, setNewTeamId] = useState("");
  const [newSeasonId, setNewSeasonId] = useState("");
  const [newCategoryId, setNewCategoryId] = useState<number | "">("");
  const [newStartAt, setNewStartAt] = useState("");
  const [newRole, setNewRole] = useState("");
  const [endDate, setEndDate] = useState("");

  // Separar registros ativos e histórico
  const { activeRegistrations, historicRegistrations } = useMemo(() => {
    const active: TeamRegistration[] = [];
    const historic: TeamRegistration[] = [];

    for (const reg of registrations) {
      if (isActiveRegistration(reg)) {
        active.push(reg);
      } else {
        historic.push(reg);
      }
    }

    // Ordenar histórico por data de término (mais recente primeiro)
    historic.sort((a, b) => {
      const dateA = a.end_at ? new Date(a.end_at).getTime() : 0;
      const dateB = b.end_at ? new Date(b.end_at).getTime() : 0;
      return dateB - dateA;
    });

    return { activeRegistrations: active, historicRegistrations: historic };
  }, [registrations]);

  // Filtrar equipes por gênero
  const filteredTeams = useMemo(() => {
    if (!athleteGender) return availableTeams;
    return availableTeams.filter((team) => team.gender === athleteGender);
  }, [availableTeams, athleteGender]);

  // Validação R15 para categoria selecionada
  const categoryValidation = useMemo(() => {
    if (!birthDate || !newCategoryId || availableCategories.length === 0) {
      return { isValid: true, warning: null, error: null };
    }

    const age = calculateAge(birthDate);
    const naturalCategoryLevel = getNaturalCategoryLevel(availableCategories, age);
    const selectedCategory = availableCategories.find((c) => c.id === newCategoryId);

    if (!selectedCategory) {
      return { isValid: true, warning: null, error: null };
    }

    // R15: Não pode jogar em categoria inferior
    if (newCategoryId < naturalCategoryLevel) {
      return {
        isValid: false,
        warning: null,
        error: `R15: Atleta de ${age} anos não pode jogar em categoria inferior (${selectedCategory.code})`,
      };
    }

    // Aviso se jogar em categoria superior
    if (newCategoryId > naturalCategoryLevel) {
      const naturalCategory = availableCategories.find((c) => c.id === naturalCategoryLevel);
      return {
        isValid: true,
        warning: `Atleta jogará em categoria superior: ${selectedCategory.code} (categoria natural: ${naturalCategory?.code || "?"})`,
        error: null,
      };
    }

    return { isValid: true, warning: null, error: null };
  }, [birthDate, newCategoryId, availableCategories]);

  /**
   * Abre modal para encerrar vínculo
   */
  const handleOpenEndModal = (registration: TeamRegistration) => {
    setSelectedRegistration(registration);
    setEndDate(new Date().toISOString().split("T")[0]);
    setShowEndModal(true);
  };

  /**
   * Confirma adição de novo vínculo
   */
  const handleAddRegistration = async () => {
    if (!onAddRegistration || !newTeamId || !newSeasonId || !newCategoryId || !newStartAt) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddRegistration({
        team_id: newTeamId,
        season_id: newSeasonId,
        category_id: Number(newCategoryId),
        start_at: newStartAt,
        role: newRole || undefined,
      });
      setShowAddModal(false);
      resetAddForm();
    } catch (error) {
      console.error("Erro ao adicionar vínculo:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Confirma encerramento de vínculo
   */
  const handleEndRegistration = async () => {
    if (!onEndRegistration || !selectedRegistration || !endDate) return;

    setIsSubmitting(true);
    try {
      await onEndRegistration(selectedRegistration.id, endDate);
      setShowEndModal(false);
      setSelectedRegistration(null);
    } catch (error) {
      console.error("Erro ao encerrar vínculo:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reseta formulário de adição
   */
  const resetAddForm = () => {
    setNewTeamId("");
    setNewSeasonId("");
    setNewCategoryId("");
    setNewStartAt("");
    setNewRole("");
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="h-4 w-4" />
          Vínculos com Equipes
        </h3>

        {!disabled && onAddRegistration && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
              bg-brand-600 hover:bg-brand-700 text-white
              rounded-lg transition-colors
            `}
          >
            <Plus className="h-4 w-4" />
            Adicionar Vínculo
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Vínculos Ativos */}
      {!loading && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Vínculos Ativos ({activeRegistrations.length})
          </label>

          {activeRegistrations.length === 0 ? (
            <div className="p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-center">
              <Users className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nenhum vínculo ativo
              </p>
              {!disabled && onAddRegistration && (
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="mt-2 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  + Adicionar primeiro vínculo
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {activeRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  className={`
                    p-4 rounded-lg border
                    bg-white dark:bg-gray-800
                    border-green-200 dark:border-green-800
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      {/* Nome da equipe */}
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {reg.team?.name || "Equipe não encontrada"}
                        </span>
                      </div>

                      {/* Info adicional */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        {/* Categoria */}
                        {reg.category && (
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {reg.category.code}
                          </span>
                        )}
                        
                        {/* Temporada */}
                        {reg.season && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {reg.season.name} ({reg.season.year})
                          </span>
                        )}

                        {/* Data de início */}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Desde {formatDate(reg.start_at)}
                        </span>

                        {/* Função */}
                        {reg.role && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                            {reg.role}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    {!disabled && onEndRegistration && (
                      <button
                        type="button"
                        onClick={() => handleOpenEndModal(reg)}
                        className={`
                          px-2 py-1 text-xs font-medium rounded
                          text-red-600 hover:bg-red-50
                          dark:text-red-400 dark:hover:bg-red-900/20
                          transition-colors
                        `}
                      >
                        Encerrar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Seção de Histórico */}
      {!loading && historicRegistrations.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className={`
              w-full flex items-center justify-between
              text-sm font-medium text-gray-700 dark:text-gray-300
              hover:text-brand-600 dark:hover:text-brand-400
              transition-colors
            `}
          >
            <span className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico ({historicRegistrations.length})
            </span>
            <ChevronRight
              className={`h-4 w-4 transition-transform ${showHistory ? "rotate-90" : ""}`}
            />
          </button>

          {showHistory && (
            <div className="mt-3 space-y-2">
              {historicRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  className={`
                    p-3 rounded-lg border
                    bg-gray-50 dark:bg-gray-800/50
                    border-gray-200 dark:border-gray-700
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      {reg.team?.name || "Equipe não encontrada"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {formatDate(reg.start_at)} - {reg.end_at ? formatDate(reg.end_at) : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                    {reg.category && <span>{reg.category.code}</span>}
                    {reg.season && <span>• {reg.season.name}</span>}
                    {reg.role && <span>• {reg.role}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Adicionar Vínculo */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className={`
              w-full max-w-md bg-white dark:bg-gray-900
              rounded-xl shadow-xl
              border border-gray-200 dark:border-gray-700
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Adicionar Vínculo
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetAddForm();
                }}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              {/* Equipe */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Equipe <span className="text-red-500">*</span>
                </label>
                <select
                  value={newTeamId}
                  onChange={(e) => setNewTeamId(e.target.value)}
                  className={`
                    w-full px-3 py-2 text-sm rounded-lg border
                    bg-white dark:bg-gray-800
                    border-gray-300 dark:border-gray-600
                    text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-brand-500 focus:border-transparent
                  `}
                >
                  <option value="">Selecione uma equipe</option>
                  {filteredTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} {team.category ? `(${team.category.code})` : ""}
                    </option>
                  ))}
                </select>
                {athleteGender && filteredTeams.length === 0 && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    Nenhuma equipe {athleteGender === "male" ? "masculina" : "feminina"} disponível
                  </p>
                )}
              </div>

              {/* Temporada */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Temporada <span className="text-red-500">*</span>
                </label>
                <select
                  value={newSeasonId}
                  onChange={(e) => setNewSeasonId(e.target.value)}
                  className={`
                    w-full px-3 py-2 text-sm rounded-lg border
                    bg-white dark:bg-gray-800
                    border-gray-300 dark:border-gray-600
                    text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-brand-500 focus:border-transparent
                  `}
                >
                  <option value="">Selecione uma temporada</option>
                  {availableSeasons.map((season) => (
                    <option 
                      key={season.id} 
                      value={season.id}
                      disabled={season.status === "ended" || season.status === "interrupted"}
                    >
                      {season.name} ({season.year})
                      {season.status === "active" && " ✓"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Categoria */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Categoria <span className="text-red-500">*</span>
                </label>
                <select
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value ? Number(e.target.value) : "")}
                  className={`
                    w-full px-3 py-2 text-sm rounded-lg border
                    bg-white dark:bg-gray-800
                    text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-brand-500 focus:border-transparent
                    ${categoryValidation.error 
                      ? "border-red-500" 
                      : categoryValidation.warning 
                        ? "border-yellow-500" 
                        : "border-gray-300 dark:border-gray-600"
                    }
                  `}
                >
                  <option value="">Selecione uma categoria</option>
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.code} - {cat.name}
                    </option>
                  ))}
                </select>
                {categoryValidation.error && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {categoryValidation.error}
                  </p>
                )}
                {categoryValidation.warning && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {categoryValidation.warning}
                  </p>
                )}
              </div>

              {/* Data de Início */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Data de Início <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newStartAt}
                  onChange={(e) => setNewStartAt(e.target.value)}
                  className={`
                    w-full px-3 py-2 text-sm rounded-lg border
                    bg-white dark:bg-gray-800
                    border-gray-300 dark:border-gray-600
                    text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-brand-500 focus:border-transparent
                  `}
                />
              </div>

              {/* Função (opcional) */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Função/Posição (opcional)
                </label>
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="Ex: goleira, pivô, armadora"
                  className={`
                    w-full px-3 py-2 text-sm rounded-lg border
                    bg-white dark:bg-gray-800
                    border-gray-300 dark:border-gray-600
                    text-gray-900 dark:text-white
                    placeholder-gray-400
                    focus:ring-2 focus:ring-brand-500 focus:border-transparent
                  `}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetAddForm();
                }}
                disabled={isSubmitting}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg
                  border border-gray-300 dark:border-gray-600
                  text-gray-700 dark:text-gray-300
                  hover:bg-gray-50 dark:hover:bg-gray-800
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                `}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddRegistration}
                disabled={
                  isSubmitting ||
                  !newTeamId ||
                  !newSeasonId ||
                  !newCategoryId ||
                  !newStartAt ||
                  !!categoryValidation.error
                }
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg
                  bg-brand-600 hover:bg-brand-700 text-white
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                  flex items-center gap-2
                `}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Adicionar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Encerrar Vínculo */}
      {showEndModal && selectedRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className={`
              w-full max-w-md bg-white dark:bg-gray-900
              rounded-xl shadow-xl
              border border-gray-200 dark:border-gray-700
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Encerrar Vínculo
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowEndModal(false);
                  setSelectedRegistration(null);
                }}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      Confirmar encerramento?
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      O vínculo com <strong>{selectedRegistration.team?.name}</strong> será encerrado.
                      Esta ação não pode ser desfeita (RDB10).
                    </p>
                  </div>
                </div>
              </div>

              {/* Data de término */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Data de Término <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={selectedRegistration.start_at}
                  className={`
                    w-full px-3 py-2 text-sm rounded-lg border
                    bg-white dark:bg-gray-800
                    border-gray-300 dark:border-gray-600
                    text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-brand-500 focus:border-transparent
                  `}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Deve ser igual ou posterior a {formatDate(selectedRegistration.start_at)}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setShowEndModal(false);
                  setSelectedRegistration(null);
                }}
                disabled={isSubmitting}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg
                  border border-gray-300 dark:border-gray-600
                  text-gray-700 dark:text-gray-300
                  hover:bg-gray-50 dark:hover:bg-gray-800
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                `}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEndRegistration}
                disabled={isSubmitting || !endDate}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg
                  bg-red-600 hover:bg-red-700 text-white
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                  flex items-center gap-2
                `}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Encerrando...
                  </>
                ) : (
                  "Encerrar Vínculo"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORT TIPOS
// ============================================================================

export type { Team, Season, Category, TeamRegistration, TeamRegistrationsProps };
