'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Cross2Icon, LockClosedIcon, CheckCircledIcon, QuestionMarkCircledIcon, ExclamationTriangleIcon, PersonIcon } from '@radix-ui/react-icons';
import { useToast } from '@/context/ToastContext';

// ============================================================================
// TIPOS
// ============================================================================

interface Member {
  id: string;
  name?: string;
  email: string;
  role: string;
  initials?: string;
  status: string;
}

interface EditMemberRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: Member | null;
  teamId: string;
}

// ============================================================================
// CONFIGURAÇÃO DE PAPÉIS
// ============================================================================

const ROLES = [
  { 
    value: 'admin', 
    label: 'Administrador', 
    description: 'Acesso total à gestão da equipe',
    tooltip: 'Pode gerenciar membros, configurações, treinos e tudo mais.',
    color: 'bg-slate-900 dark:bg-slate-100 text-white dark:text-black'
  },
  { 
    value: 'tecnico', 
    label: 'Técnico', 
    description: 'Gerencia treinos e atletas',
    tooltip: 'Pode criar treinos, gerenciar presenças e ver estatísticas.',
    color: 'bg-blue-600 dark:bg-blue-400 text-white dark:text-black'
  },
  { 
    value: 'auxiliar', 
    label: 'Auxiliar Técnico', 
    description: 'Apoia nas atividades',
    tooltip: 'Pode registrar presenças e ver treinos agendados.',
    color: 'bg-violet-600 dark:bg-violet-400 text-white dark:text-black'
  },
  { 
    value: 'membro', 
    label: 'Membro', 
    description: 'Acesso de visualização',
    tooltip: 'Pode visualizar treinos e informações da equipe.',
    color: 'bg-slate-400 dark:bg-slate-500 text-white'
  },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const EditMemberRoleModal: React.FC<EditMemberRoleModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  member,
  teamId 
}) => {
  // Refs
  const modalRef = useRef<HTMLDivElement>(null);

  // State
  const [selectedRole, setSelectedRole] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // Hooks
  const { toast } = useToast();

  // Derivados
  const hasChanges = selectedRole !== member?.role;
  const isFormValid = selectedRole && hasChanges;

  // Reset form ao abrir
  useEffect(() => {
    if (isOpen && member) {
      setSelectedRole(member.role);
      setApiError(null);
      setIsUpdating(false);
      setShowSuccess(false);
      setShowTooltip(null);
    }
  }, [isOpen, member]);

  // Handler para atualizar papel
  const handleUpdate = useCallback(async () => {
    if (!isFormValid || isUpdating || !member) return;

    console.log('🔵 [EditMemberRole] Atualizando papel...', { memberId: member.id, newRole: selectedRole });
    setIsUpdating(true);
    setApiError(null);

    try {
      const { teamsService } = await import('@/lib/api/teams');
      
      // Chamar API para atualizar papel
      const response = await teamsService.updateMemberRole(teamId, member.id, selectedRole);

      if (!response.success) {
        throw new Error(response.message || 'Erro ao atualizar papel');
      }

      // Sucesso
      setShowSuccess(true);
      toast.success('Papel atualizado!', {
        description: `${member.name || member.email} agora é ${ROLES.find(r => r.value === selectedRole)?.label}.`
      });

      setTimeout(() => {
        onClose();
        onSuccess();
      }, 800);

    } catch (error: any) {
      console.error('❌ [EditMemberRole] Erro:', error);
      
      let errorMessage = 'Não foi possível atualizar o papel.';
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setApiError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  }, [isFormValid, isUpdating, member, selectedRole, teamId, onClose, onSuccess, toast]);

  // Eventos de teclado
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isUpdating) {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' && isFormValid && !isUpdating) {
        e.preventDefault();
        handleUpdate();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isUpdating, isFormValid, onClose, handleUpdate]);

  if (!isOpen || !member) return null;

  const currentRoleInfo = ROLES.find(r => r.value === member.role);
  const isPending = member.status === 'Pendente';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
        onClick={() => { if (!isUpdating) onClose(); }}
      />
      <div 
        ref={modalRef}
        className="relative w-full max-w-md bg-white dark:bg-[#0f0f0f] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 rounded-lg"
      >
        {/* Estado de sucesso */}
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <CheckCircledIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900 dark:text-white">Papel atualizado!</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{member.name || member.email}</p>
            </div>
          </div>
        ) : isUpdating ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="relative w-16 h-16 animate-pulse">
              <img 
                src="/images/logo/logo-icon.svg" 
                alt="HB Track" 
                className="w-full h-full object-contain dark:hidden"
              />
              <img 
                src="/images/logo/logo-icon-dark.svg" 
                alt="HB Track" 
                className="w-full h-full object-contain hidden dark:block"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Atualizando papel...</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                  <LockClosedIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </div>
                <h2 className="text-lg font-heading font-bold tracking-tight text-slate-900 dark:text-white">
                  Editar Permissões
                </h2>
              </div>
              <button 
                onClick={onClose} 
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors rounded"
                aria-label="Fechar modal"
                title="Fechar (Esc)"
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Erro da API */}
              {apiError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">{apiError}</p>
                  </div>
                </div>
              )}

              {/* Info do membro */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                {isPending ? (
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <PersonIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-slate-100 flex items-center justify-center font-bold text-sm text-white dark:text-black flex-shrink-0">
                    {member.initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {member.name || member.email}
                  </p>
                  {member.name && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{member.email}</p>
                  )}
                </div>
                {currentRoleInfo && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${currentRoleInfo.color}`}>
                    {currentRoleInfo.label}
                  </span>
                )}
              </div>

              {/* Seleção de papel */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Novo Papel
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowTooltip(showTooltip ? null : 'roles')}
                    className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    aria-label="Ver informações sobre papéis"
                  >
                    <QuestionMarkCircledIcon className="w-3.5 h-3.5" />
                  </button>
                  {showTooltip === 'roles' && (
                    <div className="absolute z-10 w-72 p-3 bg-slate-800 dark:bg-slate-950 text-white rounded-lg shadow-xl border border-slate-700 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                      <p className="text-[10px] font-bold mb-2 text-slate-200">PAPÉIS E PERMISSÕES</p>
                      <div className="space-y-2">
                        {ROLES.map((r) => (
                          <div key={r.value} className="text-[10px]">
                            <span className="font-semibold text-slate-100">{r.label}:</span>{' '}
                            <span className="text-slate-300">{r.tooltip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((roleOption) => (
                    <button
                      key={roleOption.value}
                      type="button"
                      onClick={() => setSelectedRole(roleOption.value)}
                      className={`group p-2.5 border rounded-lg text-left transition-all ${
                        selectedRole === roleOption.value
                          ? 'border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-900'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                      title={roleOption.tooltip}
                    >
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">{roleOption.label}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{roleOption.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button 
                onClick={onClose} 
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleUpdate}
                disabled={!isFormValid}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-black text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title={!hasChanges ? 'Nenhuma alteração feita' : 'Salvar alterações'}
              >
                <LockClosedIcon className="w-3.5 h-3.5" />
                Salvar alterações
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EditMemberRoleModal;
