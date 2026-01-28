/**
 * Hook para verificação de elegibilidade de atletas
 * 
 * Baseado em:
 * - R14/R15: Categorias globais e regra etária obrigatória
 * - CANÔNICO: Validação de gênero
 * - CANÔNICO: Validação de categoria (atleta não pode jogar em categoria inferior)
 */

import { useMemo } from 'react';
import {
  calculateNaturalCategory,
  isEligibleForCategory,
  isEligibleByGender,
} from '@/lib/validations/athlete-validations';
import type { AthleteExpanded, Team, Category } from '../../types/athlete-canonical';

// ============================================================================
// TIPOS
// ============================================================================

interface EligibilityResult {
  isEligible: boolean;
  reasons: string[];
  warnings: string[];
}

interface CategoryInfo {
  id: number;
  name: string;
  maxAge: number;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const CATEGORIES: CategoryInfo[] = [
  { id: 1, name: 'Mirim', maxAge: 12 },
  { id: 2, name: 'Infantil', maxAge: 14 },
  { id: 3, name: 'Cadete', maxAge: 16 },
  { id: 4, name: 'Juvenil', maxAge: 18 },
  { id: 5, name: 'Júnior', maxAge: 21 },
  { id: 6, name: 'Adulto', maxAge: 36 },
  { id: 7, name: 'Master', maxAge: 60 },
];

// ============================================================================
// HOOK
// ============================================================================

export function useEligibility(
  athlete: AthleteExpanded | null,
  targetTeam?: Team | null,
  referenceYear: number = new Date().getFullYear()
) {
  /**
   * Calcula categoria natural da atleta
   */
  const naturalCategory = useMemo(() => {
    if (!athlete?.birth_date) return null;
    
    const result: any = calculateNaturalCategory(athlete);
    if (!result) return null;
    
    const category = CATEGORIES.find(c => c.id === result.id);
    return category ? { ...category, athleteAge: result.age ?? null } : null;
  }, [athlete]);

  /**
   * Verifica elegibilidade completa para uma equipe
   */
  const checkEligibility = useMemo((): EligibilityResult => {
    const reasons: string[] = [];
    const warnings: string[] = [];

    if (!athlete) {
      return { isEligible: false, reasons: ['Atleta não informada'], warnings: [] };
    }

    // 1. Verificar estado da atleta
    if (athlete.state !== 'ativa') {
      reasons.push(`Atleta está ${athlete.state === 'dispensada' ? 'dispensada' : 'arquivada'}`);
    }

    // 2. Verificar flags de restrição
    if (athlete.injured) {
      reasons.push('Atleta está lesionada e não pode participar de jogos/treinos');
    }

    if (athlete.suspended_until) {
      const suspendedDate = new Date(athlete.suspended_until);
      if (suspendedDate > new Date()) {
        reasons.push(`Atleta suspensa até ${suspendedDate.toLocaleDateString('pt-BR')}`);
      }
    }

    // Warnings (não bloqueiam, mas alertam)
    if (athlete.medical_restriction) {
      warnings.push('Atleta com restrição médica - participação com limitações');
    }

    if (athlete.load_restricted) {
      warnings.push('Atleta com carga restrita - limitar minutos/volume');
    }

    // 3. Se tem equipe alvo, verificar elegibilidade específica
    if (targetTeam) {
      // 3.1 Verificar gênero
      const athleteGender = (athlete as any).gender || 
                           (athlete.person?.gender === 'masculino' ? 'male' : 
                            athlete.person?.gender === 'feminino' ? 'female' : null);
      
      if (athleteGender && !isEligibleByGender(athleteGender, targetTeam.gender)) {
        reasons.push(
          `Atleta de gênero ${athleteGender === 'male' ? 'masculino' : 'feminino'} ` +
          `não pode ser vinculada a equipe ${targetTeam.gender}`
        );
      }

      // 3.2 Verificar categoria (R15)
      if (athlete.birth_date && targetTeam.category_id) {
        if (!isEligibleForCategory(athlete.birth_date, targetTeam.category_id)) {
          const targetCategory = CATEGORIES.find(c => c.id === targetTeam.category_id);
          reasons.push(
            `Atleta da categoria ${naturalCategory?.name || 'desconhecida'} ` +
            `não pode jogar em categoria inferior (${targetCategory?.name || 'desconhecida'})`
          );
        }
      }
    }

    return {
      isEligible: reasons.length === 0,
      reasons,
      warnings,
    };
  }, [athlete, targetTeam, naturalCategory]);

  /**
   * Obtém lista de categorias válidas para a atleta (R15)
   * Atleta pode jogar na sua categoria natural ou SUPERIOR
   */
  const eligibleCategories = useMemo(() => {
    if (!naturalCategory) return CATEGORIES;
    
    return CATEGORIES.filter(c => c.id >= naturalCategory.id);
  }, [naturalCategory]);

  /**
   * Verifica se atleta pode jogar "hoje"
   * Considera estado + flags de restrição
   */
  const canPlayToday = useMemo(() => {
    if (!athlete) return false;
    
    // Estado deve ser ativa
    if (athlete.state !== 'ativa') return false;
    
    // Não pode estar lesionada
    if (athlete.injured) return false;
    
    // Não pode estar suspensa
    if (athlete.suspended_until) {
      const suspendedDate = new Date(athlete.suspended_until);
      if (suspendedDate > new Date()) return false;
    }
    
    return true;
  }, [athlete]);

  /**
   * Obtém cor do badge de elegibilidade
   */
  const eligibilityBadgeColor = useMemo(() => {
    if (!athlete) return 'gray';
    
    const { isEligible, warnings } = checkEligibility;
    
    if (!isEligible) return 'red';
    if (warnings.length > 0) return 'yellow';
    return 'green';
  }, [athlete, checkEligibility]);

  return {
    // Categoria
    naturalCategory,
    eligibleCategories,
    
    // Elegibilidade
    ...checkEligibility,
    canPlayToday,
    eligibilityBadgeColor,
    
    // Helpers
    getCategoryName: (categoryId: number) => 
      CATEGORIES.find(c => c.id === categoryId)?.name || 'Desconhecida',
    
    formatAge: (birthDate: string) => {
      // Criar objeto atleta temporário para chamada
      const tempAthlete = { birth_date: birthDate } as AthleteExpanded;
      const result: any = calculateNaturalCategory(tempAthlete);
      return result?.age ?? null;
    },
  };
}

// ============================================================================
// HOOK SIMPLIFICADO: useCanPlayToday (para dashboard)
// ============================================================================

export function useCanPlayToday(athletes: AthleteExpanded[]): {
  available: AthleteExpanded[];
  unavailable: AthleteExpanded[];
  counts: {
    total: number;
    available: number;
    injured: number;
    suspended: number;
    dispensed: number;
  };
} {
  return useMemo(() => {
    const available: AthleteExpanded[] = [];
    const unavailable: AthleteExpanded[] = [];
    
    let injured = 0;
    let suspended = 0;
    let dispensed = 0;

    for (const athlete of athletes) {
      const canPlay = 
        athlete.state === 'ativa' &&
        !athlete.injured &&
        (!athlete.suspended_until || new Date(athlete.suspended_until) <= new Date());

      if (canPlay) {
        available.push(athlete);
      } else {
        unavailable.push(athlete);
        
        if (athlete.injured) injured++;
        if (athlete.suspended_until && new Date(athlete.suspended_until) > new Date()) suspended++;
        if (athlete.state === 'dispensada') dispensed++;
      }
    }

    return {
      available,
      unavailable,
      counts: {
        total: athletes.length,
        available: available.length,
        injured,
        suspended,
        dispensed,
      },
    };
  }, [athletes]);
}
