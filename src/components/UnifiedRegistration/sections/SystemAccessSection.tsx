/**
 * Seção Acesso ao Sistema - Ficha Única
 * 
 * Mostra informações sobre criação de usuário no sistema:
 * - Se email foi preenchido, mostra que usuário será criado
 * - Informa que email com senha será enviado via SendGrid
 */

'use client';

import { Mail, UserPlus, Info, Shield } from 'lucide-react';
import type { RegistrationType } from '../../../types/unified-registration';

interface SystemAccessSectionProps {
  email?: string;
  willCreateUser: boolean;
  registrationType?: RegistrationType;
}

// Mapeamento de papéis para labels
const ROLE_LABELS: Record<RegistrationType, string> = {
  atleta: 'Atleta',
  treinador: 'Treinador(a)',
  coordenador: 'Coordenador(a)',
  dirigente: 'Dirigente',
};

export default function SystemAccessSection({
  email,
  willCreateUser,
  registrationType,
}: SystemAccessSectionProps) {
  // Se não vai criar usuário, mostra informação simplificada
  if (!willCreateUser) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" />
            Acesso ao Sistema
          </h3>
        </div>
        
        <div className="p-6">
          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <Info className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Nenhum usuário será criado no sistema.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Para criar um usuário com acesso ao sistema, preencha o campo de email na seção de Dados Pessoais.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-500" />
          Acesso ao Sistema
        </h3>
      </div>
      
      <div className="p-6 space-y-4">
        {/* Confirmação de criação de usuário */}
        <div className="flex items-start gap-3 p-4 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg">
          <UserPlus className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-brand-800 dark:text-brand-200">
              Um usuário será criado no sistema
            </p>
            <p className="text-sm text-brand-600 dark:text-brand-400 mt-1">
              O cadastro terá acesso à plataforma HB Track.
            </p>
          </div>
        </div>
        
        {/* Detalhes do acesso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email de acesso */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Email de Acesso
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white break-all">
              {email}
            </p>
          </div>
          
          {/* Papel no sistema */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Papel no Sistema
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {registrationType ? ROLE_LABELS[registrationType] : 'Será definido pelo tipo de cadastro'}
            </p>
          </div>
        </div>
        
        {/* Informação sobre email de boas-vindas */}
        <div className="flex items-start gap-3 p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg">
          <Mail className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-success-800 dark:text-success-200">
              Email de boas-vindas será enviado
            </p>
            <p className="text-sm text-success-600 dark:text-success-400 mt-1">
              O usuário receberá um email com instruções para definir sua senha e acessar o sistema.
            </p>
          </div>
        </div>
        
        {/* Aviso de segurança */}
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Info className="w-3 h-3" />
          O email de boas-vindas é enviado via SendGrid e contém um link seguro para definição de senha.
        </p>
      </div>
    </div>
  );
}
