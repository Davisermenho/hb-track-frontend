'use client';

import React, { useState, useEffect } from 'react';
import { LockClosedIcon, TrashIcon, InfoCircledIcon, PersonIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-ui';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge-ui';
import { toast } from 'sonner';
import { TeamStaffMember } from '@/lib/api/teams';

// Avatar components - shadcn style
const Avatar = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className || ''}`} {...props}>
    {children}
  </div>
);

const AvatarFallback = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex h-full w-full items-center justify-center rounded-full bg-muted ${className || ''}`} {...props}>
    {children}
  </div>
);

interface AvailableCoach {
  id: string;
  person_id: string;
  full_name: string;
  email: string;
  role: string;
}

interface StaffListProps {
  teamId: string;
  canManage: boolean;
}

export const StaffList: React.FC<StaffListProps> = ({ teamId, canManage }) => {
  const router = useRouter();
  const [staff, setStaff] = useState<TeamStaffMember[]>([]);
  const [hasCoach, setHasCoach] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // State para modal de remoção
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamStaffMember | null>(null);
  
  // State para modal de adicionar coach
  const [isAddCoachDialogOpen, setIsAddCoachDialogOpen] = useState(false);
  const [availableCoaches, setAvailableCoaches] = useState<AvailableCoach[]>([]);
  const [selectedCoachId, setSelectedCoachId] = useState<string>('');
  const [isLoadingCoaches, setIsLoadingCoaches] = useState(false);
  const [isSubmittingCoach, setIsSubmittingCoach] = useState(false);

  // Buscar staff
  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const { teamsService } = await import('@/lib/api/teams');
      const response = await teamsService.getStaff(teamId, true); // active_only=true

      setStaff(response.items || []);
      
      // Verificar se há coach (role === 'treinador')
      const hasActiveCoach = response.items.some(
        (member: TeamStaffMember) => member.role === 'treinador' && member.status === 'ativo'
      );
      setHasCoach(hasActiveCoach);
    } catch (error) {
      console.error('Erro ao buscar staff:', error);
      setStaff([]);
      setHasCoach(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [teamId]);

  // Abrir modal de remoção
  const handleRemoveClick = (member: TeamStaffMember) => {
    setMemberToRemove(member);
    setIsRemoveDialogOpen(true);
  };

  // Confirmar remoção
  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;

    try {
      const { teamsService } = await import('@/lib/api/teams');
      const response = await teamsService.removeStaffMember(teamId, memberToRemove.id);

      setIsRemoveDialogOpen(false);

      // SE equipe ficou sem coach, mostrar toast com ação
      if (response.team_without_coach) {
        toast.error('Equipe sem treinador', {
          description: 'A equipe precisa de um treinador para gerenciar treinos e jogos.',
          duration: 7000,
          action: {
            label: 'Adicionar Treinador',
            onClick: () => setIsAddCoachDialogOpen(true),
          },
        });
        setHasCoach(false);
      } else {
        toast.success(`${memberToRemove.full_name} removido da equipe`);
      }

      // Recarregar lista
      await fetchStaff();
    } catch (error: any) {
      console.error('Erro ao remover membro:', error);
      toast.error('Erro ao remover membro', {
        description: error.response?.data?.detail?.message || 'Tente novamente mais tarde',
      });
    } finally {
      setMemberToRemove(null);
    }
  };

  // Abrir modal de adicionar coach
  const handleAddCoachClick = async () => {
    setIsAddCoachDialogOpen(true);
    setIsLoadingCoaches(true);

    try {
      const { orgMembershipsService } = await import('@/lib/api/org-memberships');
      const response = await orgMembershipsService.list({
        role_id: 3, // treinador
        active_only: true,
      });

      setAvailableCoaches(response.items || []);
    } catch (error) {
      console.error('Erro ao buscar coaches:', error);
      toast.error('Erro ao carregar treinadores');
    } finally {
      setIsLoadingCoaches(false);
    }
  };

  // Submeter novo coach
  const handleSubmitCoach = async () => {
    if (!selectedCoachId) return;

    setIsSubmittingCoach(true);

    try {
      const { teamsService } = await import('@/lib/api/teams');
      await teamsService.assignCoach(teamId, selectedCoachId);

      toast.success('Treinador adicionado com sucesso');
      setIsAddCoachDialogOpen(false);
      setSelectedCoachId('');
      setHasCoach(true);

      // Recarregar staff
      await fetchStaff();
    } catch (error: any) {
      console.error('Erro ao adicionar coach:', error);
      toast.error('Erro ao adicionar treinador', {
        description: error.response?.data?.detail?.message || 'Tente novamente',
      });
    } finally {
      setIsSubmittingCoach(false);
    }
  };

  // Obter cor do badge baseado no papel
  const getRoleBadgeClass = (role: string) => {
    const colors: Record<string, string> = {
      dirigente: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-black',
      coordenador: 'bg-blue-600 text-white dark:bg-blue-400 dark:text-black',
      treinador: 'bg-violet-600 text-white dark:bg-violet-400 dark:text-black',
    };
    return colors[role] || 'bg-slate-400 text-white';
  };

  // Obter label do papel
  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      dirigente: 'Dirigente',
      coordenador: 'Coordenador',
      treinador: 'Treinador',
    };
    return labels[role] || role;
  };

  // Obter iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Formatar data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-3 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-lg"
          >
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-24" />
            </div>
            <div className="w-20 h-6 bg-slate-100 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Banner: Equipe sem coach */}
      {!hasCoach && canManage && (
        <div className="bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 rounded-md p-4 flex items-start gap-3">
          <InfoCircledIcon className="w-4 h-4 text-amber-600 dark:text-amber-500 mt-0.5" />
          <div className="flex-1 text-sm text-amber-800 dark:text-amber-300 flex items-center justify-between">
            <span>
              <strong>Equipe sem treinador.</strong> A equipe precisa de um treinador para gerenciar treinos e jogos.
            </span>
            <Button
              size="sm"
              onClick={handleAddCoachClick}
              className="ml-4 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <PersonIcon className="w-3.5 h-3.5 mr-1.5" />
              Adicionar Treinador
            </Button>
          </div>
        </div>
      )}

      {/* Lista de staff */}
      {staff.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <PersonIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhum membro na comissão técnica</p>
        </div>
      ) : (
        <div className="space-y-2">
          {staff.map((member) => {
            const isCoach = member.role === 'treinador';

            return (
              <div
                key={member.id}
                className="flex items-center gap-4 px-5 py-3 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                {/* Avatar */}
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300 text-sm font-semibold">
                    {getInitials(member.full_name)}
                  </AvatarFallback>
                </Avatar>

                {/* Nome e papel */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {member.full_name}
                    </p>
                    <Badge className={`text-[10px] px-2 py-0.5 ${getRoleBadgeClass(member.role)}`}>
                      {getRoleLabel(member.role)}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Desde {formatDate(member.start_at)}
                  </p>
                </div>

                {/* Botões de ação */}
                {canManage && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 hover:bg-slate-200 dark:hover:bg-slate-700"
                      aria-label="Editar permissões"
                    >
                      <LockClosedIcon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveClick(member)}
                      className="h-7 w-7 hover:bg-red-100 dark:hover:bg-red-950"
                      aria-label={`Remover ${member.full_name}`}
                    >
                      <TrashIcon className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Confirmação de remoção */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro</AlertDialogTitle>
            <AlertDialogDescription>
              {memberToRemove?.role === 'treinador' ? (
                <span className="text-amber-600 dark:text-amber-500 font-semibold">
                  ⚠️ A equipe ficará SEM TREINADOR após esta ação.
                </span>
              ) : (
                <span>
                  <strong>{memberToRemove?.full_name}</strong> será removido da comissão técnica.
                </span>
              )}
              <br />
              <br />
              Esta ação não pode ser desfeita. Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal: Adicionar Treinador */}
      <Dialog open={isAddCoachDialogOpen} onOpenChange={setIsAddCoachDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Treinador</DialogTitle>
            <DialogDescription>
              Selecione um treinador cadastrado na organização ou cadastre um novo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Select de coaches */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Treinador
              </label>
              <Select
                value={selectedCoachId}
                onValueChange={setSelectedCoachId}
                disabled={isLoadingCoaches}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um treinador" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCoaches ? (
                    <div className="py-4 text-center text-sm text-slate-500">Carregando...</div>
                  ) : availableCoaches.length === 0 ? (
                    <div className="py-4 text-center text-sm text-slate-500">
                      Nenhum treinador disponível
                    </div>
                  ) : (
                    availableCoaches.map((coach) => (
                      <SelectItem key={coach.id} value={coach.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="bg-violet-100 text-violet-700 text-[10px]">
                              {getInitials(coach.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{coach.full_name}</span>
                            <span className="text-xs text-slate-500">{coach.email}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Separador */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">ou</span>
              </div>
            </div>

            {/* Botão cadastrar novo coach */}
            <Button
              variant="outline"
              className="w-full border-dashed hover:border-brand-400 hover:text-brand-600"
              onClick={() => {
                setIsAddCoachDialogOpen(false);
                router.push('/organization/members?action=invite&role=treinador');
              }}
            >
              <PersonIcon className="w-4 h-4 mr-2" />
              Cadastrar Novo Treinador
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsAddCoachDialogOpen(false);
                setSelectedCoachId('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitCoach}
              disabled={!selectedCoachId || isSubmittingCoach}
            >
              {isSubmittingCoach ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
