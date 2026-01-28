'use client';

import { useEffect, useCallback } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface KeyboardShortcut {
  key: string;
  label: string;
  action: () => void;
  category: 'phase' | 'event' | 'navigation';
}

interface GameTimeKeyboardHandlerProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  showHelpOnLoad?: boolean;
  onShortcutTriggered?: (shortcut: KeyboardShortcut) => void;
}

// =============================================================================
// PREDEFINED SHORTCUTS - Atalhos padrão de handebol
// =============================================================================

export function createHandballGameShortcuts(actions: {
  onDefense?: () => void;
  onCounterAttack?: () => void;
  onPositionalAttack?: () => void;
  onDefensiveTransition?: () => void;
  onGoal?: () => void;
  onShot?: () => void;
  onSave?: () => void;
  onTurnover?: () => void;
  onFoul?: () => void;
  onSevenMeter?: () => void;
  onUndo?: () => void;
  onHelp?: () => void;
}): KeyboardShortcut[] {
  return [
    // Fases do jogo
    { key: '1', label: 'Defesa', action: actions.onDefense || (() => {}), category: 'phase' },
    { key: '2', label: 'Contra-ataque', action: actions.onCounterAttack || (() => {}), category: 'phase' },
    { key: '3', label: 'Ataque posicional', action: actions.onPositionalAttack || (() => {}), category: 'phase' },
    { key: '4', label: 'Transição defensiva', action: actions.onDefensiveTransition || (() => {}), category: 'phase' },
    
    // Eventos
    { key: 'g', label: 'Gol', action: actions.onGoal || (() => {}), category: 'event' },
    { key: 's', label: 'Arremesso', action: actions.onShot || (() => {}), category: 'event' },
    { key: 'd', label: 'Defesa goleiro', action: actions.onSave || (() => {}), category: 'event' },
    { key: 't', label: 'Turnover', action: actions.onTurnover || (() => {}), category: 'event' },
    { key: 'f', label: 'Falta', action: actions.onFoul || (() => {}), category: 'event' },
    { key: '7', label: '7 metros', action: actions.onSevenMeter || (() => {}), category: 'event' },
    
    // Navegação
    { key: 'z', label: 'Desfazer', action: actions.onUndo || (() => {}), category: 'navigation' },
    { key: '?', label: 'Ajuda', action: actions.onHelp || (() => {}), category: 'navigation' },
  ];
}

// =============================================================================
// COMPONENT
// =============================================================================

export function GameTimeKeyboardHandler({ 
  shortcuts, 
  enabled = true,
  showHelpOnLoad = false,
  onShortcutTriggered 
}: GameTimeKeyboardHandlerProps) {
  
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    // Ignorar se estiver em input/textarea/select
    const target = e.target as HTMLElement;
    const isInputElement = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
    const isContentEditable = target.isContentEditable;
    
    if (isInputElement || isContentEditable) {
      return;
    }

    const key = e.key.toLowerCase();
    const shortcut = shortcuts.find(s => s.key.toLowerCase() === key);
    
    if (shortcut) {
      e.preventDefault();
      shortcut.action();
      
      // Callback para feedback externo (ex: toast)
      onShortcutTriggered?.(shortcut);
      
      // Log para debug
      console.log(`🎮 Shortcut triggered: ${shortcut.label} (${shortcut.key})`);
    }
  }, [shortcuts, enabled, onShortcutTriggered]);

  // Registrar event listener
  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [handleKeyPress, enabled]);

  // Mostrar ajuda inicial
  useEffect(() => {
    if (showHelpOnLoad && enabled) {
      console.log('💡 Atalhos de teclado disponíveis:');
      console.table(shortcuts.map(s => ({ 
        Tecla: s.key.toUpperCase(), 
        Ação: s.label,
        Categoria: s.category 
      })));
    }
  }, [showHelpOnLoad, enabled, shortcuts]);

  // Componente invisível - apenas lógica
  return null;
}

// =============================================================================
// HELPER - Para mostrar modal de ajuda
// =============================================================================

export function getShortcutsByCategory(shortcuts: KeyboardShortcut[]) {
  return shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);
}

export function formatShortcutKey(key: string): string {
  const specialKeys: Record<string, string> = {
    'arrowup': '↑',
    'arrowdown': '↓',
    'arrowleft': '←',
    'arrowright': '→',
    'enter': '⏎',
    'escape': 'Esc',
    'space': 'Space',
  };
  
  return specialKeys[key.toLowerCase()] || key.toUpperCase();
}
