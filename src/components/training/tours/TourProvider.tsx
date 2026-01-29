"use client";

/**
 * TourProvider - Provedor global para Tours Guiados
 * 
 * **Step 27:** Tours Guiados duplos (Treinador vs Atleta)
 * 
 * **Features:**
 * - Tour Treinador: 7 passos (semáforo, dashboard wellness, rankings, etc.)
 * - Tour Atleta: 6 passos (notificações, preenchimento wellness, badges, etc.)
 * - Trigger automático no primeiro acesso por role
 * - Persistência em localStorage (tour_completed_{role})
 * - Botões "Pular" / "Próximo" / "Concluir"
 * - Dark mode compatível
 * 
 * **Usage:**
 * ```tsx
 * import { TourProvider, useTour } from '@/components/training/tours/TourProvider';
 * 
 * // No layout root
 * <TourProvider>
 *   {children}
 * </TourProvider>
 * 
 * // Em qualquer componente
 * const { startTour, isTourActive } = useTour();
 * <button onClick={() => startTour('coach')}>Iniciar Tour</button>
 * ```
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, Styles } from 'react-joyride';
import { useAuth } from '@/lib/hooks/useAuth';

// ================================================================================
// TYPES
// ================================================================================

type TourType = 'coach' | 'athlete';

interface TourContextValue {
  startTour: (type: TourType) => void;
  skipTour: () => void;
  isTourActive: boolean;
  currentTourType: TourType | null;
  resetTour: (type: TourType) => void;
}

// ================================================================================
// TOUR STEPS
// ================================================================================

const COACH_TOUR_STEPS: Step[] = [
  {
    target: '[data-tour="traffic-light"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Sistema de Semáforo 🚦</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          O sistema monitora a carga de treino automaticamente. Verde (OK), Amarelo (Atenção), 
          Vermelho (Bloqueado). Use os presets de foco para facilitar o planejamento.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="wellness-dashboard"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Dashboard de Wellness 📊</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Acompanhe o status de preenchimento do wellness pelos atletas. 
          Grid colorido mostra quem já respondeu (verde), parcial (amarelo) ou não respondeu (cinza). 
          Você pode enviar lembretes diretamente daqui (máximo 2 por sessão).
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="send-reminder"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Lembretes Automáticos 🔔</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Clique para enviar lembrete aos atletas que não responderam. 
          O sistema limita a 2 lembretes por sessão para evitar spam. 
          Atletas recebem notificações in-app.
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="team-rankings"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Ranking de Equipes 🏆</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Compare sua equipe com outras da organização. 
          Ranking calculado com base na taxa de resposta wellness dos atletas. 
          Atualizado mensalmente de forma automática.
        </p>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour="top-athletes"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Top 5 Atletas Comprometidos ⭐</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Relatório automático dos atletas com maior taxa de resposta wellness. 
          Gerado no dia 5 de cada mês. Use para reconhecer o comprometimento da equipe.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="auto-suggestions"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Sugestões Automáticas 💡</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          O sistema gera sugestões automáticas de ajuste de carga baseadas em alertas. 
          Você pode aplicar ou recusar. A eficácia é rastreada para melhoria contínua.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="export-analytics"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Exportar Relatório PDF 📄</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Exporte relatórios completos incluindo wellness metrics, badges conquistados, 
          rankings e eficácia preventiva. Processamento assíncrono, você receberá o PDF 
          em poucos segundos. Limite de 5 exportações por dia.
        </p>
      </div>
    ),
    placement: 'left',
  },
];

const ATHLETE_TOUR_STEPS: Step[] = [
  {
    target: '[data-tour="notifications"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Notificações 🔔</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Aqui você recebe lembretes de wellness, conquista de badges e atualizações de ranking. 
          Clique para ver detalhes e acessar rapidamente o formulário.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="wellness-form"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Formulário de Wellness 📝</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Preencha o wellness PRÉ-treino até 2 horas antes da sessão. 
          PÓS-treino deve ser preenchido até 24 horas após. Use os sliders para avaliar 
          seu estado físico e mental.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="wellness-presets"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Presets Rápidos ⚡</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Use os botões de preset para preenchimento rápido: 
          &quot;Me sinto ótimo!&quot; (8-9), &quot;Normal&quot; (5-6), &quot;Fatigado&quot; (2-3). 
          Você pode ajustar individualmente depois.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="deadline-countdown"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Countdown de Prazo ⏰</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Este contador mostra quanto tempo falta para o prazo de preenchimento. 
          Wellness PRÉ: até 2h antes da sessão. Wellness PÓS: até 24h após. 
          Após o prazo, você precisará solicitar desbloqueio ao treinador.
        </p>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour="personal-history"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Histórico Pessoal 📈</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Visualize seu histórico de wellness, presença em treinos e badges conquistados. 
          Acompanhe sua evolução e comprometimento ao longo do tempo.
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="badge-progress"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Progresso de Badges 🏅</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Conquiste badges respondendo wellness consistentemente! 
          <strong>Meta: 90% de respostas mensais.</strong> Badge &quot;Wellness Champion&quot; é dado 
          automaticamente no fim do mês. Streak de 3 meses consecutivos ganha badge especial!
        </p>
      </div>
    ),
    placement: 'right',
  },
];

// ================================================================================
// STYLES
// ================================================================================

const tourStyles: Partial<Styles> = {
  options: {
    arrowColor: 'transparent',
    backgroundColor: '#ffffff',
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    primaryColor: '#3b82f6',
    textColor: '#1f2937',
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: '0.5rem',
    padding: '1rem',
  },
  buttonNext: {
    backgroundColor: '#3b82f6',
    borderRadius: '0.375rem',
    color: '#ffffff',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  buttonBack: {
    color: '#6b7280',
    marginRight: '0.5rem',
    fontSize: '0.875rem',
  },
  buttonSkip: {
    color: '#ef4444',
    fontSize: '0.875rem',
  },
  buttonClose: {
    display: 'none',
  },
};

const darkTourStyles: Partial<Styles> = {
  options: {
    ...tourStyles.options,
    backgroundColor: '#1f2937',
    textColor: '#f3f4f6',
  },
  tooltip: tourStyles.tooltip,
  buttonNext: tourStyles.buttonNext,
  buttonBack: {
    ...tourStyles.buttonBack,
    color: '#9ca3af',
  },
  buttonSkip: tourStyles.buttonSkip,
  buttonClose: tourStyles.buttonClose,
};

// ================================================================================
// CONTEXT
// ================================================================================

const TourContext = createContext<TourContextValue | undefined>(undefined);

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within TourProvider');
  }
  return context;
};

// ================================================================================
// PROVIDER
// ================================================================================

interface TourProviderProps {
  children: React.ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentTourType, setCurrentTourType] = useState<TourType | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detectar dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    
    // Observer para mudanças de tema
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const startTour = useCallback((type: TourType) => {
    const tourSteps = type === 'coach' ? COACH_TOUR_STEPS : ATHLETE_TOUR_STEPS;
    setSteps(tourSteps);
    setCurrentTourType(type);
    setRun(true);
  }, []);

  // Auto-iniciar tour no primeiro acesso
  useEffect(() => {
    if (!user) return;

    const userRole = typeof user.role === 'string' ? user.role : (user.role as any);
    if (!userRole) return;

    let tourType: TourType | null = null;
    if (['treinador', 'coordenador', 'dirigente'].includes(userRole)) {
      tourType = 'coach';
    } else if (userRole === 'atleta') {
      tourType = 'athlete';
    }

    if (!tourType) return;

    const storageKey = `tour_completed_${tourType}`;
    const completed = localStorage.getItem(storageKey);

    if (!completed) {
      const timer = setTimeout(() => {
        startTour(tourType!);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [startTour, user]);

  const skipTour = useCallback(() => {
    setRun(false);
    setSteps([]);
    setCurrentTourType(null);
  }, []);

  const resetTour = useCallback((type: TourType) => {
    const storageKey = `tour_completed_${type}`;
    localStorage.removeItem(storageKey);
    startTour(type);
  }, [startTour]);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      
      // Salvar conclusão no localStorage
      if (currentTourType && status === STATUS.FINISHED) {
        const storageKey = `tour_completed_${currentTourType}`;
        localStorage.setItem(storageKey, 'true');
      }

      setSteps([]);
      setCurrentTourType(null);
    }
  }, [currentTourType]);

  const value: TourContextValue = {
    startTour,
    skipTour,
    isTourActive: run,
    currentTourType,
    resetTour,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
      <Joyride
        steps={steps}
        run={run}
        continuous
        showProgress
        showSkipButton
        scrollToFirstStep
        disableScrolling={false}
        styles={isDarkMode ? darkTourStyles : tourStyles}
        callback={handleJoyrideCallback}
        locale={{
          back: 'Voltar',
          close: 'Fechar',
          last: 'Concluir',
          next: 'Próximo',
          skip: 'Pular Tour',
        }}
      />
    </TourContext.Provider>
  );
};
