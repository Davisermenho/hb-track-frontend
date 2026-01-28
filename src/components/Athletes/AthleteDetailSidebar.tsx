'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Edit, Trash2, AlertTriangle, ExternalLink } from 'lucide-react';
import { useAthlete } from '@/lib/hooks/useAthletes';
import { useEligibility } from '@/lib/hooks/useEligibility';
import { STATE_LABELS, STATE_COLORS, FLAG_LABELS, FLAG_COLORS } from '@/types/athlete-canonical';
import { AthleteDetailSkeleton } from './AthleteDetailSkeleton';
import { cn } from '@/lib/utils';

interface AthleteDetailSidebarProps {
  athleteId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (athleteId: string) => void;
}

export function AthleteDetailSidebar({ athleteId, isOpen, onClose, onDelete }: AthleteDetailSidebarProps) {
  const router = useRouter();
  const { athlete, isLoading, error } = useAthlete(athleteId || '');
  const { naturalCategory, canPlayToday, eligibilityBadgeColor, reasons, warnings } = useEligibility(athlete);

  // Fechar sidebar com tecla Escape (acessibilidade)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleEdit = () => {
    if (athleteId) {
      router.push(`/admin/athletes/${athleteId}/edit`);
    }
  };

  const handleViewFullProfile = () => {
    if (athleteId) {
      router.push(`/admin/athletes/${athleteId}`);
    }
  };

  // Proteção contra exclusão de atletas com vínculos ativos
  const hasActiveRegistrations = athlete?.team_registrations?.some(reg => !reg.end_at) || false;
  const canDelete = !hasActiveRegistrations;

  const handleDelete = () => {
    if (!athleteId) return;

    if (!canDelete) {
      alert(
        '⚠️ Não é possível excluir esta atleta\n\n' +
        'A atleta possui vínculos ativos com equipes. Encerre os vínculos antes de excluir.'
      );
      return;
    }

    if (confirm(
      '⚠️ Confirmar exclusão?\n\n' +
      'Esta ação irá remover permanentemente a atleta do sistema.\n' +
      'Todos os dados relacionados serão perdidos.\n\n' +
      'Esta ação NÃO pode ser desfeita.'
    )) {
      onDelete(athleteId);
      onClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto"
        role="dialog"
        aria-label="Ficha da Atleta"
        aria-modal="true"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Ficha da Atleta
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Fechar sidebar"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        {isLoading && <AthleteDetailSkeleton />}

        {!isLoading && (
          <>
            {error && (
              <div className="p-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-red-800 dark:text-red-200 font-semibold">Erro ao carregar atleta</h3>
                      <p className="text-red-600 dark:text-red-400 mt-1 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {athlete && (
            <div className="space-y-6">
              {/* Foto e Info Básica */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden relative">
                    {athlete.athlete_photo_path ? (
                      <Image
                        src={athlete.athlete_photo_path}
                        alt={athlete.athlete_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-3xl text-gray-400">
                        {athlete.athlete_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                    {athlete.athlete_name}
                  </h3>
                  {athlete.athlete_nickname && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      &quot;{athlete.athlete_nickname}&quot;
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATE_COLORS[athlete.state] || 'bg-gray-100 text-gray-600'}`}>
                      {STATE_LABELS[athlete.state] || athlete.state}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      eligibilityBadgeColor === 'green' ? 'bg-green-100 text-green-800' :
                      eligibilityBadgeColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {canPlayToday ? '✓ Pode jogar' : '✗ Indisponível'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Alertas de Elegibilidade */}
              {reasons.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <h4 className="font-semibold text-red-800 dark:text-red-200 text-sm mb-2">❌ Restrições</h4>
                  <ul className="text-xs text-red-600 dark:text-red-400 list-disc list-inside space-y-1">
                    {reasons.map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 text-sm mb-2">⚠️ Avisos</h4>
                  <ul className="text-xs text-yellow-600 dark:text-yellow-400 list-disc list-inside space-y-1">
                    {warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Flags de Restrição */}
              {(athlete.injured || athlete.medical_restriction || athlete.suspended_until || athlete.load_restricted) && (
                <div className="flex flex-wrap gap-2">
                  {athlete.injured && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${FLAG_COLORS.injured}`}>
                      🏥 {FLAG_LABELS.injured}
                    </span>
                  )}
                  {athlete.medical_restriction && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${FLAG_COLORS.medical_restriction}`}>
                      ⚠️ {FLAG_LABELS.medical_restriction}
                    </span>
                  )}
                  {athlete.suspended_until && new Date(athlete.suspended_until) > new Date() && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${FLAG_COLORS.suspended_until}`}>
                      🚫 Suspensa até {new Date(athlete.suspended_until).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  {athlete.load_restricted && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${FLAG_COLORS.load_restricted}`}>
                      📉 {FLAG_LABELS.load_restricted}
                    </span>
                  )}
                </div>
              )}

              {/* Dados Pessoais */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Dados Pessoais</h4>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs">Data de Nascimento</dt>
                    <dd className="text-gray-900 dark:text-white font-medium mt-0.5">
                      {athlete.birth_date ? new Date(athlete.birth_date).toLocaleDateString('pt-BR') : '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs">Idade</dt>
                    <dd className="text-gray-900 dark:text-white font-medium mt-0.5">
                      {naturalCategory?.athleteAge || '-'} anos
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs">CPF</dt>
                    <dd className="text-gray-900 dark:text-white font-medium mt-0.5">
                      {athlete.athlete_cpf || '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs">RG</dt>
                    <dd className="text-gray-900 dark:text-white font-medium mt-0.5">
                      {athlete.athlete_rg || '-'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Contatos */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Contatos</h4>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs">Telefone</dt>
                    <dd className="text-gray-900 dark:text-white font-medium mt-0.5">
                      {athlete.athlete_phone || '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs">Email</dt>
                    <dd className="text-gray-900 dark:text-white font-medium mt-0.5">
                      {athlete.athlete_email || '-'}
                    </dd>
                  </div>
                  {athlete.guardian_name && (
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400 text-xs">Responsável</dt>
                      <dd className="text-gray-900 dark:text-white font-medium mt-0.5">
                        {athlete.guardian_name}
                        {athlete.guardian_phone && (
                          <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {athlete.guardian_phone}
                          </span>
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Dados Esportivos */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Dados Esportivos</h4>
                <dl className="space-y-3 text-sm">
                  {athlete.shirt_number && (
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400 text-xs">Camisa</dt>
                      <dd className="text-gray-900 dark:text-white font-medium mt-0.5">
                        #{athlete.shirt_number}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs">Categoria Natural</dt>
                    <dd className="text-gray-900 dark:text-white font-medium mt-0.5">
                      {naturalCategory?.name || '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs">Posição Defensiva</dt>
                    <dd className="text-gray-900 dark:text-white font-medium mt-0.5">
                      {athlete.main_defensive_position?.name || '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs">Posição Ofensiva</dt>
                    <dd className="text-gray-900 dark:text-white font-medium mt-0.5">
                      {athlete.main_offensive_position?.name || 'Goleira'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Vínculos com Equipes */}
              {athlete.team_registrations && athlete.team_registrations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Vínculos com Equipes</h4>
                  <div className="space-y-2">
                    {athlete.team_registrations.map((reg) => (
                      <div
                        key={reg.id}
                        className={cn(
                          'p-3 rounded-lg border text-xs',
                          !reg.end_at
                            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                            : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/20'
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {reg.team?.name || 'Equipe'}
                            </span>
                            <span className="ml-2 text-gray-500 dark:text-gray-400">
                              {reg.team?.category?.name}
                            </span>
                          </div>
                          <span className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-medium',
                            !reg.end_at
                              ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
                              : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          )}>
                            {!reg.end_at ? 'Ativo' : 'Encerrado'}
                          </span>
                        </div>
                        <div className="mt-1 text-gray-500 dark:text-gray-400">
                          Início: {new Date(reg.start_at).toLocaleDateString('pt-BR')}
                          {reg.end_at && ` • Fim: ${new Date(reg.end_at).toLocaleDateString('pt-BR')}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          </>
        )}

        {/* Footer com ações */}
        {athlete && !isLoading && (
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-4 space-y-3">
            {/* Link para ficha completa */}
            <Link
              href={`/admin/athletes/${athleteId}`}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors font-medium border border-brand-200 dark:border-brand-800"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir ficha completa
            </Link>

            {/* Ações principais */}
            <div className="flex gap-3">
              <button
                onClick={handleEdit}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={handleDelete}
                disabled={!canDelete}
                className={cn(
                  "px-4 py-2 border rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2",
                  canDelete
                    ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 focus:ring-red-500"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed"
                )}
                title={canDelete ? "Excluir atleta" : "Não é possível excluir atletas com vínculos ativos"}
                aria-label={canDelete ? "Excluir atleta" : "Exclusão bloqueada: atleta possui vínculos ativos"}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Aviso de proteção */}
            {!canDelete && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                ⚠️ Exclusão bloqueada: encerre os vínculos ativos primeiro
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
