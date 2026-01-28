/**
 * Página de Estatísticas - Visão Operacional
 * 
 * Conforme STATISTICS.TXT:
 * - Estado default: empty state
 * - Modal bloqueante para seleção de treino/jogo
 * - Dados só exibidos após confirmação
 * - Tempo de decisão: <30 segundos
 */

import { Metadata } from 'next';
import StatisticsOperationalPage from './OperationalView';

export const metadata: Metadata = {
  title: 'Estatísticas Operacionais | HB Track',
  description: 'Controle operacional de treinos e jogos - HB Track',
};

export default function StatisticsPage() {
  return <StatisticsOperationalPage />;
}