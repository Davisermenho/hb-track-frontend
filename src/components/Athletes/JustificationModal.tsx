/**
 * Modal de Justificativa para Edição de Campos Sensíveis
 * 
 * Conforme REGRAS_GERENCIAMENTO_ATLETAS.md Seção 5.1:
 * - RG/CPF/Email exigem justificativa obrigatória + auditoria
 * - Data de nascimento (com vínculo) BLOQUEADA exceto exceção Dirigente
 */

"use client";

import React, { useState } from "react";
import { AlertTriangle, X, FileText, Shield } from "lucide-react";

interface JustificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (justification: string) => void;
  fieldName: string;
  fieldLabel: string;
  oldValue?: string;
  newValue?: string;
  isBlocked?: boolean;
  blockedMessage?: string;
}

const FIELD_INFO: Record<string, { icon: string; warning: string; minLength: number }> = {
  'athlete_rg': {
    icon: '🪪',
    warning: 'Alteração de RG é uma ação sensível que será auditada.',
    minLength: 10,
  },
  'athlete_cpf': {
    icon: '📋',
    warning: 'Alteração de CPF é uma ação sensível que será auditada.',
    minLength: 10,
  },
  'athlete_email': {
    icon: '📧',
    warning: 'Alteração de email afeta comunicações e pode afetar acesso ao sistema.',
    minLength: 10,
  },
  'birth_date': {
    icon: '📅',
    warning: 'Alteração de data de nascimento afeta categoria natural e elegibilidade.',
    minLength: 20,
  },
};

export default function JustificationModal({
  isOpen,
  onClose,
  onConfirm,
  fieldName,
  fieldLabel,
  oldValue,
  newValue,
  isBlocked = false,
  blockedMessage,
}: JustificationModalProps) {
  const [justification, setJustification] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fieldInfo = FIELD_INFO[fieldName] || {
    icon: '📝',
    warning: 'Esta alteração será registrada na auditoria.',
    minLength: 10,
  };

  const handleConfirm = () => {
    if (justification.trim().length < fieldInfo.minLength) {
      setError(`Justificativa deve ter no mínimo ${fieldInfo.minLength} caracteres.`);
      return;
    }
    onConfirm(justification.trim());
    setJustification('');
    setError(null);
  };

  const handleClose = () => {
    setJustification('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {isBlocked ? (
              <Shield className="h-5 w-5 text-red-500" />
            ) : (
              <FileText className="h-5 w-5 text-yellow-500" />
            )}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isBlocked ? 'Ação Bloqueada' : 'Justificativa Obrigatória'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Campo sendo alterado */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <span className="text-2xl">{fieldInfo.icon}</span>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">{fieldLabel}</div>
              {oldValue && newValue && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span className="line-through text-red-500">{oldValue}</span>
                  <span className="mx-2">→</span>
                  <span className="text-green-500">{newValue}</span>
                </div>
              )}
            </div>
          </div>

          {isBlocked ? (
            /* Mensagem de bloqueio */
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 dark:text-red-200 font-medium">
                    Edição Não Permitida
                  </p>
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {blockedMessage || 'Esta alteração não pode ser realizada.'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Aviso */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {fieldInfo.warning}
                  </p>
                </div>
              </div>

              {/* Input de justificativa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Justificativa <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={justification}
                  onChange={(e) => {
                    setJustification(e.target.value);
                    setError(null);
                  }}
                  placeholder="Descreva o motivo desta alteração..."
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                    error
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Mínimo {fieldInfo.minLength} caracteres
                  </span>
                  <span className={`text-xs ${
                    justification.length >= fieldInfo.minLength
                      ? 'text-green-500'
                      : 'text-gray-400'
                  }`}>
                    {justification.length}/{fieldInfo.minLength}
                  </span>
                </div>
                {error && (
                  <p className="text-red-500 text-xs mt-1">{error}</p>
                )}
              </div>

              {/* Info de auditoria */}
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Shield className="h-3 w-3" />
                Esta ação será registrada com seu nome, data/hora e justificativa.
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isBlocked ? 'Fechar' : 'Cancelar'}
          </button>
          {!isBlocked && (
            <button
              onClick={handleConfirm}
              disabled={justification.trim().length < fieldInfo.minLength}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Confirmar Alteração
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
