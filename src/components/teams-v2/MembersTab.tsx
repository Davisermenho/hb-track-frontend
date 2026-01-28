'use client';

import React, { useState, useEffect } from 'react';
import {
  PlusIcon, Pencil1Icon, Cross2Icon, PersonIcon, EnvelopeClosedIcon, ReloadIcon,
  MagnifyingGlassIcon, MixerHorizontalIcon, CrossCircledIcon, TrashIcon,
  LockClosedIcon, InfoCircledIcon, RocketIcon, ExclamationTriangleIcon
} from '@radix-ui/react-icons';
import InviteMemberModal from './InviteMemberModal';
import EditMemberRoleModal from './EditMemberRoleModal';
import RemoveMemberModal from './RemoveMemberModal';
import { StaffList } from './StaffList';
import { useTeamPermissions } from '@/lib/hooks/useTeamPermissions';
import { useToast } from '@/context/ToastContext';

interface MembersTabProps {
  teamId: string;
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

const EmptyMembersState: React.FC<{ 
  onInvite: () => void; 
  canManage: boolean;
  isStaff?: boolean;
}> = ({ onInvite, canManage, isStaff = true }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
      {isStaff ? (
        <PersonIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
      ) : (
        <PersonIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
      )}
    </div>
    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
      {isStaff ? 'Nenhum membro na comissão' : 'Nenhum atleta cadastrado'}
    </h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs mb-4">
      {isStaff 
        ? 'Convide outros usuários para colaborar na gestão da equipe.'
        : 'Adicione atletas para começar a gerenciar seu elenco.'
      }
    </p>
    {canManage && (
      <button
        onClick={onInvite}
        className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-black text-sm font-semibold rounded-lg shadow-sm hover:opacity-90 transition-all"
      >
        {isStaff ? (
          <>
            <EnvelopeClosedIcon className="w-4 h-4" />
            Convidar membro
          </>
        ) : (
          <>
            <PersonIcon className="w-4 h-4" />
            Adicionar atleta
          </>
        )}
      </button>
    )}
  </div>
);

// ============================================================================
// SKELETON LOADER
// ============================================================================

const MembersTableSkeleton: React.FC = () => (
  <div className="animate-pulse">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-48" />
        </div>
        <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-16" />
        <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-20" />
      </div>
    ))}
  </div>
);

// ============================================================================
// ROLE BADGE
// ============================================================================

const RoleBadge: React.FC<{ role: string; isPending?: boolean }> = ({ role, isPending }) => {
  const roleColors: Record<string, string> = {
    admin: 'bg-slate-900 dark:bg-slate-100 text-white dark:text-black',
    dirigente: 'bg-slate-900 dark:bg-slate-100 text-white dark:text-black',
    coordenador: 'bg-blue-600 dark:bg-blue-400 text-white dark:text-black',
    treinador: 'bg-violet-600 dark:bg-violet-400 text-white dark:text-black',
    atleta: 'bg-emerald-600 dark:bg-emerald-400 text-white dark:text-black',
    membro: 'bg-slate-400 dark:bg-slate-500 text-white',
  };

  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    dirigente: 'Dirigente',
    coordenador: 'Coordenador',
    treinador: 'Treinador',
    atleta: 'Atleta',
    membro: 'Membro',
  };

  if (isPending) {
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
        {roleLabels[role] || role}
      </span>
    );
  }

  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter ${roleColors[role] || roleColors.membro}`}>
      {roleLabels[role] || role}
    </span>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const MembersTab: React.FC<MembersTabProps> = ({ teamId }) => {
  // Modais
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  
  // Filtros
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState(0);
  const [gamesFilter, setGamesFilter] = useState(0);

  // Dados
  const [members, setMembers] = useState<Array<any>>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isResending, setIsResending] = useState<string | null>(null);
  
  // Atletas (dados reais)
  const [athletes, setAthletes] = useState<Array<any>>([]);
  const [isLoadingAthletes, setIsLoadingAthletes] = useState(true);

  // Hooks
  const { toast } = useToast();
  const { canManageMembers } = useTeamPermissions(teamId);

  // Buscar membros da equipe
  useEffect(() => {
    fetchMembers();
    fetchAthletes();
  }, [teamId]);

  const fetchMembers = async () => {
    try {
      console.log('🔵 [MembersTab] Iniciando busca de membros...', { teamId });
      setIsLoadingMembers(true);
      const { teamsService } = await import('@/lib/api/teams');
      
      // Buscar staff ativo e membros pendentes
      console.log('🔵 [MembersTab] Chamando APIs...');
      const [staffResponse, pendingResponse] = await Promise.all([
        teamsService.getStaff(teamId, true), // true = apenas ativos
        teamsService.getPendingMembers(teamId),
      ]);
      
      console.log('🔵 [MembersTab] Respostas:', { 
        staff: staffResponse.items?.length, 
        pending: pendingResponse.items?.length 
      });
      
      // Combinar staff ativo + membros pendentes
      // Filtrar apenas comissão técnica: dirigente(1), coordenador(2), treinador(3), membro(5)
      const staffRoleIds = [1, 2, 3, 5];
      
      const activeMembers = (staffResponse.items || [])
        .filter((member: any) => staffRoleIds.includes(member.role_id))
        .map((member: any) => ({
          ...member,
          status: 'Ativo'
        }));
      
      const pendingMembers = (pendingResponse.items || [])
        .filter((member: any) => staffRoleIds.includes(member.role_id))
        .map((member: any) => ({
          ...member,
          status: 'Pendente',
          is_expired: member.is_expired ?? false,       // Sprint 3
          hours_remaining: member.hours_remaining,       // Sprint 3
        }));
      
      console.log('✅ [MembersTab] Membros da comissão carregados:', { 
        ativos: activeMembers.length, 
        pendentes: pendingMembers.length,
        total: activeMembers.length + pendingMembers.length
      });
      
      setMembers([...activeMembers, ...pendingMembers]);
    } catch (error) {
      console.error('❌ [MembersTab] Erro ao buscar membros:', error);
      setMembers([]);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Buscar atletas da equipe
  const fetchAthletes = async () => {
    try {
      console.log('🔵 [MembersTab] Iniciando busca de atletas...', { teamId });
      setIsLoadingAthletes(true);
      const { teamsService } = await import('@/lib/api/teams');
      
      const response = await teamsService.getAthletes(teamId, { active_only: false });
      
      console.log('🔵 [MembersTab] Atletas response:', response);
      
      // Mapear registrations para formato esperado pela tabela
      // Filtrar apenas atletas (role_id 4)
      const mappedAthletes = (response.items || [])
        .filter((reg: any) => reg.role_id === 4 || !reg.role_id) // role_id 4 = atleta
        .map((reg: any) => {
          const name = reg.athlete?.full_name || reg.full_name || 'Atleta';
          const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
          
          return {
            id: reg.id,
            personId: reg.athlete_id || reg.person_id,
            name,
            initials,
            number: reg.role || reg.number || '—',
            category: reg.category_name || reg.category_id || '—',
            offensivePosition: reg.offensive_position || '—',
            defensivePosition: reg.defensive_position || '—',
            status: reg.end_at ? 'Inativo' : 'Ativo',
            startAt: reg.start_at,
            endAt: reg.end_at,
          };
        });
      
      console.log('✅ [MembersTab] Atletas carregados:', mappedAthletes.length);
      setAthletes(mappedAthletes);
    } catch (error) {
      console.error('❌ [MembersTab] Erro ao buscar atletas:', error);
      setAthletes([]);
    } finally {
      setIsLoadingAthletes(false);
    }
  };

  // Carregar filtros do localStorage
  useEffect(() => {
    const savedFilters = localStorage.getItem('athletes-filters');
    if (savedFilters) {
      const filters = JSON.parse(savedFilters);
      setSearchQuery(filters.searchQuery || '');
      setCategoryFilter(filters.category || '');
      setStatusFilter(filters.status || '');
      setPositionFilter(filters.position || '');
      setAttendanceFilter(filters.attendance || 0);
      setGamesFilter(filters.games || 0);
    }
  }, []);

  // Salvar filtros no localStorage
  useEffect(() => {
    const filters = {
      searchQuery,
      category: categoryFilter,
      status: statusFilter,
      position: positionFilter,
      attendance: attendanceFilter,
      games: gamesFilter
    };
    localStorage.setItem('athletes-filters', JSON.stringify(filters));
  }, [searchQuery, categoryFilter, statusFilter, positionFilter, attendanceFilter, gamesFilter]);

  const handleInviteSuccess = () => {
    console.log('✅ [MembersTab] Convite enviado - recarregando membros...');
    fetchMembers(); // Recarregar lista
  };

  // Handler para editar papel
  const handleEditRole = (member: any) => {
    setSelectedMember(member);
    setIsEditRoleModalOpen(true);
  };

  // Handler para remover/cancelar
  const handleRemove = (member: any) => {
    setSelectedMember(member);
    setIsRemoveModalOpen(true);
  };

  // Handler para reenviar convite
  const handleResendInvite = async (member: any) => {
    if (isResending) return;
    
    console.log('🔵 [MembersTab] Reenviando convite...', { memberId: member.id });
    setIsResending(member.id);
    
    try {
      const { teamsService } = await import('@/lib/api/teams');
      const response = await teamsService.resendInvite(teamId, member.id);
      
      if (!response.success) {
        throw new Error(response.message || 'Erro ao reenviar convite');
      }
      
      toast.success('Convite reenviado!', {
        description: `Um novo email foi enviado para ${member.email}.`
      });
    } catch (error: any) {
      console.error('❌ [MembersTab] Erro ao reenviar:', error);
      toast.error('Erro ao reenviar', {
        description: error?.message || 'Não foi possível reenviar o convite.'
      });
    } finally {
      setIsResending(null);
    }
  };

  // Handler para sucesso na edição/remoção
  const handleMemberUpdate = () => {
    setSelectedMember(null);
    fetchMembers();
  };

  // Filtrar atletas (usando dados reais)
  const filteredAthletes = athletes.filter(athlete => {
    const matchesSearch = searchQuery === '' || 
      (athlete.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (athlete.number?.toString() || '').includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === '' || athlete.category === categoryFilter;
    const matchesStatus = statusFilter === '' || athlete.status === statusFilter;
    const matchesPosition = positionFilter === '' || 
      athlete.offensivePosition === positionFilter || 
      athlete.defensivePosition === positionFilter;
    const matchesAttendance = (athlete.attendance || 0) >= attendanceFilter;
    const matchesGames = (athlete.gamesPlayed || 0) >= gamesFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesPosition && matchesAttendance && matchesGames;
  });

  // Verificar se há filtros ativos
  const hasActiveFilters = searchQuery !== '' || categoryFilter !== '' || statusFilter !== '' || 
    positionFilter !== '' || attendanceFilter > 0 || gamesFilter > 0;

  // Limpar todos os filtros
  const clearAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setStatusFilter('');
    setPositionFilter('');
    setAttendanceFilter(0);
    setGamesFilter(0);
  };

  // Obter lista de filtros ativos para exibição
  const getActiveFiltersList = () => {
    const filters = [];
    if (categoryFilter) filters.push(categoryFilter);
    if (statusFilter) filters.push(statusFilter);
    if (positionFilter) filters.push(positionFilter);
    if (attendanceFilter > 0) filters.push(`Presença ≥ ${attendanceFilter}%`);
    if (gamesFilter > 0) filters.push(`Jogos ≥ ${gamesFilter}`);
    return filters;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500" data-testid="team-members-tab">
      {/* Seção: Comissão Técnica & Gestão */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Comissão Técnica & Gestão</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gerencie administradores e treinadores com acesso à equipe.</p>
          </div>
          {canManageMembers && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              data-testid="invite-member-btn"
              className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-black font-semibold text-sm px-4 py-2.5 rounded shadow-sm hover:opacity-90 transition-all"
            >
              <EnvelopeClosedIcon className="w-4 h-4" />
              Convidar membro
            </button>
          )}
        </div>

        {/* Lista de Staff (Step 37) */}
        <StaffList teamId={teamId} canManage={canManageMembers} />
      </section>

      {/* Seção: Atletas */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Atletas</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Elenco completo com posições e status tático.</p>
          </div>
          <button
            className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-black font-semibold text-sm px-4 py-2.5 rounded shadow-sm hover:opacity-90 transition-all"
          >
            <PersonIcon className="w-4 h-4" />
            Adicionar Atleta
          </button>
        </div>

        {/* Filtros de Atletas */}
        <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <MixerHorizontalIcon className="w-3.5 h-3.5" />
              {showAdvancedFilters ? 'Ocultar filtros' : 'Filtros'}
              <span className="text-slate-400 text-[10px]">{showAdvancedFilters ? '▲' : '▼'}</span>
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <CrossCircledIcon className="w-3 h-3" />
                Limpar filtros
              </button>
            )}
          </div>

          {/* Todos os Filtros (Colapsável) */}
          {showAdvancedFilters && (
            <div className="space-y-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-200">
              {/* Linha 1: Busca, Categoria, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Busca por nome/número */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Buscar atleta</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Nome ou número..."
                      className="w-full pl-8 pr-2 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-slate-900 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Filtro de Categoria */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Categoria</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded outline-none cursor-pointer"
                  >
                    <option value="">Todas</option>
                    <option value="Sub-15">Sub-15</option>
                    <option value="Sub-16">Sub-16</option>
                    <option value="Sub-17">Sub-17</option>
                    <option value="Sub-18">Sub-18</option>
                    <option value="Sub-20">Sub-20</option>
                    <option value="Sênior">Sênior</option>
                  </select>
                </div>

                {/* Filtro de Status */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded outline-none cursor-pointer"
                  >
                    <option value="">Todos</option>
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Lesionado">Lesionado</option>
                    <option value="Pendente">Pendente</option>
                  </select>
                </div>
              </div>

              {/* Linha 2: Posição, Presença, Jogos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Filtro de Posição Técnica */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Posição</label>
                  <select
                    value={positionFilter}
                    onChange={(e) => setPositionFilter(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded outline-none cursor-pointer"
                  >
                    <option value="">Todas</option>
                    <optgroup label="Ofensivas">
                      <option value="Armador Central">Armador Central</option>
                      <option value="Ponta Esq.">Ponta Esq.</option>
                      <option value="Ponta Dir.">Ponta Dir.</option>
                      <option value="Pivô">Pivô</option>
                      <option value="Lateral Esq.">Lateral Esq.</option>
                      <option value="Lateral Dir.">Lateral Dir.</option>
                    </optgroup>
                    <optgroup label="Defensivas">
                      <option value="Base">Base</option>
                      <option value="Avançado">Avançado</option>
                      <option value="Bloco Central">Bloco Central</option>
                      <option value="Lateral">Lateral</option>
                    </optgroup>
                  </select>
                </div>

                {/* Filtro de Presença */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Presença mínima</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={attendanceFilter}
                      onChange={(e) => setAttendanceFilter(Number(e.target.value))}
                      className="flex-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-slate-100"
                    />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 min-w-[32px]">{attendanceFilter}%</span>
                  </div>
                </div>

                {/* Filtro de Jogos */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Jogos mínimos</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={gamesFilter}
                    onChange={(e) => setGamesFilter(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-slate-900 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Resumo dos filtros ativos */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {categoryFilter && (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium rounded">
                  Categoria: {categoryFilter}
                  <button onClick={() => setCategoryFilter('')} className="hover:text-slate-900 dark:hover:text-white">
                    <Cross2Icon className="w-3 h-3" />
                  </button>
                </span>
              )}
              {statusFilter && (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium rounded">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter('')} className="hover:text-slate-900 dark:hover:text-white">
                    <Cross2Icon className="w-3 h-3" />
                  </button>
                </span>
              )}
              {positionFilter && (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium rounded">
                  Posição: {positionFilter}
                  <button onClick={() => setPositionFilter('')} className="hover:text-slate-900 dark:hover:text-white">
                    <Cross2Icon className="w-3 h-3" />
                  </button>
                </span>
              )}
              {attendanceFilter > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium rounded">
                  Presença ≥ {attendanceFilter}%
                  <button onClick={() => setAttendanceFilter(0)} className="hover:text-slate-900 dark:hover:text-white">
                    <Cross2Icon className="w-3 h-3" />
                  </button>
                </span>
              )}
              {gamesFilter > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium rounded">
                  Jogos ≥ {gamesFilter}
                  <button onClick={() => setGamesFilter(0)} className="hover:text-slate-900 dark:hover:text-white">
                    <Cross2Icon className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
          {isLoadingAthletes ? (
            <MembersTableSkeleton />
          ) : athletes.length === 0 ? (
            <EmptyMembersState 
              onInvite={() => {/* TODO: Open add athletes modal */}} 
              canManage={canManageMembers}
              isStaff={false}
            />
          ) : filteredAthletes.length === 0 ? (
            // Empty state para filtros sem resultado
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <MagnifyingGlassIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Nenhum atleta encontrado
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs mb-4">
                Tente ajustar os filtros aplicados.
              </p>
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                <CrossCircledIcon className="w-4 h-4" />
                Limpar filtros
              </button>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="w-16 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">#</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Nome</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Categoria</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Pos. Ofensiva</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Pos. Defensiva</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAthletes.map(athlete => (
                  <tr key={athlete.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-9 h-9 rounded-full bg-slate-900 dark:bg-slate-100 flex items-center justify-center text-white dark:text-black font-bold text-xs">
                        {athlete.initials}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {athlete.name}
                      </div>
                      <div className="text-[11px] text-slate-400">{athlete.number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        {athlete.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        {athlete.offensivePosition}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        {athlete.defensivePosition}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${
                        athlete.status === 'Ativo'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                          : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-900/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${athlete.status === 'Ativo' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {athlete.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                          <Pencil1Icon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
          {!isLoadingAthletes && athletes.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 text-[11px] text-slate-400 flex justify-between">
            <span>
              {hasActiveFilters 
                ? `Exibindo ${filteredAthletes.length} de ${athletes.length} atletas` 
                : `Exibindo ${athletes.length} atletas`
              }
            </span>
            <div className="flex gap-4">
              <button className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors">Anterior</button>
              <button className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors">Próximo</button>
            </div>
          </div>
          )}
        </div>
      </section>

      {/* MODAIS */}
      <InviteMemberModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={handleInviteSuccess}
        teamId={teamId}
      />

      <EditMemberRoleModal
        isOpen={isEditRoleModalOpen}
        onClose={() => {
          setIsEditRoleModalOpen(false);
          setSelectedMember(null);
        }}
        onSuccess={handleMemberUpdate}
        member={selectedMember}
        teamId={teamId}
      />

      <RemoveMemberModal
        isOpen={isRemoveModalOpen}
        onClose={() => {
          setIsRemoveModalOpen(false);
          setSelectedMember(null);
        }}
        onSuccess={handleMemberUpdate}
        member={selectedMember}
        teamId={teamId}
      />
    </div>
  );
};

export default MembersTab;
