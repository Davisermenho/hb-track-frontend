'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Cross2Icon, InfoCircledIcon, ReloadIcon, PersonIcon, ExclamationTriangleIcon, CheckCircledIcon, EnvelopeClosedIcon, QuestionMarkCircledIcon, PlusIcon, PaperPlaneIcon } from '@radix-ui/react-icons';
import { useToast } from '@/context/ToastContext';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamId: string;
}

// ============================================================================
// ROLE CONFIG
// ============================================================================

const ROLES = [
  { 
    value: 'membro', 
    label: 'Membro', 
    description: 'Pode visualizar treinos e jogos',
    tooltip: 'Acesso básico de visualização. Ideal para pais, responsáveis ou apoiadores.'
  },
  { 
    value: 'atleta', 
    label: 'Atleta', 
    description: 'Recebe convocações e registra presença',
    tooltip: 'Recebe notificações de treinos/jogos e pode confirmar presença. Para jogadores da equipe.'
  },
  { 
    value: 'tecnico', 
    label: 'Treinador(a)', 
    description: 'Cria treinos e gerencia táticas',
    tooltip: 'Pode criar e editar treinos, definir táticas e convocar atletas. Para comissão técnica.'
  },
  { 
    value: 'coordenador', 
    label: 'Coordenador(a)', 
    description: 'Acesso total à equipe',
    tooltip: 'Acesso administrativo completo. Pode convidar membros, alterar configurações e gerenciar a equipe.'
  },
];

const MESSAGE_MAX_LENGTH = 200;

// ============================================================================
// SENT INVITE ITEM
// ============================================================================

interface SentInvite {
  email: string;
  role: string;
  status: 'success' | 'error';
  message?: string;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose, onSuccess, teamId }) => {
  // Refs
  const emailInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // State
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('membro');
  const [personalMessage, setPersonalMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sentInvites, setSentInvites] = useState<SentInvite[]>([]);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // Hooks
  const { toast } = useToast();

  const isFormValid = email.trim().length > 0 && emailError === '' && role !== '';
  const hasUnsavedData = email.trim().length > 0 || personalMessage.trim().length > 0;
  const hasSentInvites = sentInvites.length > 0;

  // Reset form ao abrir
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setRole('membro');
      setPersonalMessage('');
      setEmailError('');
      setApiError(null);
      setIsInviting(false);
      setShowSuccess(false);
      setSentInvites([]);
      setShowTooltip(null);

      // Auto-focus no campo de email
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Validação de email em tempo real (regex robusto)
  useEffect(() => {
    if (email.length === 0) {
      setEmailError('');
    } else {
      // Regex completo para validação de email
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email.trim())) {
        setEmailError('Formato de email inválido');
      } else if (sentInvites.some(inv => inv.email.toLowerCase() === email.trim().toLowerCase() && inv.status === 'success')) {
        setEmailError('Convite já enviado para este email');
      } else {
        setEmailError('');
      }
    }
    // Limpar erro de API ao editar
    setApiError(null);
  }, [email, sentInvites]);

  const handleInvite = useCallback(async () => {
    if (!isFormValid || isInviting) return;

    console.log('🔵 [InviteModal] Iniciando convite...', { email, role, teamId });
    setIsInviting(true);
    setEmailError('');
    setApiError(null);

    const currentEmail = email.trim();
    const currentRole = role;

    try {
      // Importar teamsService
      const { teamsService } = await import('@/lib/api/teams');
      
      // Enviar convite via API
      console.log('🔵 [InviteModal] Chamando API...');
      const response = await teamsService.inviteMember({
        email: currentEmail,
        role: currentRole || 'membro',
        team_id: teamId,
        message: personalMessage.trim() || undefined,
      });

      console.log('🔵 [InviteModal] Resposta da API:', response);

      if (!response.success) {
        console.error('❌ [InviteModal] Erro na resposta:', response.message);
        throw new Error(response.message || 'Erro ao enviar convite');
      }

      // Sucesso - adicionar à lista de enviados
      setSentInvites(prev => [...prev, { 
        email: currentEmail, 
        role: currentRole, 
        status: 'success' 
      }]);

      toast.success('Convite enviado!', {
        description: `${currentEmail} receberá um email com o convite.`
      });

      // Limpar campos para próximo convite
      setEmail('');
      setPersonalMessage('');
      
      // Re-focar no email para próximo convite
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);

      // Notificar sucesso para atualizar lista
      onSuccess();

    } catch (error: any) {
      console.error('❌ [InviteModal] Erro capturado:', error);
      
      // Extrair mensagem de erro amigável
      let errorMessage = 'Não foi possível enviar o convite.';
      
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Mensagens amigáveis específicas
      if (errorMessage.includes('already exists') || errorMessage.includes('já existe')) {
        errorMessage = 'Este email já possui um convite pendente ou vínculo ativo com esta equipe.';
      } else if (errorMessage.includes('gênero diferente')) {
        errorMessage = 'Não é possível convidar: membro já vinculado a equipe de gênero diferente.';
      } else if (errorMessage.includes('categoria')) {
        errorMessage = 'Não é possível convidar: membro já vinculado a equipe de categoria igual ou superior.';
      } else if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
        errorMessage = 'Erro no servidor. Por favor, tente novamente em alguns instantes.';
      } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      }
      
      // Adicionar à lista como erro (preserva os dados)
      setSentInvites(prev => [...prev, { 
        email: currentEmail, 
        role: currentRole, 
        status: 'error',
        message: errorMessage
      }]);
      
      setApiError(errorMessage);
    } finally {
      setIsInviting(false);
    }
  }, [isFormValid, isInviting, email, role, teamId, personalMessage, onSuccess, toast]);

  const handleRetry = (inviteEmail: string) => {
    // Remove o erro da lista e preenche o email para tentar novamente
    setSentInvites(prev => prev.filter(inv => inv.email !== inviteEmail));
    setEmail(inviteEmail);
    setApiError(null);
    setTimeout(() => emailInputRef.current?.focus(), 100);
  };

  const handleClose = () => {
    if (hasSentInvites) {
      // Se já enviou convites, apenas fechar
      onClose();
    } else if (hasUnsavedData) {
      // Se tem dados não salvos, confirmar
      if (window.confirm('Você tem dados não salvos. Deseja realmente sair?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Eventos de teclado - ESC e Enter
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!isInviting) {
          onClose();
        }
      } else if (e.key === 'Enter' && isFormValid && !isInviting) {
        e.preventDefault();
        handleInvite();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isInviting, isFormValid, onClose, handleInvite]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
        onClick={() => { if (!isInviting) onClose(); }}
      ></div>
      <div 
        ref={modalRef}
        data-testid="invite-member-modal"
        className="relative w-full max-w-md bg-white dark:bg-[#0f0f0f] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 rounded-lg"
      >
        {/* Estado de sucesso */}
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <CheckCircledIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900 dark:text-white">Convite enviado!</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{email}</p>
            </div>
          </div>
        ) : isInviting ? (
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
            <div className="w-48 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-slate-900 dark:bg-slate-100 rounded-full"
                style={{ 
                  animation: 'loading-bar 2.5s ease-in-out infinite'
                }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Enviando convite...</p>
            <style jsx>{`
              @keyframes loading-bar {
                0% {
                  width: 0%;
                  margin-left: 0%;
                }
                50% {
                  width: 70%;
                  margin-left: 15%;
                }
                100% {
                  width: 0%;
                  margin-left: 100%;
                }
              }
            `}</style>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                  <PersonIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </div>
                <h2 className="text-lg font-heading font-bold tracking-tight text-slate-900 dark:text-white">Convidar Membro</h2>
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

            <form onSubmit={(e) => { e.preventDefault(); handleInvite(); }} className="p-5 space-y-4">
              {/* Campo de Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  ref={emailInputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: tecnico@hbtrack.com"
                  data-testid="invite-email-input"
                  className={`w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-950 border rounded-lg ${
                    emailError 
                      ? 'border-red-500 dark:border-red-500 focus:ring-red-500' 
                      : 'border-slate-200 dark:border-slate-800 focus:ring-slate-900 dark:focus:ring-slate-100'
                  } focus:ring-1 outline-none transition-all`}
                  aria-invalid={!!emailError}
                />
                {emailError && (
                  <p data-testid="invite-email-error" className="text-[10px] text-red-500 font-medium">{emailError}</p>
                )}
              </div>

              {/* Campo de Papel */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Papel Desejado
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowTooltip(showTooltip ? null : 'roles')}
                      className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      aria-label="Ver informações sobre papéis"
                    >
                      <QuestionMarkCircledIcon className="w-3.5 h-3.5" />
                    </button>
                    {showTooltip === 'roles' && (
                      <div className="absolute left-0 top-full mt-2 z-10 w-72 p-3 bg-slate-800 dark:bg-slate-950 text-white rounded-lg shadow-xl border border-slate-700 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                        <p className="text-[10px] font-bold mb-2 text-slate-200">PAPÉIS E PERMISSÕES</p>
                        <div className="space-y-2">
                          {ROLES.map((r) => (
                            <div key={r.value} className="text-[10px]">
                              <span className="font-semibold text-slate-100">{r.label}:</span>{' '}
                              <span className="text-slate-300">{r.tooltip}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-700">
                          <p className="text-[10px] text-slate-400 italic">
                            O papel pode ser alterado depois pelo administrador.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((roleOption) => (
                    <button
                      key={roleOption.value}
                      type="button"
                      onClick={() => setRole(roleOption.value)}
                      className={`group relative p-2.5 border rounded-lg text-left transition-all ${
                        role === roleOption.value
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

              {/* Campo de Mensagem Pessoal (Opcional) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mensagem Pessoal <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <span className={`text-[10px] ${personalMessage.length > MESSAGE_MAX_LENGTH - 20 ? 'text-amber-500' : 'text-slate-400'}`}>
                    {personalMessage.length}/{MESSAGE_MAX_LENGTH}
                  </span>
                </div>
                <textarea
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value.slice(0, MESSAGE_MAX_LENGTH))}
                  placeholder="Ex: Olá! Você está convidado a fazer parte da nossa equipe..."
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none transition-all resize-none"
                />
              </div>

              {/* Convites já enviados nesta sessão */}
              {sentInvites.length > 0 && (
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Convites desta sessão ({sentInvites.length})
                  </p>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto">
                    {sentInvites.map((inv, idx) => (
                      <div 
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded-md text-xs ${
                          inv.status === 'success' 
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {inv.status === 'success' ? (
                            <CheckCircledIcon className="w-3.5 h-3.5 flex-shrink-0" />
                          ) : (
                            <ExclamationTriangleIcon className="w-3.5 h-3.5 flex-shrink-0" />
                          )}
                          <span className="truncate font-medium">{inv.email}</span>
                          <span className="text-[10px] opacity-70">
                            ({ROLES.find(r => r.value === inv.role)?.label || inv.role})
                          </span>
                        </div>
                        {inv.status === 'error' && (
                          <button
                            type="button"
                            onClick={() => handleRetry(inv.email)}
                            className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold hover:underline flex-shrink-0"
                          >
                            <ReloadIcon className="w-3 h-3" />
                            Tentar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info box */}
              <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg">
                <EnvelopeClosedIcon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  O convidado receberá um email para aceitar o convite. Você pode enviar múltiplos convites em sequência.
                </p>
              </div>
            </form>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div className="text-[10px] text-slate-400">
                {hasSentInvites && (
                  <span className="flex items-center gap-1">
                    <CheckCircledIcon className="w-3 h-3 text-emerald-500" />
                    {sentInvites.filter(i => i.status === 'success').length} convite(s) enviado(s)
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleClose} 
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
                  aria-label="Fechar modal"
                >
                  {hasSentInvites ? 'Concluir' : 'Cancelar'}
                </button>
                <button 
                  onClick={handleInvite}
                  disabled={!isFormValid}
                  data-testid="invite-submit-btn"
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-black text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  aria-label="Enviar convite"
                  title="Enviar convite (Enter)"
                >
                  <PaperPlaneIcon className="w-3.5 h-3.5" />
                  {hasSentInvites ? 'Enviar outro' : 'Enviar convite'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InviteMemberModal;
