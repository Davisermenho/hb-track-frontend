'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Cross2Icon, ReloadIcon, InfoCircledIcon, CheckCircledIcon, PersonIcon } from '@radix-ui/react-icons';
import { Team } from '@/types/teams-v2';
import { teamsService } from '@/lib/api/teams';
import { mapApiTeamToV2 } from '@/lib/adapters/teams-v2-adapter';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTeam: Team) => void;
  onError: (message: string) => void;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ isOpen, onClose, onSuccess, onError }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teamName, setTeamName] = useState('');
  const [gender, setGender] = useState('');
  const [category, setCategory] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdTeamName, setCreatedTeamName] = useState('');
  const [validationError, setValidationError] = useState('');
  const [genderError, setGenderError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  
  // Refs para foco
  const nameInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Verificar se há dados não salvos
  const hasUnsavedData = teamName.trim() !== '' || gender !== '' || category !== '';

  // Reset form ao abrir modal
  useEffect(() => {
    if (isOpen) {
      setTeamName('');
      setGender('');
      setCategory('');
      setValidationError('');
      setGenderError('');
      setCategoryError('');
      setIsCreating(false);
      setShowSuccess(false);
      setCreatedTeamName('');
      setShowCloseConfirm(false);
      
      // Foco automático no campo de nome após animação
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Validação em tempo real
  useEffect(() => {
    if (teamName.length === 0) {
      setValidationError('');
    } else if (teamName.trim().length < 3) {
      setValidationError('O nome deve ter no mínimo 3 caracteres');
    } else {
      setValidationError('');
    }
  }, [teamName]);

  // Handler para tentar fechar com confirmação
  const handleTryClose = useCallback(() => {
    if (isCreating) return;
    
    if (hasUnsavedData) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  }, [isCreating, hasUnsavedData, onClose]);

  // Eventos de teclado
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isCreating) {
        if (showCloseConfirm) {
          setShowCloseConfirm(false);
        } else {
          handleTryClose();
        }
      } else if (e.key === 'Enter' && !isCreating && isFormValid && !showCloseConfirm) {
        handleCreateTeam();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCreating, teamName, showCloseConfirm, handleTryClose]);

  const isFormValid = teamName.trim().length >= 3 && validationError === '' && gender !== '' && category !== '';

  const handleCreateTeam = async () => {
    if (!isFormValid || isCreating) return;

    setIsCreating(true);

    try {
      // O select já retorna valores corretos:
      // category vem como string "1", "2", "3", etc.
      // gender vem como "masculino" ou "feminino"
      const selectedCategoryId = parseInt(category);
      const selectedGender = gender as 'feminino' | 'masculino';

      console.log('🔍 [CreateTeam] Criando equipe:', {
        name: teamName.trim(),
        category_id: selectedCategoryId,
        gender: selectedGender
      });

      // Criar equipe via API - o backend já valida duplicatas
      const apiTeam = await teamsService.create({
        name: teamName.trim(),
        category_id: selectedCategoryId,
        gender: selectedGender,
        is_our_team: true
      });

      // Converter para formato Teams-v2
      const newTeam = mapApiTeamToV2(apiTeam);

      // Guardar nome para exibir no sucesso
      setCreatedTeamName(teamName.trim());

      // Mostrar estado de sucesso
      setShowSuccess(true);
      
      // Toast de sucesso
      toast.success('Equipe criada com sucesso!', {
        description: `${teamName.trim()} está pronta para receber membros.`
      });

      // Aguardar um pouco e então fechar + callback
      setTimeout(() => {
        onClose();
        onSuccess(newTeam);
      }, 800);

    } catch (error) {
      console.error('❌ Erro ao criar equipe:', error);
      let errorMessage = 'Não foi possível criar a equipe. Tente novamente.';
      
      // Extrair mensagem de erro do backend
      if (error && typeof error === 'object') {
        const err = error as any;
        if (err.response?.data?.detail) {
          const detail = err.response.data.detail;
          errorMessage = typeof detail === 'string' ? detail : detail.message || errorMessage;
        } else if (err.message) {
          errorMessage = err.message;
        }
      }
      
      setValidationError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Dialog de confirmação de fechamento */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setShowCloseConfirm(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#0f0f0f] shadow-2xl rounded-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <div className="p-5 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <InfoCircledIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Descartar alterações?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Você tem dados não salvos. Deseja realmente fechar sem criar a equipe?
              </p>
            </div>
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
              >
                Continuar editando
              </button>
              <button
                onClick={() => {
                  setShowCloseConfirm(false);
                  onClose();
                }}
                className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
        onClick={handleTryClose}
      ></div>
      <div 
        ref={modalRef} 
        data-testid="create-team-modal"
        className="relative w-full max-w-lg bg-white dark:bg-[#0f0f0f] shadow-2xl rounded-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800"
      >
        {/* Estado de sucesso */}
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <CheckCircledIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900 dark:text-white">Equipe criada!</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{createdTeamName}</p>
            </div>
          </div>
        ) : isCreating ? (
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
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Criando equipe...</p>
            <style jsx>{`
              @keyframes loading-bar {
                0% { width: 0%; margin-left: 0%; }
                50% { width: 70%; margin-left: 15%; }
                100% { width: 0%; margin-left: 100%; }
              }
            `}</style>
          </div>
        ) : (
        <>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
              <PersonIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            <h2 className="text-lg font-heading font-bold tracking-tight text-slate-900 dark:text-white">Criar nova equipe</h2>
          </div>
          <button 
            onClick={handleTryClose} 
            data-testid="close-modal-btn"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Fechar modal"
            title="Fechar (Esc)"
            disabled={isCreating}
          >
            <Cross2Icon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleCreateTeam(); }} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="team-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nome da equipe <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameInputRef}
              id="team-name"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Ex: Sub-17, Feminino Elite, Técnico João"
              data-testid="team-name-input"
              className={`w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-950 border rounded-lg ${
                validationError 
                  ? 'border-red-500 dark:border-red-500 focus:ring-red-500' 
                  : 'border-slate-200 dark:border-slate-800 focus:ring-slate-900 dark:focus:ring-slate-100'
              } focus:ring-2 focus:ring-offset-0 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isCreating}
              aria-invalid={!!validationError}
              aria-describedby={validationError ? 'name-error' : 'name-help'}
            />
            {validationError ? (
              <p id="name-error" data-testid="team-name-error" className="text-[10px] text-red-500 font-medium">{validationError}</p>
            ) : (
              <p id="name-help" className="text-[10px] text-slate-400">O nome deve ser único para facilitar a identificação nos relatórios.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Gênero <span className="text-red-500">*</span>
            </label>
            <select 
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              data-testid="team-gender-select"
              className={`w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border ${
                genderError
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-slate-200 dark:border-slate-800'
              } outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isCreating}
              aria-invalid={!!genderError}
            >
              <option value="">Selecione o gênero...</option>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
            </select>
            {genderError && (
              <p data-testid="team-gender-error" className="text-[10px] text-red-500 font-medium">{genderError}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Categoria <span className="text-red-500">*</span>
            </label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              data-testid="team-category-select"
              className={`w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border ${
                categoryError
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-slate-200 dark:border-slate-800'
              } outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isCreating}
              aria-invalid={!!categoryError}
            >
              <option value="">Selecione uma categoria...</option>
              <option value="1">Mirim</option>
              <option value="2">Infantil</option>
              <option value="3">Cadete</option>
              <option value="4">Juvenil</option>
              <option value="5">Júnior</option>
              <option value="6">Adulto</option>
              <option value="7">Master</option>
            </select>
            {categoryError && (
              <p data-testid="team-category-error" className="text-[10px] text-red-500 font-medium">{categoryError}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Clube (Organização)</label>
              <input
                type="text"
                value="IDEC"
                className="w-full px-3 py-2.5 text-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none cursor-not-allowed text-slate-500 dark:text-slate-500"
                disabled
                readOnly
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Temporada</label>
              <input
                type="text"
                value="2026"
                className="w-full px-3 py-2.5 text-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none cursor-not-allowed text-slate-500 dark:text-slate-500"
                disabled
                readOnly
              />
            </div>
          </div>
        </form>

        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
          <button 
            onClick={handleTryClose} 
            data-testid="create-team-cancel"
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:hover:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Cancelar criação"
            disabled={isCreating}
          >
            Cancelar
          </button>
          <button 
            onClick={handleCreateTeam}
            disabled={!isFormValid || isCreating}
            data-testid="create-team-submit"
            className="px-5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-black text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            aria-label="Criar equipe"
            title="Criar equipe (Enter)"
          >
            <PersonIcon className="w-3.5 h-3.5" />
            Criar equipe
          </button>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default CreateTeamModal;
