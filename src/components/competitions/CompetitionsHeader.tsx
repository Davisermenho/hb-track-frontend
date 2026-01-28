/**
 * CompetitionsHeader - Header da página de competições
 * 
 * Exibe:
 * - Título da página ou nome da competição
 * - Botão de voltar (quando em detalhe)
 * - Botão de criar nova competição (manual ou com IA)
 * - Breadcrumb
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useCompetitionsContext } from '@/context/CompetitionsContext';
import { useCompetitionV2Context } from '@/context/CompetitionV2Context';
import { ArrowLeft, Plus, Trophy, Sparkles, ChevronDown, FileText } from 'lucide-react';

interface CompetitionsHeaderProps {
  onBack?: () => void;
  onCreateClick?: () => void;
}

export default function CompetitionsHeader({ 
  onBack, 
  onCreateClick 
}: CompetitionsHeaderProps) {
  const { 
    selectedCompetition, 
    isDetailView,
    setIsCreateModalOpen 
  } = useCompetitionsContext();
  
  const { openWizard } = useCompetitionV2Context();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateManual = () => {
    setIsDropdownOpen(false);
    if (onCreateClick) {
      onCreateClick();
    } else {
      setIsCreateModalOpen(true);
    }
  };

  const handleCreateWithAI = () => {
    setIsDropdownOpen(false);
    openWizard();
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {/* Back button */}
            {isDetailView && onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 
                         text-gray-500 dark:text-gray-400 transition-colors"
                aria-label="Voltar para lista"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            {/* Icon and Title */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {isDetailView && selectedCompetition 
                    ? selectedCompetition.name 
                    : 'Competições'
                  }
                </h1>
                {isDetailView && selectedCompetition?.kind && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedCompetition.kind === 'official' ? 'Competição Oficial' :
                     selectedCompetition.kind === 'friendly' ? 'Amistoso' :
                     selectedCompetition.kind}
                  </p>
                )}
                {!isDetailView && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Gerencie suas competições e torneios
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-3">
            {!isDetailView && (
              <div className="relative" ref={dropdownRef}>
                {/* Main Button */}
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="inline-flex items-center gap-2 px-4 py-2 
                           bg-amber-600 hover:bg-amber-700 
                           text-white font-medium rounded-lg 
                           transition-colors shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Nova Competição</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 
                                rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 
                                py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* AI Option - Destacado */}
                    <button
                      onClick={handleCreateWithAI}
                      className="w-full flex items-start gap-3 px-4 py-3 
                               hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors
                               border-b border-gray-100 dark:border-gray-700"
                    >
                      <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white">
                          Importar com IA
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Envie o PDF do regulamento
                        </p>
                      </div>
                      <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 
                                     bg-amber-100 text-amber-700 dark:bg-amber-900/50 
                                     dark:text-amber-400 rounded uppercase">
                        Novo
                      </span>
                    </button>

                    {/* Manual Option */}
                    <button
                      onClick={handleCreateManual}
                      className="w-full flex items-start gap-3 px-4 py-3 
                               hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white">
                          Criar manualmente
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Preencha os dados do zero
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Breadcrumb */}
        {isDetailView && (
          <nav className="mt-3 flex items-center gap-2 text-sm">
            <button
              onClick={onBack}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 
                       dark:hover:text-gray-300 transition-colors"
            >
              Competições
            </button>
            <span className="text-gray-400 dark:text-gray-500">/</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {selectedCompetition?.name || 'Carregando...'}
            </span>
          </nav>
        )}
      </div>
    </header>
  );
}
