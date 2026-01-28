'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GearIcon, Pencil1Icon, CheckIcon, ReloadIcon } from '@radix-ui/react-icons';
import { Team, DetailTab } from '@/types/teams-v2';
import { useTeamPermissions } from '@/lib/hooks/useTeamPermissions';
import { RoleBadge } from '@/components/ui/RoleBadge';
import MembersTab from './MembersTab';
import TrainingsTab from './TrainingsTab';
import StatsTab from './StatsTab';
import OverviewTab from './OverviewTab';
import SettingsTab from './SettingsTab';

interface TeamDetailProps {
  team: Team;
  initialTab?: 'MEMBERS';
  isNewTeam?: boolean;
}

const TeamDetail: React.FC<TeamDetailProps> = ({ team, initialTab, isNewTeam = false }) => {
  // Se é equipe nova e não tem tab inicial, ir para MEMBERS para convidar membros
  const defaultTab = initialTab || (isNewTeam ? 'MEMBERS' : 'OVERVIEW');
  const [activeTab, setActiveTab] = useState<DetailTab>(defaultTab);
  const [isEditingName, setIsEditingName] = useState(false);
  const [teamName, setTeamName] = useState(team?.name || '');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Permissões do usuário na equipe
  const { role, roleLabel, canManageTeam, isLoading: permissionsLoading } = useTeamPermissions(team?.id);

  // Early return se team não carregou ainda
  if (!team?.id) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <ReloadIcon className="w-5 h-5 animate-spin text-slate-400" />
          <span className="text-slate-400">Carregando detalhes da equipe...</span>
        </div>
      </div>
    );
  }

  // Focar no input quando entrar em modo de edição
  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  // Detectar clique fora do input para confirmar
  useEffect(() => {
    if (!isEditingName) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        handleConfirmEdit();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditingName, teamName]);

  // Detectar Enter para confirmar
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirmEdit();
    } else if (e.key === 'Escape') {
      setTeamName(team?.name || '');
      setIsEditingName(false);
    }
  };

  const handleConfirmEdit = () => {
    if (teamName.trim().length >= 3) {
      // Aqui você faria a chamada API para atualizar o nome
      // await updateTeamName(team.id, teamName);
      if (team) team.name = teamName.trim();
      setIsEditingName(false);
    } else {
      setTeamName(team?.name || '');
      setIsEditingName(false);
    }
  };

  const tabs = [
    { id: 'OVERVIEW', label: 'Visão Geral', icon: null, requiresAdmin: false },
    { id: 'MEMBERS', label: 'Membros', icon: null, requiresAdmin: false },
    { id: 'TRAININGS', label: 'Treinos', icon: null, requiresAdmin: false },
    { id: 'STATS', label: 'Estatísticas', icon: null, requiresAdmin: false },
    { id: 'SETTINGS', label: 'Configurações', icon: <GearIcon className="w-4 h-4" />, requiresAdmin: true },
  ] as const;

  // Filtrar tabs baseado nas permissões
  const visibleTabs = tabs.filter(tab => !tab.requiresAdmin || canManageTeam);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <header className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {isEditingName ? (
              <input
                ref={inputRef}
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="text-xl font-heading font-bold tracking-tight text-slate-900 dark:text-white bg-transparent border-b-2 border-slate-900 dark:border-slate-100 outline-none px-1"
                style={{ width: `${Math.max((teamName || '').length * 14, 160)}px` }}
              />
            ) : (
              <h1 className="text-xl font-heading font-bold tracking-tight text-slate-900 dark:text-white">
                {teamName}
              </h1>
            )}
            {/* Botão de editar - só aparece para quem tem permissão */}
            {canManageTeam && (
              <button 
                onClick={() => setIsEditingName(!isEditingName)}
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                aria-label={isEditingName ? 'Confirmar edição' : 'Editar nome da equipe'}
                title={isEditingName ? 'Confirmar (Enter)' : 'Editar nome'}
              >
                {isEditingName ? <CheckIcon className="w-4 h-4 text-emerald-600" /> : <Pencil1Icon className="w-4 h-4" />}
              </button>
            )}
            {/* Badge de papel do usuário */}
            {!permissionsLoading && (
              <RoleBadge role={role} size="sm" />
            )}
          </div>
        </div>

        <nav className="border-b border-slate-200 dark:border-slate-800 flex gap-8">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DetailTab)}
              className={`pb-3 text-sm font-medium transition-all relative ${
                activeTab === tab.id
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 dark:bg-white rounded-full"></div>
              )}
            </button>
          ))}
        </nav>
      </header>

      <div className="py-2">
        {activeTab === 'OVERVIEW' && (
          <OverviewTab 
            team={team} 
            isNewTeam={isNewTeam}
            onNavigateToSettings={() => canManageTeam && setActiveTab('SETTINGS')}
          />
        )}
        {activeTab === 'MEMBERS' && <MembersTab teamId={team.id} />}
        {activeTab === 'TRAININGS' && <TrainingsTab teamId={team.id} />}
        {activeTab === 'STATS' && (
          <StatsTab 
            teamId={team.id} 
            teamName={team.name}
            onNavigateToTrainings={() => setActiveTab('TRAININGS')}
          />
        )}
        {activeTab === 'SETTINGS' && canManageTeam && (
          <SettingsTab 
            team={team} 
            onTeamUpdated={(updatedTeam: Team) => {
              setTeamName(updatedTeam.name);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TeamDetail;
