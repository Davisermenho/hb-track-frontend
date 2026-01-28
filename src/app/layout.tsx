import { Inter, Manrope, JetBrains_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { QueryProvider } from '@/context/QueryProvider';
import { ToastProvider } from '@/context/ToastContext';
import { E2EHarnessConditional } from '@/components/e2e/E2EHarness';
import { DevPerformancePatch } from '@/components/common/DevPerformancePatch';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'HB Tracking - Sistema de Gestão de Handebol',
  description: 'Sistema completo de gestão de atletas, treinos e relatórios de handebol',
  icons: {
    icon: '/images/hbicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} ${manrope.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`font-sans bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100`}>
        <DevPerformancePatch />
        <E2EHarnessConditional />
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider position="bottom-right">
                <SidebarProvider>{children}</SidebarProvider>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
