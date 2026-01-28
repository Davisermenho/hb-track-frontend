'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCog,
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building2,
  Mail,
  Phone,
  User,
  Shield,
  Users,
  Briefcase,
  ClipboardList,
  Target,
  Eye,
  EyeOff,
} from 'lucide-react';
import { orgMembershipsService, OrgMembership, OrgMembershipRole, staffService, StaffCreatePayload } from '@/lib/api/org-memberships';
import { organizationsService, Organization } from '@/lib/api/organizations';
import { usersService } from '@/lib/api/users';

// ============================================================================
// TYPES
// ============================================================================

type StaffRole = 'dirigente' | 'coordenador' | 'treinador';

interface FormData {
  // Dados pessoa
  full_name: string;
  social_name: string;
  birth_date: string;
  gender: string;
  
  // Dados usuário
  email: string;
  password: string;
  confirmPassword: string;
  
  // Membership
  role: StaffRole;
  organization_id: string;
  
  // Contatos
  phone: string;
}

interface StaffMember {
  membership: OrgMembership;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

// ============================================================================
// HELPERS
// ============================================================================

const getRoleIcon = (role: OrgMembershipRole) => {
  switch (role) {
    case 'dirigente':
      return <Briefcase className="w-4 h-4" />;
    case 'coordenador':
      return <ClipboardList className="w-4 h-4" />;
    case 'treinador':
      return <Target className="w-4 h-4" />;
    default:
      return <User className="w-4 h-4" />;
  }
};

const getRoleName = (role: OrgMembershipRole) => {
  switch (role) {
    case 'dirigente':
      return 'Dirigente';
    case 'coordenador':
      return 'Coordenador';
    case 'treinador':
      return 'Treinador';
    default:
      return role;
  }
};

const getRoleColor = (role: OrgMembershipRole) => {
  switch (role) {
    case 'dirigente':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    case 'coordenador':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'treinador':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 2) return `(${numbers}`;
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
};

const cleanPhone = (value: string): string => value.replace(/\D/g, '');

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function StaffPage() {
  // State
  const [staff, setStaff] = useState<OrgMembership[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterOrg, setFilterOrg] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(true);
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<OrgMembership | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    social_name: '',
    birth_date: '',
    gender: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'treinador',
    organization_id: '',
    phone: '',
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<OrgMembership | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Active tabs
  const [activeTab, setActiveTab] = useState<'person' | 'user' | 'org'>('person');

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchOrganizations = useCallback(async () => {
    try {
      const response = await organizationsService.list({ limit: 100, is_active: true });
      setOrganizations(response.items);
    } catch (err) {
      console.error('Erro ao carregar organizações:', err);
    }
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: Record<string, unknown> = {
        page,
        limit,
      };
      
      if (filterOrg) params.organization_id = filterOrg;
      if (filterRole) params.role = filterRole;
      if (filterActive !== undefined) params.is_active = filterActive;
      
      const response = await orgMembershipsService.list(params as Parameters<typeof orgMembershipsService.list>[0]);
      
      setStaff(response.items);
      setTotal(response.total);
      setTotalPages(Math.ceil(response.total / limit));
    } catch (err) {
      console.error('Erro ao carregar staff:', err);
      setError('Erro ao carregar membros. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [page, filterOrg, filterRole, filterActive]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStaff();
  };

  const openCreateModal = (defaultRole?: StaffRole) => {
    setEditingMember(null);
    setActiveTab('person');
    setShowPassword(false);
    setFormData({
      full_name: '',
      social_name: '',
      birth_date: '',
      gender: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: defaultRole || 'treinador',
      organization_id: organizations.length === 1 ? organizations[0].id : '',
      phone: '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    setShowPassword(false);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    let formattedValue = value;
    
    if (field === 'phone') {
      formattedValue = formatPhone(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const validateForm = (): string | null => {
    if (!formData.full_name.trim()) {
      return 'Nome completo é obrigatório';
    }
    if (formData.full_name.trim().length < 3) {
      return 'Nome deve ter pelo menos 3 caracteres';
    }
    if (!formData.email.trim()) {
      return 'E-mail é obrigatório';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'E-mail inválido';
    }
    if (!formData.password) {
      return 'Senha é obrigatória';
    }
    if (formData.password.length < 6) {
      return 'Senha deve ter pelo menos 6 caracteres';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Senhas não conferem';
    }
    if (formData.role !== 'dirigente' && !formData.organization_id) {
      return 'Organização é obrigatória para Coordenadores e Treinadores';
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const personData: StaffCreatePayload['person'] = {
        full_name: formData.full_name.trim(),
        social_name: formData.social_name.trim() || undefined,
        birth_date: formData.birth_date || undefined,
        gender: formData.gender || undefined,
      };

      const userData = {
        email: formData.email.trim(),
        password: formData.password,
      };

      const contacts: StaffCreatePayload['contacts'] = formData.phone ? [
        {
          contact_type: 'phone',
          contact_value: cleanPhone(formData.phone),
          is_primary: true,
        }
      ] : undefined;

      switch (formData.role) {
        case 'dirigente':
          await staffService.createDirigente(
            personData,
            userData,
            formData.organization_id || undefined,
            contacts
          );
          break;
        case 'coordenador':
          await staffService.createCoordenador(
            personData,
            userData,
            formData.organization_id,
            contacts
          );
          break;
        case 'treinador':
          await staffService.createTreinador(
            personData,
            userData,
            formData.organization_id,
            contacts
          );
          break;
      }
      
      setSuccess(`${getRoleName(formData.role)} criado com sucesso!`);
      closeModal();
      fetchStaff();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      console.error('Erro ao salvar:', err);
      const apiError = err as { response?: { data?: { detail?: string } } };
      const message = apiError?.response?.data?.detail || 'Erro ao salvar. Tente novamente.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deleteConfirm) return;

    try {
      setDeleting(true);
      setError(null);
      
      await orgMembershipsService.deactivate(deleteConfirm.id);
      setSuccess('Membro desativado com sucesso!');
      setDeleteConfirm(null);
      fetchStaff();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erro ao desativar:', err);
      setError('Erro ao desativar membro. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getOrganizationName = (orgId: string): string => {
    const org = organizations.find(o => o.id === orgId);
    return org?.name || '-';
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCog className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Equipe Técnica
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Dirigentes, Coordenadores e Treinadores
                </p>
              </div>
            </div>
            
            {/* Quick Add Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => openCreateModal('dirigente')}
                className="inline-flex items-center gap-2 px-3 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors text-sm"
              >
                <Briefcase className="w-4 h-4" />
                Dirigente
              </button>
              <button
                onClick={() => openCreateModal('coordenador')}
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm"
              >
                <ClipboardList className="w-4 h-4" />
                Coordenador
              </button>
              <button
                onClick={() => openCreateModal('treinador')}
                className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors text-sm"
              >
                <Target className="w-4 h-4" />
                Treinador
              </button>
              <button
                onClick={() => openCreateModal()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Novo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-5 h-5 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-300">{success}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            {/* Organization Filter */}
            <select
              value={filterOrg}
              onChange={(e) => {
                setFilterOrg(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todas organizações</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todas funções</option>
              <option value="dirigente">Dirigentes</option>
              <option value="coordenador">Coordenadores</option>
              <option value="treinador">Treinadores</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterActive === undefined ? '' : filterActive.toString()}
              onChange={(e) => {
                const val = e.target.value;
                setFilterActive(val === '' ? undefined : val === 'true');
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todos status</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Filtrar
            </button>
          </form>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{total}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {staff.filter(s => s.role === 'dirigente').length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Dirigentes</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {staff.filter(s => s.role === 'coordenador').length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Coordenadores</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {staff.filter(s => s.role === 'treinador').length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Treinadores</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando...</span>
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-12">
              <UserCog className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Nenhum membro encontrado
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Use os botões acima para adicionar um novo membro.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Membro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Função
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Organização
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Entrada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {member.user?.name || member.person?.full_name || '-'}
                          </div>
                          {member.user?.email && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {member.user.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(member.role as OrgMembershipRole)}`}>
                        {getRoleIcon(member.role as OrgMembershipRole)}
                        {getRoleName(member.role as OrgMembershipRole)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {getOrganizationName(member.organization_id || "")}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {member.joined_at ? new Date(member.joined_at).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {member.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDeleteConfirm(member)}
                          disabled={!member.is_active}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Desativar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {!loading && staff.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, total)} de {total} membros
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  formData.role === 'dirigente' ? 'bg-amber-100 dark:bg-amber-900/30' :
                  formData.role === 'coordenador' ? 'bg-blue-100 dark:bg-blue-900/30' :
                  'bg-emerald-100 dark:bg-emerald-900/30'
                }`}>
                  {getRoleIcon(formData.role)}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Novo {getRoleName(formData.role)}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('person')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'person'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Dados Pessoais
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('user')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'user'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Acesso ao Sistema
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('org')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'org'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Organização
                  </span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Tab: Dados Pessoais */}
              {activeTab === 'person' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Nome completo da pessoa"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome Social
                    </label>
                    <input
                      type="text"
                      value={formData.social_name}
                      onChange={(e) => handleInputChange('social_name', e.target.value)}
                      placeholder="Nome social (opcional)"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Data de Nascimento
                      </label>
                      <input
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) => handleInputChange('birth_date', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Gênero
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="">Selecione</option>
                        <option value="F">Feminino</option>
                        <option value="M">Masculino</option>
                        <option value="O">Outro</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Telefone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Tab: Acesso ao Sistema */}
              {activeTab === 'user' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      E-mail *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="email@exemplo.com"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Este será o login do usuário no sistema
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Senha *
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full pl-10 pr-12 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confirmar Senha *
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Repita a senha"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Tab: Organização */}
              {activeTab === 'org' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Função *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="dirigente">Dirigente</option>
                      <option value="coordenador">Coordenador</option>
                      <option value="treinador">Treinador</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Organização {formData.role !== 'dirigente' && '*'}
                    </label>
                    <select
                      value={formData.organization_id}
                      onChange={(e) => handleInputChange('organization_id', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Selecione uma organização</option>
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                    {formData.role === 'dirigente' && (
                      <p className="mt-1 text-xs text-gray-500">
                        Para Dirigentes, a organização é opcional (RF1)
                      </p>
                    )}
                    {formData.role !== 'dirigente' && (
                      <p className="mt-1 text-xs text-gray-500">
                        {getRoleName(formData.role)}s recebem vínculo automático com a organização (RF1.1)
                      </p>
                    )}
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                      Regras de Criação (REGRAS.md)
                    </h4>
                    <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                      <li>• <strong>RF1:</strong> Dirigentes NÃO recebem org_membership automaticamente</li>
                      <li>• <strong>RF1.1:</strong> Coordenadores e Treinadores recebem org_membership automático</li>
                      <li>• Um registro na tabela <code>persons</code> será criado</li>
                      <li>• Um registro na tabela <code>users</code> será criado com a role selecionada</li>
                    </ul>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Criar {getRoleName(formData.role)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Desativar Membro
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    O membro será desativado da organização.
                  </p>
                </div>
              </div>
              
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                Tem certeza que deseja desativar{' '}
                <strong>{deleteConfirm.user?.name || deleteConfirm.person?.full_name}</strong>{' '}
                como {getRoleName(deleteConfirm.role as OrgMembershipRole)}?
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeactivate}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Desativando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Desativar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

