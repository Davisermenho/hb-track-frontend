import { Metadata } from 'next';
import { ConfiguracoesClient } from './ConfiguracoesClient';

export const metadata: Metadata = {
  title: 'Configurações - Training | HB Track',
  description: 'Gerenciar templates de treino customizados',
};

export default function ConfiguracoesPage() {
  return <ConfiguracoesClient />;
}
