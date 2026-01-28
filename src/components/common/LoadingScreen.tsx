'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface LoadingScreenProps {
  messages?: string[];
  interval?: number; // Tempo em ms para alternar mensagens
}

const defaultMessages = [
  'Validando credenciais...',
  'Preparando ambiente analítico...',
  'Carregando equipes...',
  'Isso levará apenas um momento...'
];

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  messages = defaultMessages,
  interval = 2000 
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, interval);

    return () => clearInterval(timer);
  }, [messages.length, interval]);

  return (
    <div className="fixed inset-0 bg-white dark:bg-[#0a0a0a] flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
        {/* Logo */}
        <div className="relative w-20 h-20 animate-pulse">
          <Image
            src="/images/logo/logo-icon.svg"
            alt="HB Track"
            fill
            className="object-contain dark:hidden"
            priority
          />
          <Image
            src="/images/logo/logo-icon-dark.svg"
            alt="HB Track"
            fill
            className="object-contain hidden dark:block"
            priority
          />
        </div>

        {/* Título */}
        <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">
          HB Track
        </h2>

        {/* Mensagem alternada */}
        <p 
          key={currentMessageIndex}
          className="text-sm text-slate-600 dark:text-slate-400 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          {messages[currentMessageIndex]}
        </p>

        {/* Barra de progresso */}
        <div className="w-64 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-slate-900 dark:bg-slate-100 rounded-full animate-loading-bar"
            style={{
              animation: 'loading-bar 1.5s ease-in-out infinite'
            }}
          ></div>
        </div>

        {/* Texto adicional */}
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
          © 2025 CONEXÃO SEGURA HB TRACK
        </p>
      </div>

      <style jsx>{`
        @keyframes loading-bar {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 70%;
            margin-left: 15%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
