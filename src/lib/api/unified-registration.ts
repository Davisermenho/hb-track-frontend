// Placeholder unified registration API; replace with real implementation when backend is ready.
import type { UnifiedRegistrationPayload } from '../../types/unified-registration';

export interface LookupItem {
  id: string | number;
  name: string;
}

export async function getOffensivePositions(): Promise<LookupItem[]> {
  return [];
}

export async function getDefensivePositions(): Promise<LookupItem[]> {
  return [];
}

export async function getCategories(): Promise<LookupItem[]> {
  return [];
}

export async function getSchoolingLevels(): Promise<LookupItem[]> {
  return [];
}

export async function getOrganizations(): Promise<LookupItem[]> {
  return [];
}

export async function getTeamsByOrganization(_organizationId: string | number): Promise<LookupItem[]> {
  return [];
}

export async function createUnifiedRegistration(
  _payload: UnifiedRegistrationPayload,
): Promise<{ id: string | number }> {
  return { id: crypto.randomUUID() };
}

export async function uploadProfilePhoto(_file: File): Promise<{ url: string }> {
  return { url: '' };
}
