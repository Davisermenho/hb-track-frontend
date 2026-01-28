'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Cross2Icon, TrashIcon, ExclamationTriangleIcon, PersonIcon, CheckCircledIcon } from '@radix-ui/react-icons';
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

interface RemoveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: Member | null;
  teamId: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const RemoveMemberModal: React.FC<RemoveMemberModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  member,
  teamId 
}) => {
  // Refs
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // State
  const [isRemoving, setIsRemoving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmationStep, setConfirmationStep] = useState(false);

  // Hooks
  const { toast } = useToast();

  // Derivados
  const isPending = member?.status === 'Pendente';
  const actionLabel = isPending ? 'cancelar convite' : 'remover membro';
  const actionLabelCapitalized = isPending ? 'Cancelar Convite' : 'Remover Membro';

  // Reset ao abrir
  useEffect(() => {
    if (isOpen) {
      setApiError(null);
      setIsRemoving(false);
      setShowSuccess(false);
      setConfirmationStep(false);
    }
  }, [isOpen]);

  // Focar no botão de cancelar ao mostrar confirmação
  useEffect(() => {
    if (confirmationStep && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [confirmationStep]);

  // Handler para remover/cancelar
  const handleRemove = useCallback(async () => {
    if (isRemoving || !member) return;

    console.log('🔵 [RemoveMember] Removendo membro...', { memberId: member.id, isPending });
    setIsRemoving(true);
    setApiError(null);

    try {
      const { teamsService } = await import('@/lib/api/teams');
      
      let response;
      if (isPending) {
        // Cancelar convite pendente
        response = await teamsService.cancelInvite(teamId, member.id);
      } else {
        // Remover membro ativo
        response = await teamsService.removeMember(teamId, member.id);
      }

      if (!response.success) {
        throw new Error(response.message || `Erro ao ${actionLabel}`);
      }

      // Sucesso
      setShowSuccess(true);
      toast.success(isPending ? 'Convite cancelado!' : 'Membro removido!', {
        description: `${member.name || member.email} foi ${isPending ? 'removido dos convites pendentes' : 'removido da equipe'}.`
      });

      setTimeout(() => {
        onClose();
        onSuccess();
      }, 800);

    } catch (error: any) {
      console.error('❌ [RemoveMember] Erro:', error);
      
      let errorMessage = `Não foi possível ${actionLabel}.`;
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Mensagens amigáveis
      if (errorMessage.includes('admin') || errorMessage.includes('único')) {
        errorMessage = 'Não é possível remover o único administrador da equipe.';
      }
      
      setApiError(errorMessage);
      setConfirmationStep(false);
    } finally {
      setIsRemoving(false);
    }
  }, [isRemoving, member, isPending, teamId, actionLabel, onClose, onSuccess, toast]);

  // Eventos de teclado
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isRemoving) {
        e.preventDefault();
        if (confirmationStep) {
          setConfirmationStep(false);
        } else {
          onClose();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isRemoving, confirmationStep, onClose]);

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
        onClick={() => { if (!isRemoving) onClose(); }}
      />
      <div 
        ref={modalRef}
        className="relative w-full max-w-sm bg-white dark:bg-[#0f0f0f] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 rounded-lg"
      >
        {/* Estado de sucesso */}
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <CheckCircledIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {isPending ? 'Convite cancelado!' : 'Membro removido!'}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{member.name || member.email}</p>
            </div>
          </div>
        ) : isRemoving ? (
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
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isPending ? 'Cancelando convite...' : 'Removendo membro...'}
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isPending 
                    ? 'bg-amber-100 dark:bg-amber-900/30' 
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {isPending ? (
                    <Cross2Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <TrashIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <h2 className="text-lg font-heading font-bold tracking-tight text-slate-900 dark:text-white">
                  {actionLabelCapitalized}
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

            <div className="p-5 space-y-4">
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
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  isPending 
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {isPending ? 'Pendente' : member.role}
                </span>
              </div>

              {/* Mensagem de confirmação */}
              <div className={`p-4 rounded-lg border-2 ${
                confirmationStep 
                  ? 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-800' 
                  : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30'
              }`}>
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    confirmationStep 
                      ? 'text-red-500 dark:text-red-400' 
                      : 'text-amber-500 dark:text-amber-400'
                  }`} />
                  <div className="space-y-1">
                    {confirmationStep ? (
                      <>
                        <p className="text-sm font-bold text-red-700 dark:text-red-300">
                          Confirma essa ação?
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {isPending 
                            ? 'O convite será cancelado e a pessoa não poderá mais usar o link enviado.'
                            : 'O membro perderá acesso à equipe imediatamente. Essa ação não pode ser desfeita.'
                          }
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                          {isPending ? 'Cancelar este convite?' : 'Remover este membro?'}
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          {isPending 
                            ? 'O convite pendente será cancelado e a pessoa precisará ser convidada novamente.'
                            : 'O membro será removido da equipe e perderá acesso a todos os recursos.'
                          }
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              {confirmationStep ? (
                <>
                  <button 
                    onClick={() => setConfirmationStep(false)} 
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
                  >
                    Voltar
                  </button>
                  <button 
                    ref={confirmButtonRef}
                    onClick={handleRemove}
                    className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-red-700 dark:hover:bg-red-600 transition-all flex items-center gap-2"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                    Confirmar {isPending ? 'cancelamento' : 'remoção'}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={onClose} 
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => setConfirmationStep(true)}
                    className={`px-4 py-2 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 ${
                      isPending 
                        ? 'bg-amber-500 hover:bg-amber-600' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {isPending ? (
                      <>
                        <Cross2Icon className="w-3.5 h-3.5" />
                        Cancelar convite
                      </>
                    ) : (
                      <>
                        <TrashIcon className="w-3.5 h-3.5" />
                        Remover membro
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RemoveMemberModal;
