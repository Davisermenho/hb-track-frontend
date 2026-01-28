'use client';

/**
 * SendMessageModal - Modal para envio rápido de mensagens
 * 
 * Funcionalidades:
 * - Seleção de destinatários (equipe, atletas, comissão)
 * - Contexto automático baseado na rota atual
 * - Templates de mensagem pré-definidos
 * 
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Users,
  User,
  Shield,
  MessageSquare,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type RecipientType = 'team' | 'athletes' | 'staff' | 'individual';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipient?: RecipientType;
  teamName?: string;
}

const recipientOptions = [
  { id: 'team', label: 'Toda a Equipe', icon: Users, description: 'Enviar para todos os membros' },
  { id: 'athletes', label: 'Apenas Atletas', icon: User, description: 'Somente jogadores' },
  { id: 'staff', label: 'Comissão Técnica', icon: Shield, description: 'Treinadores e coordenadores' },
];

const messageTemplates = [
  { id: 'reminder', label: 'Lembrete de Treino', text: 'Olá! Lembrando que temos treino amanhã às [HORÁRIO]. Não esqueçam o material.' },
  { id: 'game', label: 'Convocação para Jogo', text: 'Atenção! Jogo confirmado para [DATA] às [HORÁRIO] contra [ADVERSÁRIO]. Concentração às [HORÁRIO].' },
  { id: 'cancel', label: 'Cancelamento', text: 'Informamos que o treino/jogo de [DATA] foi cancelado. Mais informações em breve.' },
  { id: 'custom', label: 'Mensagem Personalizada', text: '' },
];

export function SendMessageModal({
  isOpen,
  onClose,
  defaultRecipient = 'team',
  teamName = 'Equipe',
}: SendMessageModalProps) {
  const [recipient, setRecipient] = useState<RecipientType>(defaultRecipient);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleTemplateChange = useCallback((templateId: string) => {
    setSelectedTemplate(templateId);
    const template = messageTemplates.find(t => t.id === templateId);
    if (template) {
      setMessage(template.text);
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (!message.trim()) return;

    setIsSending(true);
    
    // TODO: Implementar envio real via API
    // await api.post('/messages', { recipient, message, teamId: ... });
    
    // Simular envio
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSending(false);
    setIsSent(true);
    
    // Fechar após mostrar confirmação
    setTimeout(() => {
      setIsSent(false);
      setMessage('');
      setSelectedTemplate('custom');
      onClose();
    }, 1500);
  }, [message, onClose]);

  const handleClose = useCallback(() => {
    if (!isSending) {
      setMessage('');
      setSelectedTemplate('custom');
      setIsSent(false);
      onClose();
    }
  }, [isSending, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
              'w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl',
              'max-h-[90vh] overflow-hidden'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Enviar Mensagem
                </h2>
              </div>
              <button
                onClick={handleClose}
                disabled={isSending}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Sucesso */}
              {isSent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-8"
                >
                  <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    Mensagem enviada!
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Equipe atual */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Enviando para</p>
                    <p className="font-medium text-gray-900 dark:text-white">{teamName}</p>
                  </div>

                  {/* Seleção de destinatários */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Destinatários
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {recipientOptions.map(option => (
                        <button
                          key={option.id}
                          onClick={() => setRecipient(option.id as RecipientType)}
                          className={cn(
                            'flex flex-col items-center p-3 rounded-lg border-2 transition-all',
                            recipient === option.id
                              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                          )}
                        >
                          <option.icon className={cn(
                            'w-5 h-5 mb-1',
                            recipient === option.id
                              ? 'text-brand-500'
                              : 'text-gray-400'
                          )} />
                          <span className={cn(
                            'text-xs font-medium',
                            recipient === option.id
                              ? 'text-brand-600 dark:text-brand-400'
                              : 'text-gray-600 dark:text-gray-400'
                          )}>
                            {option.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Templates */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Template
                    </label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600',
                        'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                        'focus:ring-2 focus:ring-brand-500 focus:border-transparent'
                      )}
                    >
                      {messageTemplates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mensagem */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mensagem
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      rows={4}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600',
                        'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                        'focus:ring-2 focus:ring-brand-500 focus:border-transparent',
                        'resize-none'
                      )}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {message.length}/500 caracteres
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {!isSent && (
              <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleClose}
                  disabled={isSending}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium',
                    'text-gray-700 dark:text-gray-300',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    'transition-colors'
                  )}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSend}
                  disabled={isSending || !message.trim()}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                    'bg-brand-500 hover:bg-brand-600 text-white',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-colors'
                  )}
                >
                  {isSending ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default SendMessageModal;
