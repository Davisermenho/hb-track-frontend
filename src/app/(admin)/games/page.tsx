/**
 * Página principal /games
 * 
 * Exibe o Dashboard de jogos ou o detalhe de um jogo específico
 * baseado nos query params.
 */

import { Metadata } from 'next';
import GamesClient from './GamesClient';

export const metadata: Metadata = {
  title: 'Jogos | HB Track',
  description: 'Gerenciamento de jogos e partidas',
};

export default function GamesPage() {
  return <GamesClient />;
}
