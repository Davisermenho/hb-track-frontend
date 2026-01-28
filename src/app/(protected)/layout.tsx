"use client";

import { useState } from 'react';
import { ProfessionalSidebar } from '@/components/Layout/ProfessionalSidebar';
import { TopBar } from '@/components/Layout/TopBar';
import { MobileSidebarProvider, MobileDrawer, useMobileSidebar } from '@/components/Sidebar';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { SendMessageModal } from '@/components/ui/SendMessageModal';
import { TeamSeasonProvider } from '@/context/TeamSeasonContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import React, { useEffect } from "react";

// Inner component that can use useMobileSidebar
function ProtectedLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const router = useRouter();
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const { toggle: toggleMobileSidebar } = useMobileSidebar();

  // Verificar autenticação antes de renderizar
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Preservar callbackUrl para retornar após login
      const callbackUrl = window.location.pathname + window.location.search;
      router.push(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
  };

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Carregando...
          </p>
        </div>
      </div>
    );
  }

  // Não renderizar se não autenticado
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <ProfessionalSidebar />
      </div>

      {/* Mobile Sidebar Drawer */}
      <MobileDrawer>
        <ProfessionalSidebar />
      </MobileDrawer>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onLogout={handleLogout} onMenuClick={toggleMobileSidebar} />
        <main className="flex-1 overflow-y-auto pt-14">
          {children}
        </main>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton 
        onSendMessage={() => setIsMessageModalOpen(true)}
      />

      {/* Send Message Modal */}
      <SendMessageModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        teamName="Minha Equipe"
      />
    </div>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TeamSeasonProvider>
      <NotificationProvider>
        <MobileSidebarProvider>
          <ProtectedLayoutInner>{children}</ProtectedLayoutInner>
        </MobileSidebarProvider>
      </NotificationProvider>
    </TeamSeasonProvider>
  );
}
