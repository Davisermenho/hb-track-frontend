"use client";

/**
 * AdvancedFilters - Componente de Filtros Avançados para Atletas
 * 
 * FASE 5.1 - FLUXO_GERENCIAMENTO_ATLETAS.md
 * 
 * Filtros implementados:
 * - Faixa etária (idade mín/máx)
 * - Altura/Peso (range)
 * - Dominância (destro, canhoto, ambidestro)
 * - Aptas para jogo (sem injured, sem suspended_until)
 * - Posições defensivas/ofensivas
 * - Salvar/carregar filtros favoritos (localStorage)
 * 
 * Regras RAG:
 * - R12/R13: Estados e flags de restrição
 * - R14/R15: Categorias e elegibilidade
 */

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { SlidersHorizontal, Save, Trash2, X, Check, Star, RefreshCw } from "lucide-react";

// ============================================================================
// TIPOS
// ============================================================================

export interface AdvancedFiltersType {
  // Faixa etária
  ageMin: number | null;
  ageMax: number | null;
  
  // Medidas físicas
  heightMin: number | null;  // em cm
  heightMax: number | null;
  weightMin: number | null;  // em kg
  weightMax: number | null;
  
  // Dominância
  dominance: ('destro' | 'canhoto' | 'ambidestro')[];
  
  // Elegibilidade
  eligibleOnly: boolean;  // true = apenas aptas para jogo (sem injured, sem suspended_until)
  
  // Posições
  defensivePositions: number[];  // IDs das posições defensivas
  offensivePositions: number[];  // IDs das posições ofensivas
  
  // Estados (R12)
  states: ('ativa' | 'dispensada' | 'arquivada')[];
  
  // Flags de restrição (R13)
  includeInjured: boolean;
  includeMedicalRestriction: boolean;
  includeSuspended: boolean;
  includeLoadRestricted: boolean;
}

interface SavedFilter {
  id: string;
  name: string;
  filters: AdvancedFiltersType;
  createdAt: string;
}

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: AdvancedFiltersType) => void;
  currentFilters?: Partial<AdvancedFiltersType>;
  defensivePositions?: { id: number; name: string; code: string }[];
  offensivePositions?: { id: number; name: string; code: string }[];
}

// ============================================================================
// VALORES PADRÃO
// ============================================================================

const DEFAULT_FILTERS: AdvancedFiltersType = {
  ageMin: null,
  ageMax: null,
  heightMin: null,
  heightMax: null,
  weightMin: null,
  weightMax: null,
  dominance: [],
  eligibleOnly: false,
  defensivePositions: [],
  offensivePositions: [],
  states: ['ativa'], // Por padrão mostra apenas ativas
  includeInjured: true,
  includeMedicalRestriction: true,
  includeSuspended: true,
  includeLoadRestricted: true,
};

const DOMINANCE_OPTIONS = [
  { value: 'destro', label: 'Destra' },
  { value: 'canhoto', label: 'Canhota' },
  { value: 'ambidestro', label: 'Ambidestra' },
] as const;

const STATE_OPTIONS = [
  { value: 'ativa', label: 'Ativa', color: 'green' },
  { value: 'dispensada', label: 'Dispensada', color: 'orange' },
  { value: 'arquivada', label: 'Arquivada', color: 'gray' },
] as const;

const STORAGE_KEY = 'hb_track_saved_filters';

// ============================================================================
// COMPONENTE
// ============================================================================

export function AdvancedFilters({
  isOpen,
  onClose,
  onApply,
  currentFilters,
  defensivePositions = [],
  offensivePositions = [],
}: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<AdvancedFiltersType>({
    ...DEFAULT_FILTERS,
    ...currentFilters,
  });
  
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [filterName, setFilterName] = useState("");

  // Carregar filtros salvos do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSavedFilters(JSON.parse(stored));
      } catch (e) {
        console.error("Erro ao carregar filtros salvos:", e);
      }
    }
  }, []);

  // Atualizar filtros quando currentFilters mudar
  useEffect(() => {
    if (currentFilters) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilters(prev => ({
        ...prev,
        ...currentFilters,
      }));
    }
  }, [currentFilters]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSaveFilter = () => {
    if (!filterName.trim()) return;
    
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName.trim(),
      filters: { ...filters },
      createdAt: new Date().toISOString(),
    };
    
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    setFilterName("");
    setShowSaveModal(false);
  };

  const handleLoadFilter = (saved: SavedFilter) => {
    setFilters({ ...saved.filters });
  };

  const handleDeleteFilter = (id: string) => {
    const updated = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleReset = () => {
    setFilters({ ...DEFAULT_FILTERS });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleDominanceChange = (value: 'destro' | 'canhoto' | 'ambidestro') => {
    setFilters(prev => ({
      ...prev,
      dominance: prev.dominance.includes(value)
        ? prev.dominance.filter(d => d !== value)
        : [...prev.dominance, value],
    }));
  };

  const handleStateChange = (value: 'ativa' | 'dispensada' | 'arquivada') => {
    setFilters(prev => ({
      ...prev,
      states: prev.states.includes(value)
        ? prev.states.filter(s => s !== value)
        : [...prev.states, value],
    }));
  };

  const handleDefensivePositionChange = (id: number) => {
    setFilters(prev => ({
      ...prev,
      defensivePositions: prev.defensivePositions.includes(id)
        ? prev.defensivePositions.filter(p => p !== id)
        : [...prev.defensivePositions, id],
    }));
  };

  const handleOffensivePositionChange = (id: number) => {
    setFilters(prev => ({
      ...prev,
      offensivePositions: prev.offensivePositions.includes(id)
        ? prev.offensivePositions.filter(p => p !== id)
        : [...prev.offensivePositions, id],
    }));
  };

  // Verificar se há filtros ativos
  const hasActiveFilters = 
    filters.ageMin !== null ||
    filters.ageMax !== null ||
    filters.heightMin !== null ||
    filters.heightMax !== null ||
    filters.weightMin !== null ||
    filters.weightMax !== null ||
    filters.dominance.length > 0 ||
    filters.eligibleOnly ||
    filters.defensivePositions.length > 0 ||
    filters.offensivePositions.length > 0 ||
    filters.states.length !== 1 ||
    filters.states[0] !== 'ativa' ||
    !filters.includeInjured ||
    !filters.includeMedicalRestriction ||
    !filters.includeSuspended ||
    !filters.includeLoadRestricted;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl mx-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-lg">
              <SlidersHorizontal className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filtros Avançados
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure filtros detalhados para buscar atletas
              </p>
            </div>
          </div>
          
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 
                       hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Limpar
            </button>
          )}
        </div>

        {/* Filtros Salvos */}
        {savedFilters.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Star className="w-4 h-4 inline mr-1" />
              Filtros Salvos
            </label>
            <div className="flex flex-wrap gap-2">
              {savedFilters.map(saved => (
                <div
                  key={saved.id}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 
                           rounded-full text-sm group"
                >
                  <button
                    onClick={() => handleLoadFilter(saved)}
                    className="text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400"
                  >
                    {saved.name}
                  </button>
                  <button
                    onClick={() => handleDeleteFilter(saved.id)}
                    className="ml-1 p-0.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid de Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coluna 1 */}
          <div className="space-y-6">
            {/* Faixa Etária */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Faixa Etária (anos)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Mín"
                  min={6}
                  max={80}
                  value={filters.ageMin ?? ""}
                  onChange={e => setFilters(prev => ({
                    ...prev,
                    ageMin: e.target.value ? parseInt(e.target.value) : null,
                  }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 
                           rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <span className="text-gray-500">—</span>
                <input
                  type="number"
                  placeholder="Máx"
                  min={6}
                  max={80}
                  value={filters.ageMax ?? ""}
                  onChange={e => setFilters(prev => ({
                    ...prev,
                    ageMax: e.target.value ? parseInt(e.target.value) : null,
                  }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 
                           rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Altura */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Altura (cm)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Mín"
                  min={100}
                  max={220}
                  value={filters.heightMin ?? ""}
                  onChange={e => setFilters(prev => ({
                    ...prev,
                    heightMin: e.target.value ? parseInt(e.target.value) : null,
                  }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 
                           rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <span className="text-gray-500">—</span>
                <input
                  type="number"
                  placeholder="Máx"
                  min={100}
                  max={220}
                  value={filters.heightMax ?? ""}
                  onChange={e => setFilters(prev => ({
                    ...prev,
                    heightMax: e.target.value ? parseInt(e.target.value) : null,
                  }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 
                           rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Peso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Peso (kg)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Mín"
                  min={30}
                  max={150}
                  value={filters.weightMin ?? ""}
                  onChange={e => setFilters(prev => ({
                    ...prev,
                    weightMin: e.target.value ? parseInt(e.target.value) : null,
                  }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 
                           rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <span className="text-gray-500">—</span>
                <input
                  type="number"
                  placeholder="Máx"
                  min={30}
                  max={150}
                  value={filters.weightMax ?? ""}
                  onChange={e => setFilters(prev => ({
                    ...prev,
                    weightMax: e.target.value ? parseInt(e.target.value) : null,
                  }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 
                           rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Dominância */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dominância
              </label>
              <div className="flex flex-wrap gap-2">
                {DOMINANCE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleDominanceChange(option.value)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      filters.dominance.includes(option.value)
                        ? "bg-brand-500 text-white border-brand-500"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-brand-400"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Coluna 2 */}
          <div className="space-y-6">
            {/* Estados (R12) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado da Atleta
              </label>
              <div className="flex flex-wrap gap-2">
                {STATE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleStateChange(option.value)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      filters.states.includes(option.value)
                        ? option.color === 'green'
                          ? "bg-green-500 text-white border-green-500"
                          : option.color === 'orange'
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-gray-500 text-white border-gray-500"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-brand-400"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Flags de Restrição (R13) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Disponibilidade
              </label>
              
              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.eligibleOnly}
                  onChange={e => setFilters(prev => ({ ...prev, eligibleOnly: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  🎯 Apenas aptas para jogo
                </span>
              </label>

              <div className="space-y-2 pl-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.includeInjured}
                    disabled={filters.eligibleOnly}
                    onChange={e => setFilters(prev => ({ ...prev, includeInjured: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 disabled:opacity-50"
                  />
                  <span className={`text-sm ${filters.eligibleOnly ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    🩹 Incluir lesionadas
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.includeMedicalRestriction}
                    onChange={e => setFilters(prev => ({ ...prev, includeMedicalRestriction: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    ⚕️ Incluir com restrição médica
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.includeSuspended}
                    disabled={filters.eligibleOnly}
                    onChange={e => setFilters(prev => ({ ...prev, includeSuspended: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 disabled:opacity-50"
                  />
                  <span className={`text-sm ${filters.eligibleOnly ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    🚫 Incluir suspensas
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.includeLoadRestricted}
                    onChange={e => setFilters(prev => ({ ...prev, includeLoadRestricted: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    ⚡ Incluir com carga restrita
                  </span>
                </label>
              </div>
            </div>

            {/* Posições Defensivas */}
            {defensivePositions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Posições Defensivas
                </label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {defensivePositions.map(pos => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => handleDefensivePositionChange(pos.id)}
                      className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                        filters.defensivePositions.includes(pos.id)
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400"
                      }`}
                      title={pos.name}
                    >
                      {pos.code || pos.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Posições Ofensivas */}
            {offensivePositions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Posições Ofensivas
                </label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {offensivePositions.map(pos => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => handleOffensivePositionChange(pos.id)}
                      className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                        filters.offensivePositions.includes(pos.id)
                          ? "bg-purple-500 text-white border-purple-500"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-purple-400"
                      }`}
                      title={pos.name}
                    >
                      {pos.code || pos.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 
                     hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            <Save className="w-4 h-4" />
            Salvar Filtro
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 
                       hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-2 px-6 py-2 bg-brand-500 hover:bg-brand-600 
                       text-white font-medium rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Modal para salvar filtro */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Salvar Filtro
            </h3>
            <input
              type="text"
              placeholder="Nome do filtro"
              value={filterName}
              onChange={e => setFilterName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveFilter()}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 
                       rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-brand-500 focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setFilterName("");
                }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveFilter}
                disabled={!filterName.trim()}
                className="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg 
                         hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ============================================================================
// COMPONENTE BOTÃO DE TRIGGER
// ============================================================================

interface AdvancedFiltersButtonProps {
  onClick: () => void;
  hasActiveFilters?: boolean;
  filterCount?: number;
}

export function AdvancedFiltersButton({ 
  onClick, 
  hasActiveFilters = false,
  filterCount = 0,
}: AdvancedFiltersButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
        hasActiveFilters
          ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400"
          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400"
      }`}
    >
      <SlidersHorizontal className="w-4 h-4" />
      <span>Filtros Avançados</span>
      {filterCount > 0 && (
        <span className="px-1.5 py-0.5 text-xs bg-brand-500 text-white rounded-full">
          {filterCount}
        </span>
      )}
    </button>
  );
}
