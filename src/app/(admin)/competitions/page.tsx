/**
 * Página principal /competitions
 * 
 * Exibe o Dashboard de competições ou o detalhe de uma competição específica
 * baseado nos query params.
 */

import { Metadata } from 'next';
import CompetitionsClient from './CompetitionsClient';

export const metadata: Metadata = {
  title: 'Competições | HB Track',
  description: 'Gerenciamento de competições e torneios',
};

export default function CompetitionsPage() {
  return <CompetitionsClient />;
}
