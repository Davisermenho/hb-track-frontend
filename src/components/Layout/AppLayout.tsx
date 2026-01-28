'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProfessionalSidebar } from '@/components/Layout/ProfessionalSidebar';
import { TopBar } from '@/components/Layout/TopBar';
import { MobileSidebarProvider, MobileDrawer, useMobileSidebar } from '@/components/Sidebar';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { SendMessageModal } from '@/components/ui/SendMessageModal';
import { TeamSeasonProvider } from '@/context/TeamSeasonContext';
import { useAuth } from '@/context/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

function AppLayoutInner({ children }: AppLayoutProps) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const router = useRouter();
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const { toggle: toggleMobileSidebar } = useMobileSidebar();

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

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <div className="hidden md:block">
        <ProfessionalSidebar />
      </div>

      <MobileDrawer>
        <ProfessionalSidebar />
      </MobileDrawer>

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onLogout={handleLogout} onMenuClick={toggleMobileSidebar} />
        <main className="flex-1 overflow-y-auto pt-14">
          {children}
        </main>
      </div>

      <FloatingActionButton
        onSendMessage={() => setIsMessageModalOpen(true)}
      />

      <SendMessageModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        teamName="Minha Equipe"
      />
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <TeamSeasonProvider>
      <MobileSidebarProvider>
        <AppLayoutInner>{children}</AppLayoutInner>
      </MobileSidebarProvider>
    </TeamSeasonProvider>
  );
}
