import { Metadata } from 'next'
import AnalyticsClient from './AnalyticsClient'

export const metadata: Metadata = {
  title: 'Analytics | HB Track',
  description: 'Dashboard de analytics da equipe com métricas de desempenho e carga de treino',
}

export default function AnalyticsPage() {
  return <AnalyticsClient />
}
