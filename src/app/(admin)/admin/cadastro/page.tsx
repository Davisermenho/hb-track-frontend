/**
 * Página de Cadastro Único (Ficha Única)
 * 
 * Esta é a página CANÔNICA de cadastro do sistema HB Track.
 * Utiliza o componente FichaUnicaWizard que implementa o fluxo completo
 * conforme especificado em FICHA.MD e RAG.json.
 * 
 * Features:
 * - Wizard multi-step com validação progressiva
 * - Suporte a idempotência (previne duplicatas)
 * - Autosave de rascunho no localStorage
 * - Validação Zod em cada etapa
 * - Integração com API /api/v1/intake/ficha-unica
 * 
 * Etapas:
 * 1. Dados da Pessoa (obrigatório)
 * 2. Acesso ao Sistema (opcional - se email fornecido)
 * 3. Temporada (opcional)
 * 4. Organização (create ou select)
 * 5. Equipe (create ou select)
 * 6. Atleta (dados esportivos se cadastrar atleta)
 * 7. Revisão Final
 */

import { FichaUnicaWizard } from '@/features/intake/FichaUnicaWizard';
import { RequireRole } from '@/components/permissions/RequireRole';
import { Metadata } from 'next';
import type { UserRole } from '@/types';

export const metadata: Metadata = {
  title: 'Cadastro Único | HB Track - Sistema de Gestão de Handebol',
  description: 'Ficha única de cadastro integrado - pessoa, usuário, organização, equipe e atleta',
};

/**
 * GATE DE AUTORIZAÇÃO
 * Roles permitidas: admin, dirigente, coordenador, treinador
 * Sincronizado com backend: app/api/v1/routers/intake.py
 */
const ALLOWED_ROLES: UserRole[] = ['admin', 'dirigente', 'coordenador', 'treinador'];

export default function AdminCadastroPage() {
  return (
    <RequireRole 
      allowedRoles={ALLOWED_ROLES}
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Acesso Negado
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Você não tem permissão para acessar esta página.
            </p>
          </div>
        </div>
      }
    >
      <FichaUnicaWizard />
    </RequireRole>
  );
}
