'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Cross2Icon, ReloadIcon, GearIcon, InfoCircledIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Team } from '@/types/teams-v2';
import { teamsService } from '@/lib/api/teams';
import { useToast } from '@/context/ToastContext';
import { useTeamPermissions } from '@/lib/hooks/useTeamPermissions';

interface ConfigureTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedTeam: Team) => void;
  team: Team;
}

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 50;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ConfigureTeamModal: React.FC<ConfigureTeamModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  team,
}) => {
  // Refs
  const nameInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // State
  const [name, setName] = useState(team.name || '');
  
  // Validation state
  const [nameError, setNameError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // API state
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Hooks
  const { toast } = useToast();
  const { canManageTeam } = useTeamPermissions(team.id);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Reset e focus ao abrir
  useEffect(() => {
    if (isOpen) {
      // Reset para valores originais
      setName(team.name || '');
      setNameError('');
      setApiError(null);
      setIsSaving(false);
      setHasUnsavedChanges(false);
      setShowCloseConfirm(false);

      // Auto-focus no campo nome
      setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      }, 100);
    }
  }, [isOpen, team]);

  // Detectar alterações não salvas
  useEffect(() => {
    const nameChanged = name !== (team.name || '');
    setHasUnsavedChanges(nameChanged);
  }, [name, team]);

  // Validação do nome em tempo real
  useEffect(() => {
    if (name.length === 0) {
      setNameError('');
    } else if (name.trim().length < NAME_MIN_LENGTH) {
      setNameError(`Nome deve ter pelo menos ${NAME_MIN_LENGTH} caracteres`);
    } else if (name.trim().length > NAME_MAX_LENGTH) {
      setNameError(`Nome não pode ter mais de ${NAME_MAX_LENGTH} caracteres`);
    } else {
      setNameError('');
    }
  }, [name]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleTryClose();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && isFormValid && !isSaving) {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, name, hasUnsavedChanges]);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const isFormValid = name.trim().length >= NAME_MIN_LENGTH && 
                      name.trim().length <= NAME_MAX_LENGTH && 
                      nameError === '';

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleTryClose = useCallback(() => {
    if (isSaving) return;

    if (hasUnsavedChanges) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  }, [isSaving, hasUnsavedChanges, onClose]);

  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowCloseConfirm(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSaving) {
      handleTryClose();
    }
  };

  const handleSave = async () => {
    if (!isFormValid || isSaving) return;

    // Verificar permissão
    if (!canManageTeam) {
      setApiError('Você não tem permissão para editar esta equipe.');
      return;
    }

    setIsSaving(true);
    setApiError(null);

    try {
      // Preparar dados para atualização
      const updateData = {
        name: name.trim(),
      };

      // Chamar API (método update do teamsService)
      const apiTeam = await teamsService.update(team.id, updateData);

      // Mapear resposta da API para o tipo Team local
      const updatedTeam: Team = {
        ...team,
        name: apiTeam.name,
      };

      // Sucesso - fechar modal e notificar
      toast.success('Equipe atualizada com sucesso!');
      onSuccess(updatedTeam);
      onClose();
    } catch (error: any) {
      console.error('❌ [ConfigureTeamModal] Erro ao salvar:', error);

      // Extrair mensagem de erro
      let errorMessage = 'Não foi possível salvar as alterações.';

      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Traduzir erros comuns
      if (errorMessage.includes('already exists') || errorMessage.includes('já existe')) {
        errorMessage = 'Já existe uma equipe com esse nome.';
      } else if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        errorMessage = 'Você não tem permissão para editar esta equipe.';
      } else if (errorMessage.includes('500')) {
        errorMessage = 'Erro no servidor. Tente novamente em alguns instantes.';
      } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
        errorMessage = 'Erro de conexão. Verifique sua internet.';
      }

      setApiError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetry = () => {
    setApiError(null);
    handleSave();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-md bg-white dark:bg-[#0f0f0f] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Diálogo de confirmação de fechamento */}
        {showCloseConfirm && (
          <div className="absolute inset-0 z-10 bg-white dark:bg-[#0f0f0f] flex flex-col items-center justify-center p-8 animate-in fade-in duration-200">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white mb-2">
              Descartar alterações?
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
              Você tem alterações não salvas. Deseja realmente sair?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Continuar editando
              </button>
              <button
                onClick={handleConfirmClose}
                className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors"
              >
                Descartar
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
              <GearIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            <h2 className="text-lg font-heading font-bold tracking-tight text-slate-900 dark:text-white">
              Configurar Equipe
            </h2>
          </div>
          <button
            onClick={handleTryClose}
            disabled={isSaving}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Fechar modal"
            title="Fechar (Esc)"
          >
            <Cross2Icon className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSave(); }}
          className="p-5 space-y-5"
        >
          {/* Erro da API */}
          {apiError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">{apiError}</p>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
                  >
                    <ReloadIcon className="w-3 h-3" />
                    Tentar novamente
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Nome da equipe */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nome da equipe <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Sub-17 Masculino"
              maxLength={NAME_MAX_LENGTH}
              disabled={isSaving}
              className={`w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-950 border rounded-lg transition-all ${
                nameError
                  ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                  : 'border-slate-200 dark:border-slate-800 focus:ring-slate-900 dark:focus:ring-slate-100'
              } focus:ring-1 outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-invalid={!!nameError}
            />
            <div className="flex items-center justify-between">
              {nameError ? (
                <p className="text-[10px] text-red-500 font-medium">{nameError}</p>
              ) : (
                <p className="text-[10px] text-slate-400">
                  {NAME_MIN_LENGTH}-{NAME_MAX_LENGTH} caracteres
                </p>
              )}
              <span className={`text-[10px] ${
                name.length > NAME_MAX_LENGTH ? 'text-red-500' : 'text-slate-400'
              }`}>
                {name.length}/{NAME_MAX_LENGTH}
              </span>
            </div>
          </div>

          {/* Campos somente leitura */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Categoria
              </label>
              <input
                type="text"
                value={team.category || 'Não definida'}
                disabled
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Gênero
              </label>
              <input
                type="text"
                value={team.gender || 'Não definido'}
                disabled
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed capitalize"
              />
            </div>
          </div>

          {/* Info box */}
          <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg">
            <InfoCircledIcon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Alterações serão aplicadas imediatamente a todos os membros da equipe.
              Categoria e gênero não podem ser alterados após a criação.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && !isSaving && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium animate-in fade-in duration-300">
                • Alterações não salvas
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTryClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isFormValid || isSaving || !hasUnsavedChanges}
              className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-black text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[100px] justify-center"
            >
              {isSaving ? (
                <>
                  <ReloadIcon className="w-3.5 h-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar alterações'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigureTeamModal;
