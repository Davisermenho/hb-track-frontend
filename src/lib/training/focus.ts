/**
 * Domínio Canônico de Foco para Treinos
 *
 * Consolida toda lógica de validação e cálculo de distribuição de foco
 * em um único módulo autoritativo. Usa big.js para precisão decimal
 * eliminando problemas de IEEE 754.
 *
 * @module lib/training/focus
 * @version 1.0.0
 * @date 2026-01-21
 */

import Big from 'big.js';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Valores de foco raw (entrada do usuário/API)
 * Campos podem ser undefined, null ou número
 */
export interface FocusInput {
  attack_positional_pct?: number | null;
  defense_positional_pct?: number | null;
  transition_offense_pct?: number | null;
  transition_defense_pct?: number | null;
  attack_technical_pct?: number | null;
  defense_technical_pct?: number | null;
  physical_pct?: number | null;
}

/**
 * Valores de foco com prefixo focus_ (formato API/backend)
 */
export interface ApiFocusInput {
  focus_attack_positional_pct?: number | null;
  focus_defense_positional_pct?: number | null;
  focus_transition_offense_pct?: number | null;
  focus_transition_defense_pct?: number | null;
  focus_attack_technical_pct?: number | null;
  focus_defense_technical_pct?: number | null;
  focus_physical_pct?: number | null;
}

/**
 * Valores de foco normalizados (sempre números válidos 0-100)
 */
export interface NormalizedFocus {
  attack_positional_pct: number;
  defense_positional_pct: number;
  transition_offense_pct: number;
  transition_defense_pct: number;
  attack_technical_pct: number;
  defense_technical_pct: number;
  physical_pct: number;
}

/**
 * Flags de fase baseadas no threshold de 5%
 */
export interface PhaseFlags {
  /** Ataque: attack_positional + attack_technical >= 5% */
  phase_focus_attack: boolean;
  /** Defesa: defense_positional + defense_technical >= 5% */
  phase_focus_defense: boolean;
  /** Transição Ofensiva: transition_offense >= 5% */
  phase_focus_transition_offense: boolean;
  /** Transição Defensiva: transition_defense >= 5% */
  phase_focus_transition_defense: boolean;
  /** Físico: physical >= 5% */
  phase_focus_physical: boolean;
}

/**
 * Erros de campo estruturados para validação
 */
export interface FocusFieldErrors {
  focus_total?: string;
  justification?: string;
  attack_positional_pct?: string;
  defense_positional_pct?: string;
  transition_offense_pct?: string;
  transition_defense_pct?: string;
  attack_technical_pct?: string;
  defense_technical_pct?: string;
  physical_pct?: string;
}

/**
 * Status de validação semáforo
 */
export type FocusValidationStatus = 'valid' | 'warning' | 'error';

/**
 * Resultado completo da computação de foco
 */
export interface FocusSummary {
  /** Valores normalizados (null→0, NaN→0, clamp 0-100) */
  normalizedFocus: NormalizedFocus;

  /** Soma exata para comparações (Big.js) */
  totalFocusExact: Big;

  /** Soma arredondada para display (number) */
  totalFocusRounded: number;

  /** True se todos os focos são 0 */
  isEmpty: boolean;

  /** True se total > 100 && <= 120 (requer justificativa) */
  requiresJustification: boolean;

  /** True se total > 120 ou total == 0 (para fechamento) */
  isInvalid: boolean;

  /** True se requer justificativa mas não foi fornecida */
  missingJustification: boolean;

  /** Flags de fase derivadas (threshold 5%) */
  phaseFlags: PhaseFlags;

  /** Erros estruturados por campo */
  fieldErrors: FocusFieldErrors;

  /** Status semáforo: valid (verde), warning (amarelo), error (vermelho) */
  status: FocusValidationStatus;

  /** Cor para UI */
  color: 'green' | 'yellow' | 'red';

  /** Mensagem descritiva */
  message: string;

  /** Pode submeter o formulário */
  canSubmit: boolean;

  /** Ícone para UI */
  icon: 'check-circle' | 'alert-circle' | 'x-circle';
}

/**
 * Modo de validação
 * - lenient: permite focos vazios (para edição em progresso)
 * - strict: valida completude (para fechamento de sessão)
 */
export type ValidationMode = 'lenient' | 'strict';

/**
 * Opções para computeFocusSummary
 */
export interface ComputeFocusOptions {
  /** Modo de validação (default: 'lenient') */
  mode?: ValidationMode;
  /** Justificativa fornecida (para validar quando total > 100) */
  justification?: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Threshold mínimo para considerar uma fase como ativa (5%) */
export const PHASE_THRESHOLD = 5;

/** Limite máximo permitido (120%) */
export const MAX_FOCUS_TOTAL = 120;

/** Limite ideal (100%) */
export const IDEAL_FOCUS_TOTAL = 100;

/** Comprimento mínimo da justificativa */
export const MIN_JUSTIFICATION_LENGTH = 10;

/** Comprimento máximo da justificativa */
export const MAX_JUSTIFICATION_LENGTH = 500;

/** Nomes dos campos de foco */
export const FOCUS_FIELDS = [
  'attack_positional_pct',
  'defense_positional_pct',
  'transition_offense_pct',
  'transition_defense_pct',
  'attack_technical_pct',
  'defense_technical_pct',
  'physical_pct',
] as const;

/** Labels para os campos de foco */
export const FOCUS_LABELS: Record<typeof FOCUS_FIELDS[number], string> = {
  attack_positional_pct: 'Ataque Posicionado',
  defense_positional_pct: 'Defesa Posicionada',
  transition_offense_pct: 'Transição Ofensiva',
  transition_defense_pct: 'Transição Defensiva',
  attack_technical_pct: 'Técnica Ofensiva',
  defense_technical_pct: 'Técnica Defensiva',
  physical_pct: 'Condicionamento Físico',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normaliza um valor de foco para número válido
 * - null/undefined → 0
 * - NaN → 0
 * - Clamp entre 0 e 100
 */
function normalizeValue(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
}

/**
 * Converte input com prefixo focus_ para formato interno
 */
export function fromApiFocus(input: ApiFocusInput): FocusInput {
  return {
    attack_positional_pct: input.focus_attack_positional_pct,
    defense_positional_pct: input.focus_defense_positional_pct,
    transition_offense_pct: input.focus_transition_offense_pct,
    transition_defense_pct: input.focus_transition_defense_pct,
    attack_technical_pct: input.focus_attack_technical_pct,
    defense_technical_pct: input.focus_defense_technical_pct,
    physical_pct: input.focus_physical_pct,
  };
}

/**
 * Converte formato interno para formato API com prefixo focus_
 */
export function toApiFocus(input: FocusInput | NormalizedFocus): ApiFocusInput {
  return {
    focus_attack_positional_pct: input.attack_positional_pct ?? 0,
    focus_defense_positional_pct: input.defense_positional_pct ?? 0,
    focus_transition_offense_pct: input.transition_offense_pct ?? 0,
    focus_transition_defense_pct: input.transition_defense_pct ?? 0,
    focus_attack_technical_pct: input.attack_technical_pct ?? 0,
    focus_defense_technical_pct: input.defense_technical_pct ?? 0,
    focus_physical_pct: input.physical_pct ?? 0,
  };
}

/**
 * Valida se justificativa atende aos requisitos
 */
export function validateJustification(text: string | null | undefined): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  return trimmed.length >= MIN_JUSTIFICATION_LENGTH && trimmed.length <= MAX_JUSTIFICATION_LENGTH;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Computa sumário completo de validação de foco
 *
 * Esta é a função principal do módulo que deve ser usada em vez de
 * lógicas inline nos componentes. Garante consistência entre frontend
 * e backend através do uso de precisão decimal (Big.js).
 *
 * @param focus - Valores de foco (aceita ambos formatos: com ou sem prefixo)
 * @param options - Opções de validação
 * @returns Sumário completo com todos os campos derivados
 *
 * @example
 * // Uso básico
 * const summary = computeFocusSummary({ attack_positional_pct: 30, defense_positional_pct: 40 });
 * if (summary.canSubmit) { ... }
 *
 * @example
 * // Modo strict para fechamento
 * const summary = computeFocusSummary(session, { mode: 'strict', justification });
 * if (!summary.isInvalid && Object.keys(summary.fieldErrors).length === 0) { ... }
 */
export function computeFocusSummary(
  focus: FocusInput | ApiFocusInput | Record<string, unknown>,
  options: ComputeFocusOptions = {}
): FocusSummary {
  const { mode = 'lenient', justification } = options;

  // Detecta formato e converte para formato interno
  const isApiFormat = 'focus_attack_positional_pct' in focus;
  const input: FocusInput = isApiFormat
    ? fromApiFocus(focus as ApiFocusInput)
    : focus as FocusInput;

  // Normaliza valores (null→0, NaN→0, clamp 0-100)
  const normalizedFocus: NormalizedFocus = {
    attack_positional_pct: normalizeValue(input.attack_positional_pct),
    defense_positional_pct: normalizeValue(input.defense_positional_pct),
    transition_offense_pct: normalizeValue(input.transition_offense_pct),
    transition_defense_pct: normalizeValue(input.transition_defense_pct),
    attack_technical_pct: normalizeValue(input.attack_technical_pct),
    defense_technical_pct: normalizeValue(input.defense_technical_pct),
    physical_pct: normalizeValue(input.physical_pct),
  };

  // Calcula soma exata usando Big.js para evitar problemas de floating point
  const totalFocusExact = new Big(normalizedFocus.attack_positional_pct)
    .plus(normalizedFocus.defense_positional_pct)
    .plus(normalizedFocus.transition_offense_pct)
    .plus(normalizedFocus.transition_defense_pct)
    .plus(normalizedFocus.attack_technical_pct)
    .plus(normalizedFocus.defense_technical_pct)
    .plus(normalizedFocus.physical_pct);

  // Soma arredondada para display (1 casa decimal)
  const totalFocusRounded = parseFloat(totalFocusExact.toFixed(1));

  // Verifica se está vazio
  const isEmpty = totalFocusExact.eq(0);

  // Verifica se requer justificativa (> 100 e <= 120)
  const requiresJustification = totalFocusExact.gt(IDEAL_FOCUS_TOTAL) &&
                                 totalFocusExact.lte(MAX_FOCUS_TOTAL);

  // Valida justificativa se necessária
  const hasValidJustification = validateJustification(justification);
  const missingJustification = requiresJustification && !hasValidJustification;

  // Verifica se é inválido
  // Em modo strict: vazio ou > 120 são inválidos
  // Em modo lenient: apenas > 120 é inválido
  const isInvalid = totalFocusExact.gt(MAX_FOCUS_TOTAL) ||
                    (mode === 'strict' && isEmpty);

  // Calcula phase flags (threshold 5%)
  const phaseFlags: PhaseFlags = {
    phase_focus_attack: new Big(normalizedFocus.attack_positional_pct)
      .plus(normalizedFocus.attack_technical_pct)
      .gte(PHASE_THRESHOLD),
    phase_focus_defense: new Big(normalizedFocus.defense_positional_pct)
      .plus(normalizedFocus.defense_technical_pct)
      .gte(PHASE_THRESHOLD),
    phase_focus_transition_offense: new Big(normalizedFocus.transition_offense_pct)
      .gte(PHASE_THRESHOLD),
    phase_focus_transition_defense: new Big(normalizedFocus.transition_defense_pct)
      .gte(PHASE_THRESHOLD),
    phase_focus_physical: new Big(normalizedFocus.physical_pct)
      .gte(PHASE_THRESHOLD),
  };

  // Monta field errors
  const fieldErrors: FocusFieldErrors = {};

  if (mode === 'strict' && isEmpty) {
    fieldErrors.focus_total = 'Distribuição de foco é obrigatória para fechar a sessão';
  } else if (totalFocusExact.gt(MAX_FOCUS_TOTAL)) {
    fieldErrors.focus_total = `Distribuição excede o limite máximo de ${MAX_FOCUS_TOTAL}% (atual: ${totalFocusRounded}%)`;
  }

  if (missingJustification) {
    if (!justification) {
      fieldErrors.justification = 'Justificativa é obrigatória quando a distribuição excede 100%';
    } else if (justification.trim().length < MIN_JUSTIFICATION_LENGTH) {
      fieldErrors.justification = `Justificativa deve ter no mínimo ${MIN_JUSTIFICATION_LENGTH} caracteres`;
    }
  }

  // Determina status semáforo
  let status: FocusValidationStatus;
  let color: 'green' | 'yellow' | 'red';
  let message: string;
  let canSubmit: boolean;
  let icon: 'check-circle' | 'alert-circle' | 'x-circle';

  if (isInvalid) {
    // Vermelho: > 120% ou vazio em modo strict
    status = 'error';
    color = 'red';
    icon = 'x-circle';
    canSubmit = false;

    if (isEmpty) {
      message = 'Distribuição de foco não pode estar vazia';
    } else {
      message = `Distribuição excede ${MAX_FOCUS_TOTAL}% (${totalFocusRounded}%). Reduza os valores.`;
    }
  } else if (requiresJustification) {
    // Amarelo: 101-120%
    status = 'warning';
    color = 'yellow';
    icon = 'alert-circle';
    canSubmit = !missingJustification; // Pode submeter se tiver justificativa
    message = `Distribuição acima de 100% (${totalFocusRounded}%). Justificativa obrigatória.`;
  } else {
    // Verde: 0-100%
    status = 'valid';
    color = 'green';
    icon = 'check-circle';
    canSubmit = true;
    message = isEmpty
      ? 'Configure a distribuição de foco'
      : `Distribuição válida (${totalFocusRounded}%)`;
  }

  // Em modo strict, não pode submeter se vazio
  if (mode === 'strict' && isEmpty) {
    canSubmit = false;
  }

  return {
    normalizedFocus,
    totalFocusExact,
    totalFocusRounded,
    isEmpty,
    requiresJustification,
    isInvalid,
    missingJustification,
    phaseFlags,
    fieldErrors,
    status,
    color,
    message,
    canSubmit,
    icon,
  };
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * @deprecated Use computeFocusSummary instead
 * Mantido para compatibilidade com código existente
 */
export function calculateFocusTotal(focus: FocusInput | ApiFocusInput | Record<string, unknown>): number {
  const summary = computeFocusSummary(focus);
  return summary.totalFocusRounded;
}

/**
 * @deprecated Use computeFocusSummary instead
 * Mantido para compatibilidade com código existente
 */
export function validateFocusTotal(focus: FocusInput | ApiFocusInput | Record<string, unknown>): boolean {
  const summary = computeFocusSummary(focus);
  return !summary.isInvalid;
}

/**
 * @deprecated Use computeFocusSummary instead
 * Mantido para compatibilidade com código existente
 */
export function getFocusStatus(focus: FocusInput | ApiFocusInput | Record<string, unknown>): {
  status: FocusValidationStatus;
  total: number;
  color: 'green' | 'yellow' | 'red';
  message: string;
  canSubmit: boolean;
  requiresJustification: boolean;
  icon: 'check-circle' | 'alert-circle' | 'x-circle';
} {
  const summary = computeFocusSummary(focus);
  return {
    status: summary.status,
    total: summary.totalFocusRounded,
    color: summary.color,
    message: summary.message,
    canSubmit: summary.canSubmit,
    requiresJustification: summary.requiresJustification,
    icon: summary.icon,
  };
}
