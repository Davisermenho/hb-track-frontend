/**
 * AIConfidenceBadge - Badge de confiança da IA
 * 
 * Exibe nível de confiança da extração com cores:
 * - 🟢 Verde: Alta confiança (>= 0.8)
 * - 🟡 Amarelo: Média confiança (0.5 - 0.8)
 * - 🔴 Vermelho: Baixa confiança (< 0.5)
 */

'use client';

import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

interface AIConfidenceBadgeProps {
  confidence: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showIcon?: boolean;
  className?: string;
}

export default function AIConfidenceBadge({
  confidence,
  size = 'md',
  showLabel = true,
  showIcon = true,
  className,
}: AIConfidenceBadgeProps) {
  const percentage = Math.round(confidence * 100);
  
  const getVariant = () => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.5) return 'medium';
    if (confidence > 0) return 'low';
    return 'unknown';
  };
  
  const variant = getVariant();
  
  const variantStyles = {
    high: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    low: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    unknown: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  };
  
  const sizeStyles = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };
  
  const IconComponent = {
    high: CheckCircle,
    medium: AlertTriangle,
    low: XCircle,
    unknown: HelpCircle,
  }[variant];
  
  const labels = {
    high: 'Alta confiança',
    medium: 'Revisar',
    low: 'Baixa confiança',
    unknown: 'Não detectado',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      title={`Confiança da IA: ${percentage}%`}
    >
      {showIcon && <IconComponent className={iconSizes[size]} />}
      {showLabel ? (
        <span>{labels[variant]}</span>
      ) : (
        <span>{percentage}%</span>
      )}
    </span>
  );
}

// Componente para exibir em campos de formulário
interface FieldConfidenceBadgeProps {
  confidence: number;
  fieldName: string;
}

export function FieldConfidenceBadge({ confidence, fieldName }: FieldConfidenceBadgeProps) {
  if (confidence === 0) {
    return (
      <span className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
        <XCircle className="w-3 h-3" />
        Não detectado
      </span>
    );
  }
  
  return (
    <AIConfidenceBadge 
      confidence={confidence} 
      size="sm" 
      showLabel={false}
    />
  );
}

// Componente resumo de confiança geral
interface ConfidenceSummaryProps {
  scores: {
    overall: number;
    name: number;
    teams: number;
    matches: number;
    dates: number;
  };
}

export function ConfidenceSummary({ scores }: ConfidenceSummaryProps) {
  const items = [
    { label: 'Geral', value: scores.overall },
    { label: 'Nome', value: scores.name },
    { label: 'Equipes', value: scores.teams },
    { label: 'Jogos', value: scores.matches },
    { label: 'Datas', value: scores.dates },
  ];
  
  return (
    <div className="flex flex-wrap gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}:</span>
          <AIConfidenceBadge confidence={item.value} size="sm" showLabel={false} />
        </div>
      ))}
    </div>
  );
}
