'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Cross2Icon, ReloadIcon, CalendarIcon, ExclamationTriangleIcon, CheckCircledIcon, ClockIcon } from '@radix-ui/react-icons';
import { Dumbbell } from 'lucide-react';
import { TrainingSessionsAPI, SessionCreate } from '@/lib/api/trainings';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/context/ToastContext';

interface CreateTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (trainingId: string) => void;
  teamId: string;
}

// ============================================================================
// TRAINING TYPES CONFIG
// ============================================================================

const TRAINING_TYPES = [
  { value: 'quadra', label: 'Quadra (Técnico-Tático)', icon: '🏟️' },
  { value: 'fisico', label: 'Físico', icon: '💪' },
  { value: 'video', label: 'Vídeo/Análise', icon: '📹' },
  { value: 'reuniao', label: 'Reunião Tática', icon: '📋' },
  { value: 'teste', label: 'Teste/Avaliação', icon: '📊' },
];

const CreateTrainingModal: React.FC<CreateTrainingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  teamId,
}) => {
  // Refs
  const titleInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [trainingType, setTrainingType] = useState('quadra');
  const [location, setLocation] = useState('');
  
  // Validation state
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  
  // API state
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset form ao abrir
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDate('');
      setStartTime('');
      setEndTime('');
      setTrainingType('quadra');
      setLocation('');
      setDateError('');
      setTimeError('');
      setApiError(null);
      setIsCreating(false);
      setShowSuccess(false);

      // Auto-focus no campo título
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Validação de data (não permite retroativa)
  useEffect(() => {
    if (!date) {
      setDateError('');
      return;
    }
    const selectedDate = new Date(`${date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setDateError('Não é permitido data retroativa');
    } else {
      setDateError('');
    }
    // Limpar erro de API ao editar
    setApiError(null);
  }, [date]);

  // Validação de horários (fim deve ser depois do início)
  useEffect(() => {
    if (startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      if (end <= start) {
        setTimeError('Horário de término deve ser depois do início');
      } else {
        setTimeError('');
      }
    } else {
      setTimeError('');
    }
    // Limpar erro de API ao editar
    setApiError(null);
  }, [startTime, endTime]);

  // Atalhos: Esc fecha, Ctrl/Cmd+Enter cria (quando válido)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isCreating) {
        onClose();
      }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !isCreating && isFormValid) {
        e.preventDefault();
        handleCreateTraining();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCreating, title, date, startTime, endTime, dateError, timeError]);

  const isFormValid = useMemo(() => {
    return (
      title.trim().length > 0 &&
      date.trim().length > 0 &&
      startTime.trim().length > 0 &&
      endTime.trim().length > 0 &&
      dateError === '' &&
      timeError === ''
    );
  }, [title, date, startTime, endTime, dateError, timeError]);

  const handleCreateTraining = async () => {
    if (!isFormValid || isCreating) return;
    setIsCreating(true);
    setApiError(null);
    
    try {
      // Validar organização do usuário
      if (!user?.organization_id) {
        throw new Error('Não foi possível identificar a organização. Faça login novamente.');
      }

      // Combinar data e horário de início para session_at
      const sessionDateTime = `${date}T${startTime}:00`;

      // Calcular duração em minutos
      let durationMinutes: number | undefined;
      if (startTime && endTime) {
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
      }

      const sessionData: SessionCreate = {
        organization_id: user.organization_id,
        team_id: teamId,
        session_at: sessionDateTime,
        session_type: trainingType || 'quadra',
        main_objective: title,
        duration_planned_minutes: durationMinutes,
        location: location || undefined,
      };

      const newSession = await TrainingSessionsAPI.createSession(sessionData);
      
      // Sucesso - mostrar feedback visual
      setShowSuccess(true);
      toast.success('Treino criado com sucesso!', {
        description: `${title} agendado para ${new Date(sessionDateTime).toLocaleDateString('pt-BR')}`
      });

      // Aguardar um pouco e fechar
      setTimeout(() => {
        onClose();
        onSuccess(newSession.id);
      }, 800);
    } catch (error: any) {
      console.error('❌ [CreateTrainingModal] Erro ao criar treino:', error);
      
      // Mensagens amigáveis
      let errorMessage = 'Não foi possível criar o treino.';
      
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Traduzir erros técnicos
      if (errorMessage.includes('422') || errorMessage.includes('validation')) {
        errorMessage = 'Dados inválidos. Verifique as informações e tente novamente.';
      } else if (errorMessage.includes('500')) {
        errorMessage = 'Erro no servidor. Tente novamente em alguns instantes.';
      } else if (errorMessage.includes('network')) {
        errorMessage = 'Erro de conexão. Verifique sua internet.';
      }
      
      setApiError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRetry = () => {
    setApiError(null);
    handleCreateTraining();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => !isCreating && onClose()}
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
              <p className="text-lg font-bold text-slate-900 dark:text-white">Treino criado!</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{title}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-lg font-heading font-bold tracking-tight text-slate-900 dark:text-white">
                  Criar Treino
                </h2>
              </div>
              <button
                onClick={() => !isCreating && onClose()}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Fechar modal"
                title="Fechar (Esc)"
                disabled={isCreating}
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateTraining();
              }}
              className="p-5 space-y-4"
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

              {/* Nome do treino */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nome do treino <span className="text-red-500">*</span>
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex: Preparação Tático - Defesa 6-0"
                  className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isCreating}
                />
              </div>

              {/* Local */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Local
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="ex: Ginasio principal"
                  className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isCreating}
                />
              </div>

              {/* Data e Hora Início */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    Data <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={`w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-950 border rounded-lg ${
                      dateError
                        ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                        : 'border-slate-200 dark:border-slate-800 focus:ring-slate-900 dark:focus:ring-slate-100'
                    } focus:ring-1 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={isCreating}
                    aria-invalid={!!dateError}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    Hora Início <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={`w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-950 border rounded-lg ${
                      timeError
                        ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                        : 'border-slate-200 dark:border-slate-800 focus:ring-slate-900 dark:focus:ring-slate-100'
                    } focus:ring-1 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={isCreating}
                  />
                </div>
              </div>

              {/* Hora Término */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <ClockIcon className="w-3 h-3" />
                  Hora Término <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-950 border rounded-lg ${
                    timeError
                      ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                      : 'border-slate-200 dark:border-slate-800 focus:ring-slate-900 dark:focus:ring-slate-100'
                  } focus:ring-1 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={isCreating}
                />
              </div>

              {/* Erros de validação */}
              {(dateError || timeError) && (
                <div className="space-y-1">
                  {dateError && <p className="text-[10px] text-red-500 font-medium">{dateError}</p>}
                  {timeError && <p className="text-[10px] text-red-500 font-medium">{timeError}</p>}
                </div>
              )}

              {/* Tipo de treino */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tipo de Treino
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TRAINING_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setTrainingType(type.value)}
                      disabled={isCreating}
                      className={`p-2.5 border rounded-lg text-left transition-all ${
                        trainingType === type.value
                          ? 'border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-900'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">{type.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Info box */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg">
                <CalendarIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-blue-600 dark:text-blue-400">
                  Treino sera criado como <strong>Rascunho</strong>. Complete o agendamento para publicar.
                </p>
              </div>
            </form>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => onClose()}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Cancelar"
                disabled={isCreating}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateTraining}
                disabled={!isFormValid || isCreating}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-black text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[100px] justify-center"
                aria-label="Criar treino"
                title="Criar treino (Ctrl+Enter)"
              >
                {isCreating ? (
                  <>
                    <ReloadIcon className="w-3.5 h-3.5 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Dumbbell className="w-3.5 h-3.5" />
                    Criar treino
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateTrainingModal;
