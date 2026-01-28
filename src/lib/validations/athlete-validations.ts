// Placeholder athlete validation helpers; replace with domain rules.
import type { AthleteExpanded, Category } from '../../types/athlete-canonical';

export function calculateNaturalCategory(_athlete: AthleteExpanded): Category | null {
  return null;
}

export function isEligibleForCategory(_athlete: AthleteExpanded | string, _categoryId: number | Category, _referenceYear?: number): boolean {
  return true;
}

export function isEligibleByGender(_athleteGender: string, _teamGender: string): boolean {
  return true;
}
