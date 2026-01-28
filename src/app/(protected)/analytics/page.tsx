/**
 * Analytics Dashboard - Step 17
 * 
 * Página de analytics com cache híbrido (weekly + monthly).
 * Integra Step 15 (threshold) e Step 16 (backend analytics).
 * 
 * Route: /analytics
 */

import { Metadata } from 'next'
import AnalyticsDashboardClient from './client'

export const metadata: Metadata = {
  title: 'Analytics | HB Track',
  description: 'Análise de desempenho e métricas de treino',
}

export default function AnalyticsPage() {
  return <AnalyticsDashboardClient />
}
