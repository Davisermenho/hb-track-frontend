/**
 * Componente de Histórico de Auditoria
 * 
 * Conforme REGRAS_GERENCIAMENTO_ATLETAS.md:
 * - R30: Ações críticas auditáveis
 * - R31: Log obrigatório (actor_id, timestamp, action, context, old_value, new_value)
 * - R34: Imutabilidade dos logs
 */

"use client";

import React, { useState, useEffect } from "react";
import { History, User, Calendar, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

export interface AuditLogEntry {
  id: string;
  actor_id: string;
  actor_name?: string;
  actor_email?: string;
  timestamp: string;
  action: string;
  entity_type: string;
  entity_id: string;
  context?: string;
  old_value?: Record<string, unknown> | string;
  new_value?: Record<string, unknown> | string;
  justification?: string;
}

interface AuditHistoryProps {
  entityType: 'athlete' | 'team_registration' | 'person';
  entityId: string;
  logs?: AuditLogEntry[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  'create': { label: 'Criação', color: 'bg-green-100 text-green-800', icon: '➕' },
  'update': { label: 'Atualização', color: 'bg-blue-100 text-blue-800', icon: '✏️' },
  'delete': { label: 'Exclusão', color: 'bg-red-100 text-red-800', icon: '🗑️' },
  'state_change': { label: 'Mudança de Estado', color: 'bg-yellow-100 text-yellow-800', icon: '🔄' },
  'flag_change': { label: 'Alteração de Flag', color: 'bg-purple-100 text-purple-800', icon: '🚩' },
  'document_edit': { label: 'Edição de Documento', color: 'bg-orange-100 text-orange-800', icon: '📄' },
  'registration_start': { label: 'Início de Vínculo', color: 'bg-green-100 text-green-800', icon: '🤝' },
  'registration_end': { label: 'Encerramento de Vínculo', color: 'bg-gray-100 text-gray-800', icon: '👋' },
};

const FIELD_LABELS: Record<string, string> = {
  'athlete_name': 'Nome',
  'birth_date': 'Data de Nascimento',
  'athlete_rg': 'RG',
  'athlete_cpf': 'CPF',
  'athlete_email': 'Email',
  'athlete_phone': 'Telefone',
  'state': 'Estado',
  'injured': 'Lesionada',
  'medical_restriction': 'Restrição Médica',
  'suspended_until': 'Suspensa Até',
  'load_restricted': 'Carga Restrita',
  'main_defensive_position_id': 'Posição Defensiva Principal',
  'main_offensive_position_id': 'Posição Ofensiva Principal',
  'gender': 'Gênero',
  'guardian_name': 'Nome do Responsável',
  'guardian_phone': 'Telefone do Responsável',
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ChangeDetail({ 
  oldValue, 
  newValue 
}: { 
  oldValue?: Record<string, unknown> | string; 
  newValue?: Record<string, unknown> | string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!oldValue && !newValue) return null;

  // Se são objetos, mostrar diff
  if (typeof oldValue === 'object' && typeof newValue === 'object') {
    const allKeys = new Set([
      ...Object.keys(oldValue || {}),
      ...Object.keys(newValue || {}),
    ]);

    const changes = Array.from(allKeys)
      .filter(key => {
        const oldVal = (oldValue as Record<string, unknown>)?.[key];
        const newVal = (newValue as Record<string, unknown>)?.[key];
        return JSON.stringify(oldVal) !== JSON.stringify(newVal);
      })
      .map(key => ({
        field: key,
        label: FIELD_LABELS[key] || key,
        old: (oldValue as Record<string, unknown>)?.[key],
        new: (newValue as Record<string, unknown>)?.[key],
      }));

    if (changes.length === 0) return null;

    return (
      <div className="mt-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {changes.length} campo(s) alterado(s)
        </button>
        
        {isExpanded && (
          <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
            {changes.map(change => (
              <div key={change.field} className="text-xs">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {change.label}:
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded line-through dark:bg-red-900/30 dark:text-red-400">
                    {formatValue(change.old)}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded dark:bg-green-900/30 dark:text-green-400">
                    {formatValue(change.new)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Valores simples
  return (
    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
      <span className="line-through text-red-600 dark:text-red-400">{formatValue(oldValue)}</span>
      <span className="mx-2">→</span>
      <span className="text-green-600 dark:text-green-400">{formatValue(newValue)}</span>
    </div>
  );
}

export default function AuditHistory({
  entityType,
  entityId,
  logs = [],
  isLoading = false,
  onLoadMore,
  hasMore = false,
}: AuditHistoryProps) {
  if (isLoading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-500 dark:text-gray-400">Carregando histórico...</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Nenhum registro de auditoria encontrado.</p>
        <p className="text-sm mt-1">Alterações serão registradas aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
        <History className="h-5 w-5" />
        <h3 className="font-semibold">Histórico de Alterações</h3>
        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
          {logs.length} registro(s)
        </span>
      </div>

      <div className="space-y-3">
        {logs.map((log) => {
          const actionConfig = ACTION_LABELS[log.action] || {
            label: log.action,
            color: 'bg-gray-100 text-gray-800',
            icon: '📝',
          };

          return (
            <div
              key={log.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-lg">{actionConfig.icon}</span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionConfig.color}`}>
                        {actionConfig.label}
                      </span>
                      {log.context && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {log.context}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <User className="h-3 w-3" />
                      <span>{log.actor_name || log.actor_email || 'Sistema'}</span>
                      <Calendar className="h-3 w-3 ml-2" />
                      <span>{formatDate(log.timestamp)}</span>
                    </div>

                    {log.justification && (
                      <div className="mt-2 flex items-start gap-2 text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 p-2 rounded">
                        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span><strong>Justificativa:</strong> {log.justification}</span>
                      </div>
                    )}

                    <ChangeDetail oldValue={log.old_value} newValue={log.new_value} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && onLoadMore && (
        <button
          onClick={onLoadMore}
          disabled={isLoading}
          className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Carregando...' : 'Carregar mais'}
        </button>
      )}
    </div>
  );
}
