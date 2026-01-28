import { Metadata } from 'next';
import HomeContent from '@/components/Home/HomeContent';

export const metadata: Metadata = {
  title: "Página Inicial - HB Track",
  description: "Bem-vindo ao HB Track - Sistema de gestão esportiva",
};

/**
 * Página /inicio - Página Inicial do sistema
 * 
 * Exibe boas-vindas, atalhos rápidos e resumo de atividades recentes.
 */
export default function InicioPage() {
  return <HomeContent />;
}
