'use client';

import { Modal } from '@/components/ui/modal';
import { Keyboard, Target, Save, Slash, Shield, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItemProps {
  keys: string[];
  description: string;
  icon?: React.ElementType;
}

function ShortcutItem({ keys, description, icon: Icon }: ShortcutItemProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
            <Icon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          </div>
        )}
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {description}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <kbd
            key={index}
            className={cn(
              'px-2 py-1 text-xs font-semibold',
              'bg-gray-100 dark:bg-gray-800',
              'border border-gray-300 dark:border-gray-700',
              'rounded shadow-sm',
              'text-gray-700 dark:text-gray-300'
            )}
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}

export function ShortcutsHelpModal({ isOpen, onClose }: ShortcutsHelpModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-3xl w-full"
    >
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Keyboard className="w-5 h-5 text-brand-500" />
          Atalhos de Teclado
        </h2>
        {/* Eventos Principais */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-brand-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Eventos Principais
            </h3>
          </div>
          <div className="space-y-0">
            <ShortcutItem keys={['G']} description="Registrar Gol" icon={Target} />
            <ShortcutItem keys={['S']} description="Arremesso Errado" icon={Target} />
            <ShortcutItem keys={['D']} description="Defesa do Goleiro" icon={Save} />
            <ShortcutItem keys={['T']} description="Turnover" icon={Slash} />
            <ShortcutItem keys={['F']} description="Falta" icon={Shield} />
            <ShortcutItem keys={['7']} description="7 Metros" icon={Target} />
          </div>
        </div>

        {/* Fases do Jogo */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-brand-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Fases do Jogo
            </h3>
          </div>
          <div className="space-y-0">
            <ShortcutItem keys={['1']} description="Defesa" />
            <ShortcutItem keys={['2']} description="Contra-ataque" />
            <ShortcutItem keys={['3']} description="Ataque Posicional" />
            <ShortcutItem keys={['4']} description="Transição Defensiva" />
          </div>
        </div>

        {/* Outros */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-brand-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Outros Eventos
            </h3>
          </div>
          <div className="space-y-0">
            <ShortcutItem keys={['C']} description="Cartão Amarelo" icon={Shield} />
            <ShortcutItem keys={['R']} description="Cartão Vermelho" icon={Shield} />
            <ShortcutItem keys={['2']} description="Suspensão 2min" icon={Clock} />
            <ShortcutItem keys={['P']} description="Tempo Técnico" icon={Clock} />
          </div>
        </div>

        {/* Navegação */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Keyboard className="w-5 h-5 text-brand-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Navegação
            </h3>
          </div>
          <div className="space-y-0">
            <ShortcutItem keys={['Z']} description="Desfazer último evento" />
            <ShortcutItem keys={['?']} description="Mostrar/Ocultar ajuda" />
            <ShortcutItem keys={['Espaço']} description="Pausar/Iniciar cronômetro" />
            <ShortcutItem keys={['Esc']} description="Fechar modals" />
          </div>
        </div>

        {/* Dica */}
        <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">💡</span>
            </div>
            <div className="text-sm text-brand-900 dark:text-brand-100">
              <p className="font-semibold mb-1">Dica Pro:</p>
              <p className="text-brand-700 dark:text-brand-300">
                Clique em uma zona na quadra e depois use os atalhos para registrar eventos rapidamente. 
                Isso acelera muito o processo de scout durante a partida!
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
