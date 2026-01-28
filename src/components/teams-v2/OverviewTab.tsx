'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon, ArrowRightIcon, CalendarIcon, PersonIcon, GearIcon,
  ActivityLogIcon, ClockIcon, ReloadIcon, InfoCircledIcon, RocketIcon,
  LockClosedIcon, EnvelopeClosedIcon, StarFilledIcon, ChevronDownIcon,
  DrawingPinFilledIcon
} from '@radix-ui/react-icons';
import { Dumbbell, BarChart3, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Team } from '@/types/teams-v2';
import { teamsService } from '@/lib/api/teams';
import { mapApiTeamToV2 } from '@/lib/adapters/teams-v2-adapter';
import { TrainingSessionsAPI, TrainingSession } from '@/lib/api/trainings';
import { matchesService, Match } from '@/lib/api/matches';
import { useTeamPermissions } from '@/lib/hooks/useTeamPermissions';
import { useToast } from '@/context/ToastContext';
import InviteMemberModal from './InviteMemberModal';
import CreateTrainingModal from './CreateTrainingModal';
import AddAthletesToTeamModal from './AddAthletesToTeamModal';
import ConfigureTeamModal from './ConfigureTeamModal';

interface OverviewTabProps {
  team?: Team;
  teamId?: string;
  isNewTeam?: boolean;
  onNavigateToMembers?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToTrainings?: () => void;
}

/**
 * Interface para eventos unificados (treinos + jogos)
 */
interface UnifiedActivity {
  id: string;
  type: 'training' | 'match';
  eventAt: Date;
  title: string;
  location?: string;
  // Training-specific
  sessionType?: string;
  // Match-specific
  isHome?: boolean;
}

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

const WelcomeBlockSkeleton = () => (
  <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg p-6 animate-pulse">
    <div className="space-y-3">
      <div className="h-7 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="h-4 w-full max-w-lg bg-slate-100 dark:bg-slate-900 rounded" />
      <div className="flex gap-3 pt-2">
        <div className="h-9 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-9 w-36 bg-slate-100 dark:bg-slate-900 rounded" />
        <div className="h-9 w-32 bg-slate-100 dark:bg-slate-900 rounded" />
      </div>
    </div>
  </div>
);

const TeamInfoSkeleton = () => (
  <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg p-5 animate-pulse">
    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex justify-between">
          <div className="h-4 w-24 bg-slate-100 dark:bg-slate-900 rounded" />
          <div className="h-4 w-32 bg-slate-100 dark:bg-slate-900 rounded" />
        </div>
      ))}
    </div>
  </div>
);

const ActivitySkeleton = () => (
  <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg p-5 animate-pulse">
    <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
    <div className="flex items-center justify-center py-8">
      <div className="h-12 w-12 bg-slate-100 dark:bg-slate-900 rounded-full" />
    </div>
    <div className="h-4 w-48 bg-slate-100 dark:bg-slate-900 rounded mx-auto" />
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const OverviewTab: React.FC<OverviewTabProps> = ({
  team: initialTeam,
  teamId,
  isNewTeam = false,
  onNavigateToMembers,
  onNavigateToSettings,
  onNavigateToTrainings
}) => {
  // Estado
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showAddAthletesModal, setShowAddAthletesModal] = useState(false);
  const [showConfigureModal, setShowConfigureModal] = useState(false);
  const [athletesCount, setAthletesCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [recentMembers, setRecentMembers] = useState<Array<{
    id: string;
    name: string;
    initials: string;
    role: string;
    type: 'staff' | 'athlete';
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [trainingsCount, setTrainingsCount] = useState(0);
  const [upcomingActivities, setUpcomingActivities] = useState<UnifiedActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [activityFilter, setActivityFilter] = useState<'all' | 'training' | 'match'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [createdAt, setCreatedAt] = useState<Date | null>(null);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(initialTeam || null);
  const [creatorName, setCreatorName] = useState<string>('');
  const [hasCoach, setHasCoach] = useState(true);
  const router = useRouter();

  // Hooks
  const { toast } = useToast();
  const { canManageTeam, canManageMembers, canCreateTraining } = useTeamPermissions(currentTeam?.id);

  // Funções de fetch (DEVEM vir ANTES dos useEffects que as usam)
  const fetchTeam = React.useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setHasError(false);
      const apiTeam = await teamsService.getById(id);
      const teamData = mapApiTeamToV2(apiTeam as any);
      setCurrentTeam(teamData);
    } catch (error) {
      console.error('❌ [OverviewTab] Erro ao carregar equipe:', error);
      setHasError(true);
      setIsLoading(false);
    }
  }, []);

  // Buscar equipe se apenas teamId foi fornecido
  useEffect(() => {
    if (!initialTeam && teamId) {
      fetchTeam(teamId);
    } else if (initialTeam && !currentTeam) {
      setCurrentTeam(initialTeam);
    }
  }, [teamId, initialTeam, fetchTeam]);

  // Buscar dados ao montar
  useEffect(() => {
    if (!currentTeam?.id) return;
    fetchAllData();
  }, [currentTeam?.id]);

  // Early return se team ainda não carregou
  if (!currentTeam?.id) {
    return (
      <div className="space-y-6">
        <WelcomeBlockSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TeamInfoSkeleton />
          </div>
          <ActivitySkeleton />
        </div>
      </div>
    );
  }

  // Type assertion - após verificação, currentTeam é garantido não-null
  const team = currentTeam as Team;

  // Determinar se deve mostrar o bloco de boas-vindas
  const isEmptyTeam = athletesCount === 0 && staffCount <= 1;
  const showWelcomeBlock = isNewTeam || (!isLoading && isEmptyTeam);

  // Funções de fetch
  const fetchAllData = async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      await Promise.all([
        fetchTeamData(),
        fetchUpcomingActivities(), // Substituído: agora busca treinos + jogos combinados
        fetchTeamInfo()
      ]);
    } catch (error) {
      console.error('❌ [OverviewTab] Erro ao carregar dados:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamInfo = async () => {
    try {
      setCreatedAt(new Date());
      setCreatorName('Você');
    } catch (error) {
      console.error('Erro ao buscar info da equipe:', error);
    }
  };

  const fetchTeamData = async () => {
    try {
      const [athletesResponse, staffResponse] = await Promise.all([
        teamsService.getAthletes(team.id, { active_only: true }),
        teamsService.getStaff(team.id, true)
      ]);
      
      setAthletesCount(athletesResponse.items?.length || 0);
      setStaffCount(staffResponse.items?.length || 0);
      
      // Verificar se há treinador ativo
      const coachExists = (staffResponse.items || []).some(
        (member: any) => member.role === 'treinador' && member.status === 'ativo'
      );
      setHasCoach(coachExists);
      
      // Mapear staff para formato comum
      const staffMembers = (staffResponse.items || []).map((member: any) => {
        const name = member.full_name || 'Membro';
        const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
        return {
          id: member.id,
          name,
          initials,
          role: member.role || 'membro',
          type: 'staff' as const,
        };
      });
      
      // Mapear atletas para formato comum
      const athleteMembers = (athletesResponse.items || []).map((reg: any) => {
        const name = reg.athlete?.full_name || reg.full_name || 'Atleta';
        const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
        return {
          id: reg.id,
          name,
          initials,
          role: 'atleta',
          type: 'athlete' as const,
        };
      });
      
      // Combinar e limitar a 5 membros recentes (staff primeiro, depois atletas)
      const combined = [...staffMembers, ...athleteMembers].slice(0, 5);
      setRecentMembers(combined);
    } catch (error) {
      console.error('❌ [OverviewTab] Erro ao buscar membros:', error);
      throw error;
    }
  };

  /**
   * Busca próximas atividades (treinos + jogos) da equipe
   * Combina dados de 2 endpoints, ordena cronologicamente e limita a 4 eventos
   */
  const fetchUpcomingActivities = async () => {
    if (!currentTeam?.id) {
      setUpcomingActivities([]);
      return;
    }

    setIsLoadingActivities(true);
    
    try {
      const now = new Date();
      
      // Fetch trainings e matches em paralelo
      const [trainingsResponse, matchesResponse] = await Promise.all([
        TrainingSessionsAPI.listSessions({
          team_id: currentTeam.id,
          page: 1,
          limit: 10,
        }),
        matchesService.getTeamMatches(currentTeam.id, {
          status: 'scheduled',
          page: 1,
          size: 10,
        })
      ]);
      
      // Atualizar contador de treinos
      setTrainingsCount(trainingsResponse.total || 0);
      
      // Transformar trainings em UnifiedActivity
      const trainingEvents: UnifiedActivity[] = (trainingsResponse.items || [])
        .filter(t => {
          const statusValid = t.status === 'scheduled';
          const dateValid = t.session_at && new Date(t.session_at) > now;
          return statusValid && dateValid;
        })
        .map(t => ({
          id: t.id,
          type: 'training' as const,
          eventAt: new Date(t.session_at),
          title: t.main_objective || 'Treino agendado',
          location: t.location,
          sessionType: t.session_type,
        }));
      
      // Training events filtered
      
      // Helper para combinar match_date + match_time
      const parseMatchDateTime = (matchDate: string, matchTime?: string): Date => {
        if (matchTime) {
          // match_time vem como "HH:MM:SS" do backend, combinar com match_date
          return new Date(`${matchDate}T${matchTime}`);
        }
        // Se não tem hora, usar match_date ao meio-dia
        return new Date(`${matchDate}T12:00:00`);
      };

      // Transformar matches em UnifiedActivity
      const matchEvents: UnifiedActivity[] = (matchesResponse.items || [])
        .filter(m => {
          if (!m.match_date) return false;
          const matchDateTime = parseMatchDateTime(m.match_date, m.match_time);
          return matchDateTime > now;
        })
        .map(m => {
          const matchDateTime = parseMatchDateTime(m.match_date, m.match_time);
          return {
            id: m.id,
            type: 'match' as const,
            eventAt: matchDateTime,
            title: `vs ${m.opponent_name || 'Adversário TBD'}`,
            location: m.location || undefined,
            isHome: m.is_home,
          };
        });
      
      // Match events filtered
      
      // Merge, ordenar cronologicamente, limitar a 4
      const allEvents = [...trainingEvents, ...matchEvents]
        .sort((a, b) => {
          const timeCompare = a.eventAt.getTime() - b.eventAt.getTime();
          if (timeCompare !== 0) return timeCompare;
          // Priorizar jogos se mesma hora
          return a.type === 'match' ? -1 : 1;
        })
        .slice(0, 4);
      
      // Final result ready
      
      setUpcomingActivities(allEvents);
      
    } catch (error) {
      console.error('❌ [OverviewTab] Erro ao buscar próximas atividades:', error);
      setUpcomingActivities([]); // Empty state silencioso
    } finally {
      setIsLoadingActivities(false);
    }
  };

  // Handlers de sucesso
  const handleInviteSuccess = () => {
    toast.success('Convite enviado com sucesso!');
    fetchTeamData();
  };

  const handleTrainingSuccess = (trainingId: string) => {
    toast.success('Treino criado com sucesso!');
    fetchUpcomingActivities();
  };

  const handleAddAthletesSuccess = () => {
    toast.success('Atletas adicionados com sucesso!');
    fetchTeamData();
  };

  // RENDER: Error State
  if (hasError && !isLoading) {
    return (
      <div data-testid="error-boundary" className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <InfoCircledIcon className="w-8 h-8 text-red-500" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Erro ao carregar dados</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
            Não foi possível carregar as informações da equipe. Verifique sua conexão e tente novamente.
          </p>
        </div>
        <button
          onClick={fetchAllData}
          data-testid="retry-btn"
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-black text-sm font-semibold rounded-lg hover:opacity-90 transition-all"
        >
          <ReloadIcon className="w-4 h-4" />
          Tentar novamente
        </button>
      </div>
    );
  }

  // RENDER: Loading State
  if (isLoading) {
    return (
      <div data-testid="teams-overview-root" className="space-y-6 animate-in fade-in duration-300">
        <WelcomeBlockSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <TeamInfoSkeleton />
          </div>
          <div className="space-y-6">
            <ActivitySkeleton />
          </div>
        </div>
      </div>
    );
  }

  // RENDER: Main Content
  return (
    <div data-testid="team-overview-tab" className="space-y-6 pb-6 animate-in fade-in duration-500">
      {/* BLOCO DE BOAS-VINDAS */}
      {showWelcomeBlock && (
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-100 dark:to-slate-200 rounded-xl p-6 shadow-lg animate-in fade-in slide-in-from-top-2 duration-700">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 dark:bg-black/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 dark:bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 dark:bg-black/10 rounded-lg flex items-center justify-center">
                <RocketIcon className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-bold text-white dark:text-slate-900">
                  {isNewTeam ? 'Equipe criada com sucesso!' : 'Bem-vindo à sua equipe!'}
                </h2>
                <p className="text-sm text-slate-300 dark:text-slate-600">
                  {isEmptyTeam 
                    ? 'Nenhum membro foi adicionado ainda. Vamos começar?' 
                    : 'Este é o seu painel de comando para gestão e análise tática.'}
                </p>
              </div>
            </div>

            {(canManageMembers || canCreateTraining || canManageTeam) && (
              <div className="flex flex-wrap gap-3 pt-2">
                {canManageMembers && (
                  <button 
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    <PersonIcon className="w-4 h-4" />
                    Convidar membros
                  </button>
                )}
                {canCreateTraining && (
                  <button 
                    onClick={() => setShowTrainingModal(true)}
                    className="flex items-center gap-2 bg-white/10 dark:bg-black/10 border border-white/20 dark:border-black/20 text-white dark:text-slate-900 font-semibold text-xs px-4 py-2.5 rounded-lg hover:bg-white/20 dark:hover:bg-black/20 transition-all"
                  >
                    <Dumbbell className="w-4 h-4" />
                    Criar primeiro treino
                  </button>
                )}
                {canManageTeam && (
                  <button 
                    onClick={() => setShowConfigureModal(true)}
                    className="flex items-center gap-2 bg-white/10 dark:bg-black/10 border border-white/20 dark:border-black/20 text-white dark:text-slate-900 font-semibold text-xs px-4 py-2.5 rounded-lg hover:bg-white/20 dark:hover:bg-black/20 transition-all"
                  >
                    <GearIcon className="w-4 h-4" />
                    Configurar equipe
                  </button>
                )}
              </div>
            )}

            {!canManageMembers && !canCreateTraining && !canManageTeam && (
              <p className="text-xs text-slate-400 dark:text-slate-500 pt-2">
                Aguarde instruções do administrador da equipe para começar.
              </p>
            )}
          </div>
        </section>
      )}

      {/* GRID DE CONTEÚDO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA PRINCIPAL */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* INFORMAÇÕES DA EQUIPE */}
          <section className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <LockClosedIcon className="w-4 h-4 text-slate-400" />
                Informações da Equipe
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm text-slate-500 dark:text-slate-400">Nome</span>
                <span data-testid="team-name" className="text-sm font-semibold text-slate-900 dark:text-white">{currentTeam.name}</span>
              </div>
              
              {currentTeam.category && (
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Categoria</span>
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
                    {currentTeam.category}
                  </span>
                </div>
              )}

              {currentTeam.gender && (
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Gênero</span>
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400 capitalize">
                    {currentTeam.gender}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm text-slate-500 dark:text-slate-400">Data de criação</span>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {createdAt ? createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm text-slate-500 dark:text-slate-400">Criado por</span>
                <span className="text-sm text-slate-700 dark:text-slate-300">{creatorName || '—'}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">Total de membros</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {athletesCount + staffCount}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({athletesCount} atletas, {staffCount} staff)
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ESTATÍSTICAS RÁPIDAS */}
          <section className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <PersonIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{athletesCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Atletas</p>
            </div>
            
            <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Dumbbell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{trainingsCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Treinos</p>
            </div>
            
            <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{staffCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Staff</p>
            </div>
          </section>

          {/* MEMBROS RECENTES */}
          <section className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PersonIcon className="w-4 h-4 text-slate-400" />
                Membros
              </h3>
              {onNavigateToMembers && (
                <button
                  onClick={onNavigateToMembers}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                >
                  Ver todos
                  <ArrowRightIcon className="w-3 h-3" />
                </button>
              )}
            </div>
            
            {recentMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                  <PersonIcon className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  Nenhum membro ainda
                </p>
                <p className="text-xs text-slate-400 text-center max-w-xs">
                  Convide membros para começar a construir sua equipe.
                </p>
                {canManageMembers && (
                  <button 
                    onClick={() => setShowInviteModal(true)}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-black text-xs font-semibold rounded-lg hover:opacity-90 transition-all"
                  >
                    <PersonIcon className="w-3.5 h-3.5" />
                    Convidar
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-100 flex items-center justify-center text-white dark:text-black font-bold text-[10px]">
                        {member.initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {member.name}
                        </p>
                        <p className="text-[10px] text-slate-400 capitalize">
                          {member.type === 'staff' ? member.role : 'Atleta'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                      member.type === 'staff' 
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' 
                        : 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                    }`}>
                      {member.type === 'staff' ? 'Staff' : 'Atleta'}
                    </span>
                  </div>
                ))}
                
                {/* Link Ver todos quando há mais de 5 membros */}
                {(athletesCount + staffCount) > 5 && onNavigateToMembers && (
                  <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/20">
                    <button
                      onClick={onNavigateToMembers}
                      className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                    >
                      Ver todos os {athletesCount + staffCount} membros
                      <ArrowRightIcon className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* BANNER: EQUIPE SEM TREINADOR */}
          {!hasCoach && canManageTeam && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30 rounded-lg">
              <InfoCircledIcon className="w-4 h-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
              <div className="flex items-center justify-between gap-4 flex-1">
                <div className="text-xs text-amber-800 dark:text-amber-200">
                  <strong className="font-semibold">Equipe sem treinador.</strong>{' '}
                  A equipe precisa de um treinador para gerenciar treinos e jogos.
                </div>
                <Button
                  onClick={() => router.push(`/teams/${team.id}/members`)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700 text-xs font-semibold whitespace-nowrap"
                >
                  Adicionar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* COLUNA LATERAL */}
        <div className="space-y-6">
          
          {/* PRÓXIMA ATIVIDADE */}
          <section className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                Próximas Atividades
              </h3>
              {/* Dropdown de Filtros */}
              <div className="relative">
                <button
                  data-testid="activity-filter-toggle"
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"
                >
                  {activityFilter === 'all' && 'Todos'}
                  {activityFilter === 'training' && 'Treinos'}
                  {activityFilter === 'match' && 'Jogos'}
                  <ChevronDownIcon className="w-3.5 h-3.5" />
                </button>
                {showFilterDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-10">
                    <button
                      onClick={() => { setActivityFilter('all'); setShowFilterDropdown(false); }}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => { setActivityFilter('training'); setShowFilterDropdown(false); }}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center gap-2"
                    >
                      <Dumbbell className="w-3.5 h-3.5" />
                      Treinos
                    </button>
                    <button
                      onClick={() => { setActivityFilter('match'); setShowFilterDropdown(false); }}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-center gap-2"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      Jogos
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="p-5">
              {/* Loading State */}
              {isLoadingActivities ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3 animate-pulse">
                      <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : upcomingActivities.length === 0 ? (
                /* Empty State */
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <ActivityLogIcon className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Nenhuma atividade agendada
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
                    Crie o primeiro treino para iniciar o acompanhamento da equipe.
                  </p>
                  {canCreateTraining && (
                    <button 
                      onClick={() => setShowTrainingModal(true)}
                      className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-black text-xs font-semibold rounded-lg hover:opacity-90 transition-all"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                      Agendar treino
                    </button>
                  )}
                </div>
              ) : (
                /* Lista de Atividades */
                (() => {
                  const filteredActivities = upcomingActivities.filter(activity => {
                    if (activityFilter === 'all') return true;
                    return activity.type === activityFilter;
                  });

                  // Se filtro ativo não retorna resultados
                  if (filteredActivities.length === 0) {
                    const filterLabel = activityFilter === 'training' ? 'treinos' : 'jogos';
                    const IconComponent = activityFilter === 'training' ? Dumbbell : Trophy;
                    const iconColor = activityFilter === 'training' 
                      ? 'text-emerald-400' 
                      : 'text-amber-400';

                    return (
                      <div className="text-center py-4">
                        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <IconComponent className={`w-7 h-7 ${iconColor}`} />
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          Nenhum {filterLabel} agendado
                        </p>
                        <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
                          Tente selecionar "Todos" para ver outras atividades.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-0 divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredActivities.map((activity) => {
                    const isTraining = activity.type === 'training';
                    const IconComponent = isTraining ? Dumbbell : Trophy;
                    const iconColor = isTraining 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-amber-600 dark:text-amber-400';
                    const typeLabel = isTraining ? 'Treino' : 'Jogo';
                    const typeColor = isTraining
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400';

                    // Calcular dias restantes
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    const eventDate = new Date(activity.eventAt);
                    eventDate.setHours(0, 0, 0, 0);
                    const diffTime = eventDate.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const daysText = diffDays === 0 ? 'Hoje' : diffDays === 1 ? 'Amanhã' : `Faltam ${diffDays} dias`;

                    // Função de navegação
                    const handleClick = () => {
                      if (!team?.id) return;
                      if (isTraining) {
                        router.push(`/teams/${team.id}/trainings`);
                      } else {
                        router.push(`/teams/${team.id}/trainings`);
                      }
                    };

                    return (
                      <div 
                        key={activity.id}
                        data-testid="activity-item"
                        onClick={handleClick}
                        className="flex items-center gap-3 py-3 px-5 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer"
                      >
                        {/* Ícone */}
                        <IconComponent className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />
                        
                        {/* Conteúdo Principal */}
                        <div className="flex-1 min-w-0">
                          {/* Nome do Evento */}
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {activity.title}
                          </p>
                          {/* Data, Hora e Local */}
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <ClockIcon className="w-3 h-3" />
                              {activity.eventAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                              {' às '}
                              {activity.eventAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {activity.location && (
                              <span className="flex items-center gap-1 truncate" data-testid="activity-location">
                                <DrawingPinFilledIcon className="w-3 h-3" />
                                {activity.location}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Coluna Direita: Tipo + Countdown */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={`text-xs font-semibold ${typeColor}`}>
                            {typeLabel}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                            {daysText}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                  );
                })()
              )}
            </div>
          </section>

          {/* AÇÕES RÁPIDAS */}
          {(canManageMembers || canCreateTraining) && (
            <section className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-heading font-bold text-slate-900 dark:text-white text-sm">
                  Ações Rápidas
                </h3>
              </div>
              <div className="p-3 space-y-2">
                {canManageMembers && (
                  <>
                    {/* Convidar membro por email */}
                    <button 
                      onClick={() => setShowInviteModal(true)}
                      className="group w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Envia convite por email para qualquer pessoa se juntar à equipe"
                    >
                      <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <EnvelopeClosedIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                          Convidar membro
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          Enviar convite por email (técnico, atleta, etc.)
                        </p>
                      </div>
                    </button>
                    
                    {/* Adicionar atleta manualmente */}
                    <button 
                      onClick={() => setShowAddAthletesModal(true)}
                      className="group w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Adicionar atletas já cadastrados no sistema diretamente à equipe"
                    >
                      <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <PersonIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                          Cadastrar atleta manualmente
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          Vincular atletas existentes ou criar novo
                        </p>
                      </div>
                    </button>
                  </>
                )}
                {canCreateTraining && (
                  <button 
                    onClick={() => setShowTrainingModal(true)}
                    className="group w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Criar um novo treino para a equipe"
                  >
                    <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Dumbbell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                        Criar treino
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Agendar novo treino para a equipe
                      </p>
                    </div>
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* MODAIS */}
      <InviteMemberModal 
        isOpen={showInviteModal} 
        onClose={() => setShowInviteModal(false)}
        onSuccess={handleInviteSuccess}
        teamId={currentTeam.id}
      />

      <CreateTrainingModal
        isOpen={showTrainingModal}
        onClose={() => setShowTrainingModal(false)}
        onSuccess={handleTrainingSuccess}
        teamId={currentTeam.id}
      />

      <AddAthletesToTeamModal
        isOpen={showAddAthletesModal}
        onClose={() => setShowAddAthletesModal(false)}
        onSuccess={handleAddAthletesSuccess}
        teamId={currentTeam.id}
        teamGender={currentTeam.gender ?? ''}
        teamCategoryId={currentTeam.category_id ?? 0}
      />

      <ConfigureTeamModal
        isOpen={showConfigureModal}
        onClose={() => setShowConfigureModal(false)}
        onSuccess={(updatedTeam) => {
          setCurrentTeam(updatedTeam);
          setShowConfigureModal(false);
        }}
        team={currentTeam}
      />
    </div>
  );
};

export default OverviewTab;
