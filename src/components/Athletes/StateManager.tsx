"use client";

/**
 * StateManager - Gerenciamento de Estados e Flags do Atleta
 * 
 * Funcionalidades:
 * - Visualizar estado atual (ativa, dispensada, arquivada)
 * - Alterar estado com modal de confirmação
 * - Registrar motivo da mudança
 * - Histórico de estados
 * 
 * Regras:
 * - R12: Estados são 'ativa' | 'dispensada' | 'arquivada'
 * - R13: Lesão/afastamento são FLAGS (injured, medical_restriction, suspended_until, load_restricted)
 * - R14: "dispensada" encerra participações vigentes
 * - RF16: Alteração auditável
 */

import React, { useState, useEffect } from "react";
import {
  Activity,
  Stethoscope,
  UserX,
  MoreVertical,
  AlertTriangle,
  CheckCircle,
  History,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";

// ============================================================================
// TIPOS
// ============================================================================

// R12: Estados são 'ativa' | 'dispensada' | 'arquivada'
type AthleteState = "ativa" | "dispensada" | "arquivada";

interface StateHistory {
  id: string;
  state: AthleteState;
  reason?: string;
  notes?: string;
  started_at: string;
  ended_at?: string;
}

interface StateManagerProps {
  /** ID do atleta */
  athleteId: string;
  /** Estado atual */
  currentState: AthleteState;
  /** Callback ao atualizar estado */
  onStateChange: (newState: AthleteState, reason?: string, notes?: string) => Promise<void>;
  /** Histórico de estados (opcional) */
  history?: StateHistory[];
  /** Se está carregando histórico */
  loadingHistory?: boolean;
  /** Desabilitar alterações */
  disabled?: boolean;
  /** Classes CSS adicionais */
  className?: string;
  /** Callback para carregar histórico */
  onLoadHistory?: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

// R12: Estados são ativa, dispensada, arquivada
// R13: lesão/afastamento são FLAGS (injured, medical_restriction, suspended_until, load_restricted)
const STATE_CONFIG: Record<AthleteState, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  description: string;
}> = {
  ativa: {
    label: "Ativa",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    borderColor: "border-green-200 dark:border-green-800",
    icon: <Activity className="h-4 w-4" />,
    description: "Atleta participa normalmente de todas as atividades",
  },
  dispensada: {
    label: "Dispensada",
    color: "text-yellow-700 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    icon: <Stethoscope className="h-4 w-4" />,
    description: "Atleta liberada da equipe, pode voltar se reativada",
  },
  arquivada: {
    label: "Arquivada",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    borderColor: "border-red-200 dark:border-red-800",
    icon: <UserX className="h-4 w-4" />,
    description: "Atleta arquivada, aparece apenas em histórico",
  },
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ============================================================================
// COMPONENTE
// ============================================================================

export default function StateManager({
  athleteId,
  currentState,
  onStateChange,
  history = [],
  loadingHistory = false,
  disabled = false,
  className = "",
  onLoadHistory,
}: StateManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedState, setSelectedState] = useState<AthleteState | null>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const config = STATE_CONFIG[currentState];

  /**
   * Abre modal de confirmação para mudança de estado
   */
  const handleStateSelect = (state: AthleteState) => {
    if (state === currentState) return;
    setSelectedState(state);
    setReason("");
    setNotes("");
    setShowModal(true);
    setIsOpen(false);
  };

  /**
   * Confirma mudança de estado
   */
  const handleConfirm = async () => {
    if (!selectedState) return;
    
    setIsSubmitting(true);
    try {
      await onStateChange(selectedState, reason || undefined, notes || undefined);
      setShowModal(false);
      setSelectedState(null);
      setReason("");
      setNotes("");
    } catch (error) {
      console.error("Erro ao mudar estado:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Carrega histórico ao expandir
   */
  const handleToggleHistory = () => {
    if (!showHistory && onLoadHistory && history.length === 0) {
      onLoadHistory();
    }
    setShowHistory(!showHistory);
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-state-manager]")) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`space-y-4 ${className}`} data-state-manager>
      {/* Badge de Estado Atual */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Estado Atual
          </label>
          <div
            className={`
              inline-flex items-center gap-2 px-3 py-2 rounded-lg border
              ${config.bgColor} ${config.borderColor} ${config.color}
            `}
          >
            {config.icon}
            <span className="font-medium">{config.label}</span>
          </div>
        </div>

        {/* Dropdown de Ações */}
        {!disabled && (
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className={`
                p-2 rounded-lg border border-gray-200 dark:border-gray-700
                hover:bg-gray-100 dark:hover:bg-gray-800
                transition-colors
              `}
            >
              <MoreVertical className="h-5 w-5 text-gray-500" />
            </button>

            {isOpen && (
              <div
                className={`
                  absolute right-0 top-full mt-2 w-56
                  bg-white dark:bg-gray-800
                  border border-gray-200 dark:border-gray-700
                  rounded-lg shadow-lg z-50
                  py-1
                `}
              >
                <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Alterar Estado
                </div>
                
                {(Object.keys(STATE_CONFIG) as AthleteState[]).map((state) => {
                  const stateConfig = STATE_CONFIG[state];
                  const isCurrentState = state === currentState;
                  
                  return (
                    <button
                      key={state}
                      type="button"
                      onClick={() => handleStateSelect(state)}
                      disabled={isCurrentState}
                      className={`
                        w-full px-3 py-2 flex items-center gap-3
                        text-left text-sm
                        ${isCurrentState
                          ? "bg-gray-50 dark:bg-gray-900 opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        }
                        transition-colors
                      `}
                    >
                      <span className={stateConfig.color}>{stateConfig.icon}</span>
                      <span className={isCurrentState ? "text-gray-400" : "text-gray-700 dark:text-gray-300"}>
                        {stateConfig.label}
                      </span>
                      {isCurrentState && (
                        <span className="ml-auto text-xs text-gray-400">(atual)</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Descrição do Estado */}
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {config.description}
      </p>

      {/* Seção de Histórico */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          type="button"
          onClick={handleToggleHistory}
          className={`
            w-full flex items-center justify-between
            text-sm font-medium text-gray-700 dark:text-gray-300
            hover:text-brand-600 dark:hover:text-brand-400
            transition-colors
          `}
        >
          <span className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico de Estados
          </span>
          <ChevronRight
            className={`h-4 w-4 transition-transform ${showHistory ? "rotate-90" : ""}`}
          />
        </button>

        {showHistory && (
          <div className="mt-3 space-y-2">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                Nenhum histórico disponível
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((item) => {
                  const itemConfig = STATE_CONFIG[item.state];
                  return (
                    <div
                      key={item.id}
                      className={`
                        p-3 rounded-lg border
                        ${item.ended_at
                          ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                          : `${itemConfig.borderColor} ${itemConfig.bgColor}`
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`flex items-center gap-2 text-sm font-medium ${item.ended_at ? "text-gray-600 dark:text-gray-400" : itemConfig.color}`}>
                          {itemConfig.icon}
                          {itemConfig.label}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(item.started_at)}
                          {item.ended_at && ` - ${formatDate(item.ended_at)}`}
                        </span>
                      </div>
                      {item.reason && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          <strong>Motivo:</strong> {item.reason}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Confirmação */}
      {showModal && selectedState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className={`
              w-full max-w-md bg-white dark:bg-gray-900
              rounded-xl shadow-xl
              border border-gray-200 dark:border-gray-700
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirmar Alteração de Estado
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              {/* Alerta para dispensa */}
              {selectedState === "dispensada" && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">
                        Atenção: Ação irreversível
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Ao dispensar a atleta, todos os vínculos ativos com equipes serão encerrados automaticamente (R14).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* De -> Para */}
              <div className="flex items-center justify-center gap-4 py-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${STATE_CONFIG[currentState].bgColor} ${STATE_CONFIG[currentState].borderColor} border`}>
                  {STATE_CONFIG[currentState].icon}
                  <span className={`text-sm font-medium ${STATE_CONFIG[currentState].color}`}>
                    {STATE_CONFIG[currentState].label}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${STATE_CONFIG[selectedState].bgColor} ${STATE_CONFIG[selectedState].borderColor} border`}>
                  {STATE_CONFIG[selectedState].icon}
                  <span className={`text-sm font-medium ${STATE_CONFIG[selectedState].color}`}>
                    {STATE_CONFIG[selectedState].label}
                  </span>
                </div>
              </div>

              {/* Campo Motivo */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Motivo {selectedState === "dispensada" && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={selectedState === "dispensada" ? "Ex: Pedido de desligamento" : "Ex: Observações"}
                  className={`
                    w-full px-3 py-2 text-sm rounded-lg border
                    bg-white dark:bg-gray-800
                    border-gray-300 dark:border-gray-600
                    text-gray-900 dark:text-white
                    placeholder-gray-400
                    focus:ring-2 focus:ring-brand-500 focus:border-transparent
                  `}
                />
              </div>

              {/* Campo Observações */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Observações (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informações adicionais..."
                  rows={3}
                  className={`
                    w-full px-3 py-2 text-sm rounded-lg border resize-none
                    bg-white dark:bg-gray-800
                    border-gray-300 dark:border-gray-600
                    text-gray-900 dark:text-white
                    placeholder-gray-400
                    focus:ring-2 focus:ring-brand-500 focus:border-transparent
                  `}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg
                  border border-gray-300 dark:border-gray-600
                  text-gray-700 dark:text-gray-300
                  hover:bg-gray-50 dark:hover:bg-gray-800
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                `}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting || (selectedState === "dispensada" && !reason.trim())}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg
                  ${selectedState === "dispensada"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : selectedState === "arquivada"
                      ? "bg-gray-600 hover:bg-gray-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                  flex items-center gap-2
                `}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Alterando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Confirmar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORT TIPOS
// ============================================================================

export type { AthleteState, StateHistory, StateManagerProps };
