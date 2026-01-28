"use client";

/**
 * TeamSelector - Seletor de Equipe com Validações R15 e Gênero
 * 
 * REGRAS IMPLEMENTADAS:
 * - R15: Validação de categoria (atleta não pode jogar em categoria inferior)
 * - Validação de gênero (atleta não pode jogar em equipe de gênero incompatível)
 * - Filtro automático de equipes elegíveis
 * - Alertas visuais para categoria superior
 */

import React, { useMemo, useState, useEffect } from "react";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";

// ============================================================================
// TIPOS
// ============================================================================

export type Gender = "male" | "female";

export interface Team {
  id: string;
  name: string;
  gender: Gender;
  category_id: number;
  category_name?: string;
  organization_id: string;
}

export interface Category {
  id: number;
  name: string;
  max_age: number;
}

interface TeamSelectorProps {
  /** Data de nascimento da atleta (YYYY-MM-DD) */
  birthDate?: string;
  /** Gênero da atleta */
  athleteGender?: Gender;
  /** Lista de equipes disponíveis */
  teams: Team[];
  /** Lista de categorias */
  categories?: Category[];
  /** Valor selecionado */
  value?: string;
  /** Callback ao mudar seleção */
  onChange: (teamId: string | undefined) => void;
  /** Desabilitar seleção */
  disabled?: boolean;
  /** Ano de referência para cálculo de categoria */
  referenceYear?: number;
  /** Mostrar motivo de bloqueio */
  showBlockReasons?: boolean;
  /** Classes CSS adicionais */
  className?: string;
  /** Placeholder */
  placeholder?: string;
  /** Label */
  label?: string;
  /** Se é obrigatório */
  required?: boolean;
  /** Erro externo */
  error?: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: "Mirim", max_age: 12 },
  { id: 2, name: "Infantil", max_age: 14 },
  { id: 3, name: "Cadete", max_age: 16 },
  { id: 4, name: "Juvenil", max_age: 18 },
  { id: 5, name: "Júnior", max_age: 21 },
  { id: 6, name: "Adulto", max_age: 36 },
  { id: 7, name: "Master", max_age: 60 },
];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calcula a idade da atleta no ano de referência
 */
function calculateAge(birthDate: string, referenceYear: number): number {
  const birth = new Date(birthDate);
  return referenceYear - birth.getFullYear();
}

/**
 * Calcula a categoria natural da atleta
 */
function calculateNaturalCategory(
  birthDate: string,
  referenceYear: number,
  categories: Category[]
): Category | null {
  const age = calculateAge(birthDate, referenceYear);
  
  // Ordenar categorias por max_age
  const sorted = [...categories].sort((a, b) => a.max_age - b.max_age);
  
  // Encontrar a menor categoria onde idade <= max_age
  for (const cat of sorted) {
    if (age <= cat.max_age) {
      return cat;
    }
  }
  
  // Se idade maior que todas, retornar a última (Master)
  return sorted[sorted.length - 1] || null;
}

/**
 * Verifica se atleta pode jogar em uma categoria (R15)
 */
function canPlayInCategory(
  athleteCategory: Category,
  teamCategory: Category
): { canPlay: boolean; isUpgrade: boolean } {
  // Atleta pode jogar na sua categoria ou SUPERIOR (max_age maior)
  const canPlay = teamCategory.max_age >= athleteCategory.max_age;
  const isUpgrade = teamCategory.max_age > athleteCategory.max_age;
  
  return { canPlay, isUpgrade };
}

/**
 * Verifica compatibilidade de gênero
 */
function isGenderCompatible(
  athleteGender: Gender | undefined,
  teamGender: Gender
): boolean {
  // Se atleta não tem gênero definido, permitir (compatibilidade)
  if (!athleteGender) return true;
  
  // Gênero deve ser igual
  return athleteGender === teamGender;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export default function TeamSelector({
  birthDate,
  athleteGender,
  teams,
  categories = DEFAULT_CATEGORIES,
  value,
  onChange,
  disabled = false,
  referenceYear = new Date().getFullYear(),
  showBlockReasons = true,
  className = "",
  placeholder = "Selecione uma equipe",
  label,
  required = false,
  error,
}: TeamSelectorProps) {
  const [internalError, setInternalError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // Calcular categoria natural da atleta
  const naturalCategory = useMemo(() => {
    if (!birthDate) return null;
    return calculateNaturalCategory(birthDate, referenceYear, categories);
  }, [birthDate, referenceYear, categories]);

  // Classificar equipes por elegibilidade
  const classifiedTeams = useMemo(() => {
    return teams.map((team) => {
      const teamCategory = categories.find((c) => c.id === team.category_id);
      
      let isEligible = true;
      let blockReason: string | null = null;
      let isUpgrade = false;

      // 1. Verificar gênero
      if (athleteGender && !isGenderCompatible(athleteGender, team.gender)) {
        isEligible = false;
        blockReason = `Equipe ${team.gender === "male" ? "masculina" : "feminina"} - gênero incompatível`;
      }

      // 2. Verificar categoria (R15)
      if (isEligible && naturalCategory && teamCategory) {
        const { canPlay, isUpgrade: upgrade } = canPlayInCategory(
          naturalCategory,
          teamCategory
        );
        
        if (!canPlay) {
          isEligible = false;
          blockReason = `Categoria ${teamCategory.name} inferior à natural (${naturalCategory.name})`;
        }
        
        isUpgrade = upgrade;
      }

      return {
        ...team,
        teamCategory,
        isEligible,
        blockReason,
        isUpgrade,
      };
    });
  }, [teams, categories, naturalCategory, athleteGender]);

  // Equipes elegíveis
  const eligibleTeams = useMemo(() => {
    return classifiedTeams.filter((t) => t.isEligible);
  }, [classifiedTeams]);

  // Equipes bloqueadas
  const blockedTeams = useMemo(() => {
    return classifiedTeams.filter((t) => !t.isEligible);
  }, [classifiedTeams]);

  // Handler de mudança
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teamId = e.target.value || undefined;
    
    if (!teamId) {
      setInternalError(null);
      setWarning(null);
      onChange(undefined);
      return;
    }

    const selectedTeam = classifiedTeams.find((t) => t.id === teamId);
    
    if (!selectedTeam) {
      onChange(teamId);
      return;
    }

    // Se não elegível, mostrar erro e bloquear
    if (!selectedTeam.isEligible) {
      setInternalError(selectedTeam.blockReason || "Equipe não elegível");
      setWarning(null);
      // Não atualiza valor
      return;
    }

    // Se é upgrade de categoria, mostrar warning
    if (selectedTeam.isUpgrade) {
      setWarning(
        `Atleta jogará em categoria superior (${selectedTeam.teamCategory?.name})`
      );
    } else {
      setWarning(null);
    }

    setInternalError(null);
    onChange(teamId);
  };

  // Limpar erros quando valor muda externamente
  useEffect(() => {
    if (!value) {
      setInternalError(null);
      setWarning(null);
    }
  }, [value]);

  const displayError = error || internalError;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Info de categoria natural */}
      {naturalCategory && (
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <span>Categoria natural:</span>
          <span className="font-medium text-brand-600 dark:text-brand-400">
            {naturalCategory.name}
          </span>
          {birthDate && (
            <span className="text-gray-400">
              ({calculateAge(birthDate, referenceYear)} anos)
            </span>
          )}
        </div>
      )}

      {/* Select */}
      <div className="relative">
        <select
          value={value || ""}
          onChange={handleChange}
          disabled={disabled}
          className={`
            w-full px-3 py-2 text-sm rounded-lg border
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-white
            focus:ring-2 focus:ring-brand-500 focus:border-transparent
            disabled:bg-gray-100 disabled:dark:bg-gray-700 disabled:cursor-not-allowed
            ${displayError 
              ? "border-red-500 focus:ring-red-500" 
              : warning 
                ? "border-yellow-500 focus:ring-yellow-500"
                : "border-gray-300 dark:border-gray-600"
            }
          `}
        >
          <option value="">{placeholder}</option>
          
          {/* Equipes elegíveis */}
          {eligibleTeams.length > 0 && (
            <optgroup label="Equipes Disponíveis">
              {eligibleTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                  {team.teamCategory && ` (${team.teamCategory.name})`}
                  {team.isUpgrade && " ⬆️"}
                </option>
              ))}
            </optgroup>
          )}

          {/* Equipes bloqueadas (para visualização) */}
          {showBlockReasons && blockedTeams.length > 0 && (
            <optgroup label="Equipes Não Elegíveis">
              {blockedTeams.map((team) => (
                <option key={team.id} value={team.id} disabled>
                  {team.name}
                  {team.teamCategory && ` (${team.teamCategory.name})`}
                  {team.blockReason && ` - ${team.blockReason}`}
                </option>
              ))}
            </optgroup>
          )}
        </select>

        {/* Ícone de status */}
        <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none">
          {displayError && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          {!displayError && warning && (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          )}
          {!displayError && !warning && value && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </div>
      </div>

      {/* Mensagens de erro/warning */}
      {displayError && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {displayError}
        </p>
      )}

      {!displayError && warning && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {warning}
        </p>
      )}

      {/* Resumo de elegibilidade */}
      {!disabled && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {eligibleTeams.length} equipe(s) elegível(is)
          {blockedTeams.length > 0 && `, ${blockedTeams.length} bloqueada(s)`}
        </div>
      )}
    </div>
  );
}
