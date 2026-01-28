'use client';

import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useAthlete } from '@/lib/hooks/useAthletes';
import { useEligibility } from '@/lib/hooks/useEligibility';
import { STATE_LABELS, STATE_COLORS, FLAG_LABELS, FLAG_COLORS } from '../../../../../types/athlete-canonical';
import { printAthletePDF } from '@/lib/pdf/athlete-pdf';
import AuditHistory, { type AuditLogEntry } from '@/components/Athletes/AuditHistory';
import { FileText, History, Printer } from 'lucide-react';

/**
 * Página de Perfil da Atleta
 * 
 * Referências:
 * - Seção 4: Visibilidade do perfil atleta
 * - R12/R13: Estados e flags
 * - R15: Categoria natural e elegibilidade
 * - R30/R31: Auditoria de alterações
 */
export default function AthleteProfilePage() {
  const params = useParams();
  const athleteId = params.id as string;
  
  const { athlete, isLoading, error } = useAthlete(athleteId);
  const { naturalCategory, canPlayToday, eligibilityBadgeColor, reasons, warnings } = useEligibility(athlete);
  
  // Estado para mostrar histórico de auditoria
  const [showAudit, setShowAudit] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Função para carregar logs de auditoria
  const loadAuditLogs = async () => {
    if (auditLogs.length > 0) return; // Já carregado
    
    setLoadingAudit(true);
    try {
      // TODO: Chamar API real de auditoria
      // Simulação de dados para demonstração
      const mockLogs: AuditLogEntry[] = [
        {
          id: '1',
          actor_id: 'user-1',
          actor_name: 'Admin Sistema',
          timestamp: new Date().toISOString(),
          action: 'create',
          entity_type: 'athlete',
          entity_id: athleteId,
          context: 'Cadastro inicial da atleta',
        },
      ];
      setAuditLogs(mockLogs);
    } catch (err) {
      console.error('Erro ao carregar auditoria:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  // Função para exportar PDF
  const handleExportPDF = () => {
    if (!athlete) return;
    
    printAthletePDF(athleteId); // TODO: Pegar nome do usuário logado
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !athlete) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h2 className="text-red-800 dark:text-red-200 font-semibold">Erro ao carregar atleta</h2>
          <p className="text-red-600 dark:text-red-400 mt-1">{error || 'Atleta não encontrada'}</p>
        </div>
      </div>
    );
  }

  const stateColor = STATE_COLORS[athlete.state] || 'bg-gray-100 text-gray-600';
  const stateLabel = STATE_LABELS[athlete.state] || athlete.state;

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
        {/* Foto */}
        <div className="flex-shrink-0">
          <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden relative">
            {athlete.athlete_photo_path ? (
              <Image 
                src={athlete.athlete_photo_path} 
                alt={athlete.athlete_name}
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-4xl text-gray-400">
                {athlete.athlete_name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>
        </div>

        {/* Info básica */}
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {athlete.athlete_name}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${stateColor}`}>
              {stateLabel}
            </span>
            {/* Badge de elegibilidade */}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              eligibilityBadgeColor === 'green' ? 'bg-green-100 text-green-800' :
              eligibilityBadgeColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {canPlayToday ? '✓ Pode jogar' : '✗ Indisponível'}
            </span>
          </div>
          
          {athlete.athlete_nickname && (
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
              &quot;{athlete.athlete_nickname}&quot;
            </p>
          )}
          
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
            {naturalCategory && (
              <span>📊 {naturalCategory.name} ({naturalCategory.athleteAge} anos)</span>
            )}
            {athlete.shirt_number && (
              <span>🏃 Camisa #{athlete.shirt_number}</span>
            )}
            {athlete.organization?.name && (
              <span>🏢 {athlete.organization.name}</span>
            )}
          </div>

          {/* Flags de restrição */}
          <div className="flex flex-wrap gap-2 mt-3">
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
                🚫 {FLAG_LABELS.suspended_until} até {new Date(athlete.suspended_until).toLocaleDateString('pt-BR')}
              </span>
            )}
            {athlete.load_restricted && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${FLAG_COLORS.load_restricted}`}>
                📉 {FLAG_LABELS.load_restricted}
              </span>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Exportar ficha como PDF"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={() => {
              setShowAudit(!showAudit);
              if (!showAudit) loadAuditLogs();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showAudit 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title="Ver histórico de alterações"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Histórico</span>
          </button>
          <a
            href={`/admin/athletes/${athleteId}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Editar
          </a>
        </div>
      </div>

      {/* Alertas de elegibilidade */}
      {reasons.length > 0 && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 dark:text-red-200">❌ Restrições</h3>
          <ul className="mt-2 text-sm text-red-600 dark:text-red-400 list-disc list-inside">
            {reasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">⚠️ Avisos</h3>
          <ul className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 list-disc list-inside">
            {warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Grid de informações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dados Pessoais */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Dados Pessoais
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Data de Nascimento</dt>
              <dd className="text-gray-800 dark:text-white">
                {athlete.birth_date 
                  ? new Date(athlete.birth_date).toLocaleDateString('pt-BR')
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">RG</dt>
              <dd className="text-gray-800 dark:text-white">{athlete.athlete_rg || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">CPF</dt>
              <dd className="text-gray-800 dark:text-white">{athlete.athlete_cpf || '-'}</dd>
            </div>
          </dl>
        </div>

        {/* Contatos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Contatos
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Telefone</dt>
              <dd className="text-gray-800 dark:text-white">{athlete.athlete_phone || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Email</dt>
              <dd className="text-gray-800 dark:text-white">{athlete.athlete_email || '-'}</dd>
            </div>
            {athlete.guardian_name && (
              <>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Responsável</dt>
                  <dd className="text-gray-800 dark:text-white">{athlete.guardian_name}</dd>
                </div>
                {athlete.guardian_phone && (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Tel. Responsável</dt>
                    <dd className="text-gray-800 dark:text-white">{athlete.guardian_phone}</dd>
                  </div>
                )}
              </>
            )}
          </dl>
        </div>

        {/* Dados Esportivos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Dados Esportivos
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Posição Defensiva</dt>
              <dd className="text-gray-800 dark:text-white">
                {athlete.main_defensive_position?.name || '-'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Posição Ofensiva</dt>
              <dd className="text-gray-800 dark:text-white">
                {athlete.main_offensive_position?.name || 'Goleira (sem posição ofensiva)'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Categoria Natural</dt>
              <dd className="text-gray-800 dark:text-white">
                {naturalCategory?.name || '-'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Endereço */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Endereço
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">CEP</dt>
              <dd className="text-gray-800 dark:text-white">{athlete.zip_code || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Logradouro</dt>
              <dd className="text-gray-800 dark:text-white">
                {athlete.street 
                  ? `${athlete.street}, ${athlete.address_number || 's/n'}${athlete.address_complement ? ` - ${athlete.address_complement}` : ''}`
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Bairro</dt>
              <dd className="text-gray-800 dark:text-white">{athlete.neighborhood || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Cidade/UF</dt>
              <dd className="text-gray-800 dark:text-white">
                {athlete.city ? `${athlete.city}/${athlete.state_address || ''}` : '-'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Vínculos com Equipes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm md:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Vínculos com Equipes
          </h2>
          {athlete.team_registrations && athlete.team_registrations.length > 0 ? (
            <div className="space-y-3">
              {athlete.team_registrations.map((reg) => (
                <div 
                  key={reg.id}
                  className={`p-3 rounded-lg border ${
                    !reg.end_at 
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                      : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/20'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {reg.team?.name || 'Equipe'}
                      </span>
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        {reg.team?.category?.name}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      !reg.end_at 
                        ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' 
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {!reg.end_at ? 'Ativo' : 'Encerrado'}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Início: {new Date(reg.start_at).toLocaleDateString('pt-BR')}
                    {reg.end_at && ` • Fim: ${new Date(reg.end_at).toLocaleDateString('pt-BR')}`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {athlete.organization_id 
                ? 'Nenhum vínculo com equipe encontrado.'
                : '⚠️ Atleta em captação - sem organização vinculada.'}
            </p>
          )}
        </div>
      </div>

      {/* Painel de Auditoria */}
      {showAudit && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <AuditHistory
            entityType="athlete"
            entityId={athleteId}
            logs={auditLogs}
            isLoading={loadingAudit}
            onLoadMore={() => {/* TODO: Implementar paginação */}}
            hasMore={false}
          />
        </div>
      )}
    </div>
  );
}


