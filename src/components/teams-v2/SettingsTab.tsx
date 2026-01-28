'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ExclamationTriangleIcon, ReloadIcon, CheckIcon, Cross2Icon, UploadIcon, TrashIcon,
  PersonIcon, LockClosedIcon, GearIcon, InfoCircledIcon, ChevronDownIcon,
  ExitIcon, StarFilledIcon, CameraIcon, DownloadIcon,
  ClockIcon, Pencil1Icon, CheckCircledIcon, ActivityLogIcon, RocketIcon
} from '@radix-ui/react-icons';
import { Team } from '@/types/teams-v2';
import { teamsService } from '@/lib/api/teams';
import { mapApiTeamToV2 } from '@/lib/adapters/teams-v2-adapter';
import { useTeamPermissions } from '@/lib/hooks/useTeamPermissions';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

interface SettingsTabProps {
  team?: Team;
  teamId?: string;
  onTeamUpdated?: (team: Team) => void;
}

interface TeamMember {
  id: string;
  person_id: string;
  full_name: string;
  email?: string;
  role: 'owner' | 'admin' | 'treinador' | 'membro';
  avatar_url?: string;
  joined_at?: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

// Toast notification component
const Toast: React.FC<{
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
}> = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const colors = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-slate-800 text-white',
  };

  const icons = {
    success: <CheckCircledIcon className="w-4 h-4" />,
    error: <InfoCircledIcon className="w-4 h-4" />,
    info: <InfoCircledIcon className="w-4 h-4" />,
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          data-testid={type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : 'toast-info'}
          className={`fixed bottom-6 left-1/2 z-[100] px-4 py-3 rounded-lg shadow-lg ${colors[type]} flex items-center gap-3`}
        >
          {icons[type]}
          <span className="text-sm font-medium">{message}</span>
          <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
            <Cross2Icon className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Inline save status indicator
const SaveIndicator: React.FC<{ status: SaveStatus }> = ({ status }) => {
  if (status === 'idle') return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex items-center gap-1.5 text-xs"
    >
      {status === 'saving' && (
        <>
          <ReloadIcon className="w-3 h-3 animate-spin text-slate-500" />
          <span className="text-slate-500">Salvando...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <CheckIcon className="w-3 h-3 text-emerald-500" />
          <span className="text-emerald-600 font-medium">Salvo</span>
        </>
      )}
      {status === 'error' && (
        <>
          <InfoCircledIcon className="w-3 h-3 text-red-500" />
          <span className="text-red-600 font-medium">Erro ao salvar</span>
        </>
      )}
    </motion.div>
  );
};

// Section header component
const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}> = ({ icon, title, description, badge }) => (
  <div className="flex items-start gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white">{title}</h2>
        {badge && (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
    </div>
  </div>
);

// Role dropdown with confirmation
const RoleDropdown: React.FC<{
  currentRole: string;
  memberName: string;
  onRoleChange: (newRole: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}> = ({ currentRole, memberName, onRoleChange, disabled, isLoading }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingRole, setPendingRole] = useState<string | null>(null);

  const roles = [
    { value: 'admin', label: 'Administrador', description: 'Acesso total às configurações' },
    { value: 'treinador', label: 'Treinador', description: 'Criar e editar treinos' },
    { value: 'membro', label: 'Membro', description: 'Apenas visualização' },
  ];

  const handleSelectRole = (role: string) => {
    if (role !== currentRole) {
      setPendingRole(role);
      setShowConfirm(true);
    }
  };

  const confirmChange = () => {
    if (pendingRole) {
      onRoleChange(pendingRole);
      setShowConfirm(false);
      setPendingRole(null);
    }
  };

  return (
    <div className="relative">
      <select
        value={currentRole}
        onChange={(e) => handleSelectRole(e.target.value)}
        disabled={disabled || isLoading}
        className="appearance-none text-xs font-semibold px-3 py-1.5 pr-8 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {roles.map((role) => (
          <option key={role.value} value={role.value}>
            {role.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-5">
                <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                  <LockClosedIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-center text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Alterar permissão?
                </h3>
                <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">{memberName}</span> será alterado para{' '}
                  <span className="font-semibold">{roles.find(r => r.value === pendingRole)?.label}</span>.
                </p>
              </div>
              <div className="flex border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmChange}
                  className="flex-1 py-3 text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors border-l border-slate-200 dark:border-slate-800"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SettingsTab: React.FC<SettingsTabProps> = ({ team: initialTeam, teamId, onTeamUpdated }) => {
  // Team state
  const [currentTeam, setCurrentTeam] = useState<Team | null>(initialTeam || null);
  const [isLoadingTeam, setIsLoadingTeam] = useState(!initialTeam);

  // Form state
  const [teamName, setTeamName] = useState(currentTeam?.name || '');
  const [description, setDescription] = useState(currentTeam?.description || '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaveStatus, setNameSaveStatus] = useState<SaveStatus>('idle');

  // Image state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Members state
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);

  // Modal state
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // History state (for changelog)
  const [lastChange, setLastChange] = useState<{ action: string; by: string; at: string } | null>(null);

  // Permissions
  const {
    canManageTeam,
    canDeleteTeam,
    canLeaveTeam,
    canChangeRoles,
    isOwner,
    isAdmin,
    isLoading: permissionsLoading
  } = useTeamPermissions(currentTeam?.id);

  // Team stats for delete warning
  const [teamStats, setTeamStats] = useState({ members: 0, trainings: 0 });
  
  // Step 15: Training settings state
  const [alertThreshold, setAlertThreshold] = useState<number>(currentTeam?.alert_threshold_multiplier || 2.0);
  const [thresholdSaveStatus, setThresholdSaveStatus] = useState<SaveStatus>('idle');

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Fetch team if only teamId provided
  useEffect(() => {
    if (!initialTeam && teamId) {
      const fetchTeam = async () => {
        try {
          console.log('[SettingsTab] Iniciando fetch da equipe:', teamId);
          setIsLoadingTeam(true);
          const apiTeam = await teamsService.getById(teamId);
          console.log('[SettingsTab] Equipe carregada:', apiTeam);
          const teamData = mapApiTeamToV2(apiTeam as any);
          setCurrentTeam(teamData);
          setTeamName(teamData.name);
          setDescription(teamData.description || '');
          console.log('[SettingsTab] Estado atualizado, finalizando loading');
        } catch (error) {
          console.error('❌ [SettingsTab] Erro ao carregar equipe:', error);
          // IMPORTANTE: Finalizar loading mesmo em caso de erro
          setIsLoadingTeam(false);
        } finally {
          setIsLoadingTeam(false);
        }
      };
      fetchTeam();
    } else if (initialTeam) {
      // Se initialTeam foi passado, usar ele diretamente
      console.log('[SettingsTab] Usando initialTeam passado via props');
      setCurrentTeam(initialTeam);
      setTeamName(initialTeam.name);
      setDescription(initialTeam.description || '');
      setAlertThreshold(initialTeam.alert_threshold_multiplier || 2.0); // Step 15
      setIsLoadingTeam(false);
    }
  }, [teamId, initialTeam]);

  // Load members
  useEffect(() => {
    if (!currentTeam?.id) return;

    const loadMembers = async () => {
      setIsLoadingMembers(true);
      try {
        const staffResponse = await teamsService.getStaff(currentTeam.id);
        const mappedMembers: TeamMember[] = staffResponse.items.map((s) => ({
          id: s.id,
          person_id: s.person_id,
          full_name: s.full_name,
          role: s.role?.toLowerCase() as TeamMember['role'] || 'membro',
          joined_at: s.start_at || undefined,
        }));
        setMembers(mappedMembers);
        setTeamStats(prev => ({ ...prev, members: mappedMembers.length }));
      } catch (error) {
        console.error('Error loading members:', error);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    loadMembers();
  }, [currentTeam?.id]);

  // Validate team name
  useEffect(() => {
    if (teamName.trim().length < 3) {
      setNameError('O nome deve ter pelo menos 3 caracteres');
    } else if (teamName.trim().length > 50) {
      setNameError('O nome deve ter no máximo 50 caracteres');
    } else {
      setNameError(null);
    }
  }, [teamName]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  // Helper to merge API response with local team data
  const mergeTeamUpdate = (apiTeam: { name?: string; description?: string | null }): Team => {
    return {
      ...team,
      name: apiTeam.name || team.name,
      description: apiTeam.description !== undefined ? apiTeam.description : team.description,
    };
  };

  // Auto-save team name on blur
  const handleNameBlur = async () => {
    if (teamName === team.name || nameError) return;
    
    setNameSaveStatus('saving');
    try {
      const updated = await teamsService.update(team.id, { name: teamName });
      setNameSaveStatus('saved');
      setLastChange({ action: 'Nome alterado', by: 'Você', at: new Date().toLocaleString('pt-BR') });
      setToast({ message: 'Nome da equipe atualizado', type: 'success' });
      onTeamUpdated?.(mergeTeamUpdate(updated));
      
      setTimeout(() => setNameSaveStatus('idle'), 2000);
    } catch (error) {
      setNameSaveStatus('error');
      setToast({ message: 'Erro ao salvar nome da equipe', type: 'error' });
    }
  };

  // Handle description save
  const handleDescriptionBlur = async () => {
    if (description === (team.description || '')) return;
    
    try {
      const updated = await teamsService.update(team.id, { description: description || undefined });
      setToast({ message: 'Descrição atualizada', type: 'success' });
      onTeamUpdated?.(mergeTeamUpdate(updated));
    } catch (error) {
      setToast({ message: 'Erro ao salvar descrição', type: 'error' });
    }
  };

  // Step 15: Handle threshold save
  const handleThresholdSave = async (value: number) => {
    if (value === team.alert_threshold_multiplier) return;
    
    setThresholdSaveStatus('saving');
    try {
      const response = await fetch(`/api/teams/${team.id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_threshold_multiplier: value }),
      });
      
      if (!response.ok) throw new Error('Failed to update settings');
      
      const updated = await response.json();
      setThresholdSaveStatus('saved');
      setToast({ message: 'Configurações de alertas atualizadas', type: 'success' });
      onTeamUpdated?.({ ...team, alert_threshold_multiplier: value });
      
      setTimeout(() => setThresholdSaveStatus('idle'), 2000);
    } catch (error) {
      setThresholdSaveStatus('error');
      setToast({ message: 'Erro ao salvar configurações', type: 'error' });
      // Revert on error
      setAlertThreshold(team.alert_threshold_multiplier || 2.0);
    }
  };

  // Image handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  }, []);

  const handleImageUpload = async (file: File) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Por favor, selecione uma imagem válida', type: 'error' });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'A imagem deve ter no máximo 5MB', type: 'error' });
      return;
    }

    setIsUploadingImage(true);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // TODO: Upload to server
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setToast({ message: 'Imagem atualizada com sucesso', type: 'success' });
    } catch (error) {
      setToast({ message: 'Erro ao fazer upload da imagem', type: 'error' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setAvatarUrl(null);
    setToast({ message: 'Imagem removida', type: 'info' });
  };

  // Role change handler
  const handleRoleChange = async (memberId: string, newRole: string) => {
    setChangingRoleId(memberId);
    try {
      await teamsService.updateMemberRole(team.id, memberId, newRole);
      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, role: newRole as TeamMember['role'] } : m
      ));
      setToast({ message: 'Permissão atualizada com sucesso', type: 'success' });
    } catch (error) {
      setToast({ message: 'Erro ao atualizar permissão', type: 'error' });
    } finally {
      setChangingRoleId(null);
    }
  };

  // Leave team handler
  const handleLeaveTeam = async () => {
    setIsLeaving(true);
    try {
      // TODO: Call API endpoint to leave team
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setShowLeaveModal(false);
      setToast({ message: `Você saiu da equipe ${team.name}. Se foi um engano, peça para ser adicionado novamente.`, type: 'info' });
      
      // Redirect after toast
      setTimeout(() => {
        window.location.href = '/teams';
      }, 2000);
    } catch (error) {
      setToast({ message: 'Erro ao sair da equipe', type: 'error' });
    } finally {
      setIsLeaving(false);
    }
  };

  // Delete team handler
  const handleDeleteTeam = async () => {
    if (deleteConfirmText !== team.name) return;
    
    setIsDeleting(true);
    try {
      await teamsService.delete(team.id);
      
      setShowDeleteModal(false);
      setToast({ message: 'Equipe excluída permanentemente', type: 'success' });
      
      // Redirect after toast
      setTimeout(() => {
        window.location.href = '/teams';
      }, 2000);
    } catch (error) {
      setToast({ message: 'Erro ao excluir equipe. Tente novamente.', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Export data handler
  const handleExportData = () => {
    setToast({ message: 'Exportação iniciada. Você receberá um email com os dados.', type: 'info' });
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <StarFilledIcon className="w-4 h-4 text-amber-500" />;
      case 'admin':
        return <LockClosedIcon className="w-4 h-4 text-blue-500" />;
      case 'treinador':
        return <PersonIcon className="w-4 h-4 text-emerald-500" />;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      owner: { label: 'Criador', className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
      admin: { label: 'Admin', className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
      treinador: { label: 'Treinador', className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
      membro: { label: 'Membro', className: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
    };
    return badges[role] || badges.membro;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // Mostrar loading apenas se a equipe ainda não foi carregada
  if (isLoadingTeam || !currentTeam) {
    return (
      <div data-testid="teams-settings-root" className="flex items-center justify-center py-20">
        <ReloadIcon className="w-6 h-6 animate-spin text-slate-400" />
        <span className="ml-2 text-sm text-slate-500">Carregando equipe...</span>
      </div>
    );
  }

  // Type assertion - após verificação, currentTeam é garantido não-null
  const team = currentTeam as Team;

  // Se permissões ainda estão carregando, mostrar o conteúdo com loading inline
  // ao invés de bloquear toda a página
  if (permissionsLoading) {
    return (
      <div data-testid="teams-settings-root" className="flex items-center justify-center py-20">
        <ReloadIcon className="w-6 h-6 animate-spin text-slate-400" />
        <span className="ml-2 text-sm text-slate-500">Verificando permissões...</span>
      </div>
    );
  }

  // Access check - tab should already be hidden, but double-check
  if (!canManageTeam && !isAdmin && !isOwner) {
    return (
      <div data-testid="teams-settings-root" className="flex flex-col items-center justify-center py-20 text-center">
        <LockClosedIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Acesso restrito</h3>
        <p className="text-sm text-slate-500 max-w-md">
          Apenas administradores podem acessar as configurações da equipe.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl" data-testid="teams-settings-root">
      {/* Toast */}
      <Toast
        message={toast?.message || ''}
        type={toast?.type || 'info'}
        isVisible={!!toast}
        onClose={() => setToast(null)}
      />

      {/* ================================================================== */}
      {/* Section: General Info */}
      {/* ================================================================== */}
      <section>
        <SectionHeader
          icon={<GearIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />}
          title="Informações Gerais"
          description="Nome, descrição e imagem da equipe"
        />

        <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Team Avatar */}
            <div className="flex-shrink-0">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                Imagem da equipe
              </label>
              <div
                className={`
                  relative w-32 h-32 rounded-xl border-2 border-dashed transition-all cursor-pointer
                  ${isDragging 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                  }
                  ${avatarUrl ? 'border-solid' : ''}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarUrl ? (
                  <>
                    <img
                      src={avatarUrl}
                      alt={team.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                      >
                        <CameraIcon className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                        className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                    {isUploadingImage ? (
                      <ReloadIcon className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <UploadIcon className="w-6 h-6 mb-2" />
                        <span className="text-[10px] text-center px-2">Arraste ou clique</span>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-center">PNG, JPG até 5MB</p>
            </div>

            {/* Form Fields */}
            <div className="flex-1 space-y-5">
              {/* Team Name */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nome da equipe
                  </label>
                  <AnimatePresence mode="wait">
                    <SaveIndicator status={nameSaveStatus} />
                  </AnimatePresence>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    onBlur={handleNameBlur}
                    data-testid="team-name-input"
                    className={`
                      w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-950 border rounded-lg 
                      outline-none transition-all
                      ${nameError 
                        ? 'border-red-300 dark:border-red-800 focus:ring-2 focus:ring-red-500/20' 
                        : 'border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10'
                      }
                    `}
                    placeholder="Ex: Sub-17 Masculino"
                  />
                  {teamName !== team.name && !nameError && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Pencil1Icon className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                </div>
                {nameError ? (
                  <p className="text-[11px] text-red-500 flex items-center gap-1">
                    <InfoCircledIcon className="w-3 h-3" />
                    {nameError}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400">
                    Alterações são salvas automaticamente ao sair do campo.
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Descrição <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleDescriptionBlur}
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 outline-none transition-all resize-none"
                  placeholder="Adicione uma descrição para sua equipe..."
                />
              </div>

              {/* Read-only fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Categoria</label>
                  <div className="px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
                    {team.category_id || 'Não definida'}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Gênero</label>
                  <div className="px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 capitalize">
                    {team.gender || 'Não definido'}
                  </div>
                </div>
              </div>

              {/* Last change indicator */}
              {lastChange && (
                <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-2">
                  <ClockIcon className="w-3 h-3" />
                  <span>{lastChange.action} por {lastChange.by} em {lastChange.at}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Section: Members & Permissions */}
      {/* ================================================================== */}
      {canChangeRoles && (
        <section>
          <SectionHeader
            icon={<PersonIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />}
            title="Membros e Permissões"
            description="Gerencie as funções de acesso dos membros da equipe"
          />

          <div className="bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            {isLoadingMembers ? (
              <div className="p-8 flex items-center justify-center">
                <ReloadIcon className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : members.length === 0 ? (
              <div className="p-8 text-center">
                <PersonIcon className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Nenhum membro encontrado</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {members.map((member) => {
                  const isOwnerMember = member.role === 'owner';
                  const badge = getRoleBadge(member.role);
                  
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center text-white font-bold text-sm">
                          {member.full_name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              {member.full_name}
                            </span>
                            {getRoleIcon(member.role)}
                          </div>
                          {member.email && (
                            <span className="text-[11px] text-slate-400">{member.email}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isOwnerMember ? (
                          <span className={`px-3 py-1 text-[11px] font-bold rounded-full ${badge.className}`}>
                            {badge.label}
                          </span>
                        ) : (
                          <RoleDropdown
                            currentRole={member.role}
                            memberName={member.full_name}
                            onRoleChange={(role) => handleRoleChange(member.id, role)}
                            disabled={!canChangeRoles}
                            isLoading={changingRoleId === member.id}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* Section: Training Settings (Step 15) */}
      {/* ================================================================== */}
      {canManageTeam && (
        <section>
          <SectionHeader
            icon={<ActivityLogIcon className="w-5 h-5 text-emerald-500" />}
            title="Configurações de Treino"
            description="Ajuste a sensibilidade dos alertas automáticos de wellness"
            badge="Novo"
          />

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
            {/* Threshold Slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Sensibilidade de Alertas
                  </label>
                  <SaveIndicator status={thresholdSaveStatus} />
                </div>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {alertThreshold.toFixed(1)}x
                </span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.1"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(parseFloat(e.target.value))}
                onMouseUp={(e) => handleThresholdSave(parseFloat((e.target as HTMLInputElement).value))}
                onTouchEnd={(e) => handleThresholdSave(parseFloat((e.target as HTMLInputElement).value))}
                className="w-full h-2 bg-gradient-to-r from-amber-200 via-emerald-200 to-blue-200 dark:from-amber-900 dark:via-emerald-900 dark:to-blue-900 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:hover:bg-emerald-600 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-emerald-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:hover:bg-emerald-600"
              />

              {/* Labels */}
              <div className="flex items-center justify-between mt-2 px-1">
                <div className="flex items-center gap-1.5">
                  <ExclamationTriangleIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">1.0 - Muito sensível</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircledIcon className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">2.0 - Padrão</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <RocketIcon className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">3.0 - Tolerante</span>
                </div>
              </div>

              {/* Info box */}
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <InfoCircledIcon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <p>
                      <strong className="text-slate-700 dark:text-slate-300">Como funciona:</strong> Este multiplicador ajusta quando o sistema gera alertas automáticos baseados nos dados de wellness dos atletas.
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 mt-2 pl-1">
                      <li><strong>1.5x:</strong> Recomendado para juvenis (mais sensível)</li>
                      <li><strong>2.0x:</strong> Padrão para adultos</li>
                      <li><strong>2.5-3.0x:</strong> Para equipes tolerantes (menos alertas)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* Section: Danger Zone */}
      {/* ================================================================== */}
      <section>
        <SectionHeader
          icon={<ExclamationTriangleIcon className="w-5 h-5 text-red-500" />}
          title="Zona de Perigo"
          description="Ações irreversíveis que afetam permanentemente a equipe"
          badge="Cuidado"
        />

        <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-6 space-y-4">
          {/* Export Data */}
          <div className="flex items-start justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <DownloadIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Exportar dados</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Baixe todos os dados da equipe antes de realizar ações destrutivas.
              </p>
            </div>
            <button
              onClick={handleExportData}
              className="ml-4 text-xs font-semibold text-slate-700 dark:text-slate-300 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all whitespace-nowrap flex items-center gap-2"
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              Exportar
            </button>
          </div>

          {/* Leave Team */}
          {canLeaveTeam && (
            <div className="flex items-start justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <ExitIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Sair da equipe</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Você perderá acesso a treinos, estatísticas e configurações desta equipe.
                </p>
              </div>
              <button
                onClick={() => setShowLeaveModal(true)}
                className="ml-4 text-xs font-semibold text-slate-700 dark:text-slate-300 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all whitespace-nowrap flex items-center gap-2"
              >
                <ExitIcon className="w-3.5 h-3.5" />
                Sair da equipe
              </button>
            </div>
          )}

          {/* Delete Team */}
          {canDeleteTeam && (
            <div className="flex items-start justify-between p-4 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-lg" data-testid="danger-zone">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">Excluir equipe permanentemente</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Esta ação é <strong>irreversível</strong>. Todos os dados serão apagados permanentemente.
                </p>
                {teamStats.members > 0 && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                    <InfoCircledIcon className="w-3 h-3" />
                    Esta equipe possui {teamStats.members} membro(s) que perderão acesso.
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                data-testid="delete-team-btn"
                className="ml-4 text-xs font-bold text-white px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all whitespace-nowrap flex items-center gap-2"
              >
                <TrashIcon className="w-3.5 h-3.5" />
                Excluir equipe
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================== */}
      {/* Modal: Leave Team */}
      {/* ================================================================== */}
      <AnimatePresence>
        {showLeaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          >
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => !isLeaving && setShowLeaveModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                  <ExitIcon className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-xl font-heading font-bold text-center text-slate-900 dark:text-white">
                  Tem certeza que deseja sair?
                </h2>
                <p className="text-sm text-slate-500 text-center mt-2">
                  Você perderá acesso a treinos, estatísticas e membros da equipe <strong>{team.name}</strong>.
                </p>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex gap-3">
                <button
                  onClick={() => setShowLeaveModal(false)}
                  disabled={isLeaving}
                  className="flex-1 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLeaveTeam}
                  disabled={isLeaving}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLeaving ? (
                    <>
                      <ReloadIcon className="w-4 h-4 animate-spin" />
                      Saindo...
                    </>
                  ) : (
                    <>
                      <ExitIcon className="w-4 h-4" />
                      Sair da equipe
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================== */}
      {/* Modal: Delete Team */}
      {/* ================================================================== */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          >
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => !isDeleting && setShowDeleteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              data-testid="confirm-delete-modal"
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-red-200 dark:border-red-900/50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                  <ExclamationTriangleIcon className="w-7 h-7 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-heading font-bold text-center text-slate-900 dark:text-white">
                  Excluir equipe permanentemente
                </h2>
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-xs text-red-700 dark:text-red-300 text-center">
                    ⚠️ Esta ação <strong>não pode ser desfeita</strong>. Todos os dados da equipe, treinos, estatísticas e histórico serão apagados para sempre.
                  </p>
                </div>

                {/* Stats warning */}
                {teamStats.members > 0 && (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                      Esta equipe possui <strong>{teamStats.members} membros</strong> que perderão acesso.
                    </p>
                  </div>
                )}

                {/* Confirmation input */}
                <div className="mt-4 space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Digite <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{team.name}</span> para confirmar:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-300 dark:focus:border-red-800 outline-none transition-all"
                    placeholder="Digite o nome da equipe"
                    autoFocus
                  />
                  {deleteConfirmText && deleteConfirmText !== team.name && (
                    <p className="text-[11px] text-red-500 flex items-center gap-1">
                      <Cross2Icon className="w-3 h-3" />
                      O nome não corresponde
                    </p>
                  )}
                  {deleteConfirmText === team.name && (
                    <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                      <CheckIcon className="w-3 h-3" />
                      Nome confirmado
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  disabled={isDeleting}
                  data-testid="cancel-delete-btn"
                  className="flex-1 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteTeam}
                  disabled={isDeleting || deleteConfirmText !== team.name}
                  data-testid="confirm-delete-btn"
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <ReloadIcon className="w-4 h-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="w-4 h-4" />
                      Excluir equipe
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsTab;
