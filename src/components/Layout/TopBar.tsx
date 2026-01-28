'use client';

/**
 * TopBar - Barra superior do aplicativo v2.0
 * 
 * Inclui:
 * - Menu hamburger (mobile)
 * - Breadcrumbs (somente em rotas profundas)
 * - Busca global (Ctrl+K)
 * - Status de sincronização
 * - Notificações
 * - Ajuda/Feedback
 * - Menu do usuário
 * 
 * @version 2.0.0
 */

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  User,
  Settings,
  LogOut,
  Menu,
  Search,
  Shield,
  Keyboard,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

// Componentes TopBar
import { Breadcrumbs } from '@/components/TopBar/Breadcrumbs';
import { CommandPalette } from '@/components/TopBar/CommandPalette';
import { SyncStatusIndicator } from '@/components/TopBar/SyncStatusIndicator';
import { NotificationDropdown } from '@/components/TopBar/NotificationDropdown';
import { HelpDropdown } from '@/components/TopBar/HelpDropdown';

// =============================================================================
// TIPOS
// =============================================================================

interface TopBarProps {
  onLogout?: () => void;
  onMenuClick?: () => void;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function TopBar({ onLogout, onMenuClick }: TopBarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Atalho global Ctrl+K
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Adaptar papel por gênero
  const getRoleLabel = () => {
    const baseRole = user.role_name || user.role;
    const isFeminine = user.gender === 'feminino';

    if (!isFeminine) return baseRole;

    const roleMap: Record<string, string> = {
      Treinador: 'Treinadora',
      Coordenador: 'Coordenadora',
      Dirigente: 'Dirigente',
      Membro: 'Membro',
      'Super Administrador': 'Super Administradora',
    };

    return roleMap[baseRole] || baseRole;
  };

  const roleLabel = getRoleLabel();

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      await logout();
    }
  };

  const navigateTo = (path: string) => {
    setIsUserMenuOpen(false);
    router.push(path);
  };

  // Verificar se é admin (pode ser admin ou role_name = 'Super Administrador')
  const isAdmin = user.role === 'admin' || user.role_name === 'Super Administrador';

  return (
    <>
      {/* TopBar */}
      <div className="fixed top-0 right-0 left-0 md:left-[220px] z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="h-14 px-4 md:px-6 flex items-center justify-between gap-3">
          {/* Lado esquerdo - Menu mobile + Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Hamburger menu (mobile) */}
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Breadcrumbs - só aparece em desktop e rotas profundas */}
            <div className="hidden md:block overflow-hidden">
              <Breadcrumbs />
            </div>
          </div>

          {/* Lado direito - Ações */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Botão de busca */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Buscar (Ctrl+K)"
            >
              <Search className="w-4 h-4" />
              <span className="hidden lg:block text-sm">Buscar</span>
              <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                <span>⌘</span>
                <span>K</span>
              </kbd>
            </button>

            {/* Separador */}
            <div className="hidden md:block w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Status de Sincronização */}
            <SyncStatusIndicator size="sm" />

            {/* Notificações */}
            <NotificationDropdown />

            {/* Ajuda */}
            <HelpDropdown />

            {/* Separador */}
            <div className="hidden md:block w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Menu do usuário */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-semibold overflow-hidden flex-shrink-0">
                  {user.photo_url ? (
                    <Image
                      src={user.photo_url}
                      alt={user.name}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                {/* Chevron */}
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200',
                    isUserMenuOpen && 'rotate-180'
                  )}
                />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    {/* Header do usuário */}
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center text-sm font-semibold overflow-hidden flex-shrink-0">
                          {user.photo_url ? (
                            <Image
                              src={user.photo_url}
                              alt={user.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                          <p className="text-[10px] text-brand-500 dark:text-brand-400 font-medium mt-0.5">
                            {roleLabel}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <button
                        onClick={() => navigateTo('/profile')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>Meu Perfil</span>
                      </button>

                      <button
                        onClick={() => navigateTo('/settings')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Configurações</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => navigateTo('/admin')}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          <span>Administração</span>
                        </button>
                      )}

                      <button
                        onClick={() => setIsCommandPaletteOpen(true)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Keyboard className="w-4 h-4" />
                          <span>Busca rápida</span>
                        </div>
                        <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded">
                          ⌘K
                        </kbd>
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sair</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Command Palette (Modal) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </>
  );
}
