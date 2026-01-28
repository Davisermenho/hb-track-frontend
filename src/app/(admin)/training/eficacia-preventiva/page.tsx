/**
 * Prevention Effectiveness Dashboard - Step 22
 *
 * Página de análise de eficácia preventiva
 * Movido de (protected) para (admin) para manter consistência
 * do layout com TrainingTabs
 */

import PreventionDashboardClient from './PreventionDashboardClient';

export const metadata = {
  title: 'Eficácia Preventiva | HB Track',
  description: 'Análise de correlação entre alertas, sugestões e lesões'
};

export default function PreventionEffectivenessPage() {
  return <PreventionDashboardClient />;
}
