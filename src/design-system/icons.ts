/**
 * Sistema de Icons Semânticos - Design System HB Track
 * 
 * Mapeamento centralizado de Phosphor Icons para contextos semânticos.
 * Migração gradual: Módulo Training usa Phosphor, outros módulos mantêm SVG legado.
 * 
 * @author HB Track Team
 * @version 1.0.0
 * @step Step 1 - _PLANO_TRAINING.md
 */

import {
  // Navigation
  CaretLeft,
  CaretRight,
  CaretDown,
  CaretUp,
  ArrowLeft,
  
  // Status
  CheckCircle,
  Warning,
  XCircle,
  Info,
  
  // Actions
  Plus,
  Pencil,
  Trash,
  Copy,
  Eye,
  Download,
  FloppyDisk,
  MagnifyingGlass,
  Upload,
  ArrowRight,
  Check,
  X,
  
  // Training Specific
  // Dumbbell, // Não existe em @phosphor-icons/react
  Basketball,
  CourtBasketball,
  Barbell,
  PersonSimpleRun,
  Strategy,
  // Heartbeat, // Não existe - usar Heart
  Moon,
  Lightning,
  Heart,
  Fire,
  Brain,
  ActivityIcon,
  Smiley,
  BatteryMedium,
  MapPin,
  VideoCamera,
  
  // Security
  Lock,
  ShieldCheck,
  
  // Medical
  FirstAid,
  
  // Charts
  ChartBar,
  ChartLine,
  
  // Files
  FilePdf,
  FileText,
  
  // UI Elements
  DotsThree,
  DotsSixVertical,
  Star,
  CircleNotch,
  Lightbulb,
  CheckSquare,
  User,
  Trophy,
  Medal,
  Crown,
  Users,
  UsersFour,
  Bell,
  BellRinging,
  Database,
  Calendar,
  Clock,
  ClockCountdown,
  Target,
  TrendUp,
  TrendDown,
  Tag,
  
  // Forms
  ListChecks,
  Sliders,
  
  // Type
  IconProps,
  Icon as PhosphorIcon,
} from '@phosphor-icons/react';

/**
 * Mapeamento semântico de ícones do design system.
 * 
 * Estrutura hierárquica por contexto de uso:
 * - Navigation: Setas e indicadores de direção
 * - Status: Estados de feedback (sucesso, erro, aviso, info)
 * - Actions: Ações do usuário (criar, editar, deletar, etc)
 * - Training: Ícones específicos do módulo de treino
 * - Security: Ícones de segurança e permissões
 * - Medical: Ícones médicos e saúde
 * - Charts: Gráficos e visualizações
 * - Files: Tipos de arquivo
 * - UI: Elementos gerais de interface
 */
export const Icons = {
  /**
   * Navegação e direcionamento
   */
  Navigation: {
    Left: CaretLeft,
    Right: CaretRight,
    Down: CaretDown,
    Up: CaretUp,
    Arrow: ArrowRight,
    ArrowLeft: ArrowLeft,
  },
  
  /**
   * Estados e feedback
   */
  Status: {
    Success: CheckCircle,
    Warning: Warning,
    Error: XCircle,
    Info: Info,
    Check: Check,
    Close: X,
    CheckCircle: CheckCircle,
  },
  
  /**
   * Ações do usuário
   */
  Actions: {
    Add: Plus,
    Edit: Pencil,
    Delete: Trash,
    Copy: Copy,
    Eye: Eye,
    View: Eye,
    Download: Download,
    Upload: Upload,
    Save: FloppyDisk,
    Search: MagnifyingGlass,
  },
  
  /**
   * Módulo Training - Ícones específicos
   */
  Training: {
    Exercise: Basketball, // Substituindo Dumbbell que não existe
    Session: CourtBasketball, // Novo ícone específico para quadra
    Physical: Barbell, // Novo ícone para físico
    Target: Target,
    Performance: TrendUp,
    Decline: TrendDown,
    
    /**
     * Tipos de Sessão Específicos
     */
    SessionTypes: {
      Quadra: CourtBasketball,
      Fisico: Barbell,
      Video: VideoCamera,
      Reuniao: UsersFour,
      Analise: Strategy,
      Teste: PersonSimpleRun,
    },
    
    /**
     * Wellness - Indicadores de bem-estar
     */
    Wellness: {
      Sleep: Moon,
      Fatigue: Lightning,
      Stress: Heart,
      Pain: Fire,
      Moon: Moon,
      Battery: BatteryMedium,
      Brain: Brain,
      Activity: ActivityIcon,
      Smile: Smiley,
      Target: Target,
    },
  },
  
  /**
   * Segurança e permissões
   */
  Security: {
    Lock: Lock,
    Shield: ShieldCheck,
  },
  
  /**
   * Médico e saúde
   */
  Medical: FirstAid,
  
  /**
   * Gráficos e visualizações
   */
  Charts: {
    Bar: ChartBar,
    Line: ChartLine,
    ChartLine: ChartLine,
  },
  
  /**
   * Tipos de arquivo
   */
  Files: {
    PDF: FilePdf,
  },
  
  /**
   * Elementos gerais de UI
   */
  UI: {
    More: DotsThree,
    DragHandle: DotsSixVertical,
    Star: Star,
    Loading: CircleNotch,
    Lightbulb: Lightbulb,
    CheckSquare: CheckSquare,
    ListChecks: ListChecks,
    Sliders: Sliders,
    User: User,
    Users: Users,
    Trophy: Trophy,
    Medal: Medal,
    Crown: Crown,
    Bell: Bell,
    BellRinging: BellRinging,
    Database: Database,
    Calendar: Calendar,
    Clock: Clock,
    Countdown: ClockCountdown,
    Tag: Tag,
    FileText: FileText,
    MapPin: MapPin,
    Video: VideoCamera,
    TrendUp: TrendUp,
    TrendDown: TrendDown,
  },
} as const;

/**
 * Props padrão para ícones do design system
 */
export interface DesignSystemIconProps extends IconProps {
  /**
   * Tamanho do ícone (pixels)
   * @default 24
   */
  size?: number | string;
  
  /**
   * Cor do ícone
   * @default "currentColor"
   */
  color?: string;
  
  /**
   * Peso da linha
   * @default "regular"
   */
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

/**
 * Adapter para manter compatibilidade com SVG legado.
 * 
 * Feature flag: Se módulo é Training, retorna Phosphor, caso contrário fallback para SVG.
 * 
 * @param iconName - Nome do ícone no formato "Category.SubCategory.Name" ou "Category.Name"
 * @param module - Módulo que está solicitando o ícone
 * @returns Componente do ícone
 * 
 * @example
 * ```tsx
 * const Icon = getIcon('Training.Wellness.Sleep', 'training');
 * return <Icon size={24} weight="bold" />;
 * ```
 */
export function getIcon(
  iconName: string,
  module: 'training' | 'matches' | 'athletes' | 'admin' = 'training'
): PhosphorIcon {
  // Feature flag: apenas módulo training usa Phosphor por enquanto
  if (module !== 'training') {
    console.warn(
      `[Icons] Módulo "${module}" ainda usa SVG legado. Ícone "${iconName}" pode não estar disponível.`
    );
    // TODO: Importar e retornar SVG do src/icons/index.tsx
    throw new Error(`SVG fallback não implementado para ${iconName}`);
  }
  
  // Parse do caminho hierárquico
  const parts = iconName.split('.');
  let current: any = Icons;
  
  for (const part of parts) {
    if (current[part]) {
      current = current[part];
    } else {
      console.error(`[Icons] Ícone não encontrado: ${iconName}`);
      return Icons.Status.Warning; // Fallback
    }
  }
  
  // Se não for um componente válido, retornar fallback
  if (typeof current !== 'function') {
    console.error(`[Icons] Ícone inválido (não é componente): ${iconName}`);
    return Icons.Status.Warning;
  }
  
  return current as PhosphorIcon;
}

/**
 * Hook para usar ícones com props padrão do design system
 * 
 * @example
 * ```tsx
 * import { useIcon } from '@/design-system/icons';
 * 
 * function MyComponent() {
 *   const SuccessIcon = useIcon('Status.Success');
 *   return <SuccessIcon size={24} weight="bold" color="green" />;
 * }
 * ```
 */
export function useIcon(iconName: string, module?: 'training' | 'matches' | 'athletes' | 'admin') {
  return getIcon(iconName, module);
}

/**
 * Type helper para validação de nomes de ícones
 */
export type IconName =
  | `Navigation.${keyof typeof Icons.Navigation}`
  | `Status.${keyof typeof Icons.Status}`
  | `Actions.${keyof typeof Icons.Actions}`
  | `Training.${Exclude<keyof typeof Icons.Training, 'Wellness'>}`
  | `Training.Wellness.${keyof typeof Icons.Training.Wellness}`
  | `Security.${keyof typeof Icons.Security}`
  | 'Medical'
  | `Charts.${keyof typeof Icons.Charts}`
  | `Files.${keyof typeof Icons.Files}`
  | `UI.${keyof typeof Icons.UI}`;

// Re-export tipos do Phosphor para conveniência
export type { IconProps };
