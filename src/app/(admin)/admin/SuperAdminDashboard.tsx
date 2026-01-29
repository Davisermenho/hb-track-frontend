'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Calendar, 
  Play, 
  Settings, 
  ShieldAlert, 
  UserCheck, 
  Building2,
  Database,
  Activity,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ArrowUp,
  ArrowRight,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// Types
interface StatItem {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  badge?: string;
  loading?: boolean;
}

interface ActionItem {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  onClick?: () => void;
  variant?: 'default' | 'danger';
}

interface DashboardStats {
  organizations: number;
  teams: number;
  athletes: number;
  pendingInvites: number;
  users: number;
  trainingSessions: number;
}

// API Base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Cookie HttpOnly enviado automaticamente via credentials: 'include'

// StatCard Component
const StatCard: React.FC<StatItem> = ({ label, value, icon: Icon, trend, badge, loading }) => {
  return (
    <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4 group hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">{label}</span>
        <Icon className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
      </div>
      <div className="flex items-end gap-3">
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        ) : (
          <span className="text-3xl font-bold text-slate-900 dark:text-white leading-none tracking-tight">{value}</span>
        )}
        {trend !== undefined && !loading && (
          <span className="flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
            <ArrowUp className="w-3 h-3" />
            {trend}
          </span>
        )}
        {badge && !loading && (
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-500 text-[11px] font-bold">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};

// ActionCard Component
const ActionCard: React.FC<ActionItem> = ({ title, description, icon: Icon, href, onClick, variant = 'default' }) => {
  const router = useRouter();
  
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    } else if (href !== '#') {
      e.preventDefault();
      router.push(href);
    }
  };

  const isDanger = variant === 'danger';
  
  return (
    <a 
      href={href}
      onClick={handleClick}
      className={`group bg-white dark:bg-[#0a0a0a] border rounded-lg p-6 hover:shadow-xl transition-all duration-300 flex items-start gap-5 ${
        isDanger 
          ? 'border-red-200 dark:border-red-900/50 hover:border-red-400 dark:hover:border-red-700' 
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-500'
      }`}
    >
      <div className={`h-12 w-12 shrink-0 rounded-md flex items-center justify-center transition-all duration-300 shadow-inner ${
        isDanger 
          ? 'bg-red-50 dark:bg-red-950/50 text-red-500 group-hover:bg-red-500 group-hover:text-white' 
          : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 group-hover:bg-slate-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black'
      }`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="flex items-center justify-between">
          <h3 className={`text-[15px] font-bold leading-tight ${
            isDanger ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-white'
          }`}>
            {title}
          </h3>
          <ArrowRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-all ${
            isDanger ? 'text-red-500' : 'text-slate-400'
          }`} />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
          {description}
        </p>
      </div>
    </a>
  );
};

// Main Dashboard Component
const SuperAdminDashboard: React.FC = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch dashboard stats
  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Cookie HttpOnly enviado automaticamente via credentials: 'include'
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'x-organization-id': '1bf1ee84-7e65-442f-99fa-9ecc4ff52ded',
      };

      // Fetch multiple endpoints in parallel
      const [teamsRes, pendingRes] = await Promise.all([
        fetch(`${API_BASE}/teams?limit=1`, { headers, credentials: 'include' }),
        fetch(`${API_BASE}/team-members/pending`, { headers, credentials: 'include' }),
      ]);

      const teamsData = teamsRes.ok ? await teamsRes.json() : { total: 0 };
      const pendingData = pendingRes.ok ? await pendingRes.json() : { total: 0 };

      setStats({
        organizations: 1, // Will be fetched when endpoint exists
        teams: teamsData.total || 0,
        athletes: 0, // Will be fetched
        pendingInvites: pendingData.total || 0,
        users: 0, // Will be fetched
        trainingSessions: 0, // Will be fetched
      });
    } catch (err) {
      console.error('Erro ao carregar stats:', err);
      setError('Não foi possível carregar as estatísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Show toast
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Actions
  const handleCleanDatabase = async () => {
    if (!confirm('⚠️ ATENÇÃO: Esta ação irá limpar TODOS os dados de teste do banco.\n\nDeseja continuar?')) {
      return;
    }
    
    setActionLoading('clean');
    try {
      // TODO: Implementar endpoint de limpeza
      showToast('Limpeza executada com sucesso!', 'success');
      fetchStats();
    } catch (err) {
      showToast('Erro ao limpar banco de dados', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetSeason = async () => {
    if (!confirm('Deseja iniciar uma nova temporada? Isso arquivará os dados da temporada atual.')) {
      return;
    }
    
    setActionLoading('season');
    try {
      // TODO: Implementar endpoint de reset de temporada
      showToast('Nova temporada iniciada!', 'success');
    } catch (err) {
      showToast('Erro ao iniciar temporada', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Stats cards configuration
  const statsCards: StatItem[] = [
    { 
      label: 'Organizações', 
      value: stats?.organizations ?? '-', 
      icon: Building2,
      loading 
    },
    { 
      label: 'Equipes Ativas', 
      value: stats?.teams ?? '-', 
      icon: Users,
      loading 
    },
    { 
      label: 'Convites Pendentes', 
      value: stats?.pendingInvites ?? '-', 
      icon: Mail, 
      badge: (stats?.pendingInvites ?? 0) > 0 ? 'Ação necessária' : undefined,
      loading 
    },
    { 
      label: 'Temporada Atual', 
      value: '2025/26', 
      icon: Calendar 
    },
  ];

  // Action cards configuration
  const managementActions: ActionItem[] = [
    { 
      title: 'Gerenciar Equipes', 
      description: 'Criar, editar e arquivar equipes. Vincular staff e atletas.', 
      icon: Users, 
      href: '/teams' 
    },
    { 
      title: 'Gerenciar Atletas', 
      description: 'Base completa de atletas, fichas e histórico.', 
      icon: UserPlus, 
      href: '/athletes' 
    },
    { 
      title: 'Sessões de Treino', 
      description: 'Planejamento e execução de treinos por equipe.', 
      icon: Activity, 
      href: '/training' 
    },
    { 
      title: 'Configurar Organização', 
      description: 'Dados da entidade, logos e preferências globais.', 
      icon: Settings, 
      href: '#' 
    },
    { 
      title: 'Gerenciar Dirigentes', 
      description: 'Controle de acesso para diretores e presidentes.', 
      icon: ShieldAlert, 
      href: '#' 
    },
    { 
      title: 'Gerenciar Coordenadores', 
      description: 'Atribuição de coordenadores técnicos por categoria.', 
      icon: UserCheck, 
      href: '#' 
    },
  ];

  const systemActions: ActionItem[] = [
    { 
      title: 'Iniciar Nova Temporada', 
      description: 'Arquivar dados atuais e preparar novo ciclo.', 
      icon: Play, 
      href: '#',
      onClick: handleResetSeason
    },
    { 
      title: 'Status do Sistema', 
      description: 'Verificar conexões, APIs e integridade dos dados.', 
      icon: Database, 
      href: '#' 
    },
    { 
      title: 'Limpar Dados de Teste', 
      description: 'Remove registros de teste mantendo estrutura.', 
      icon: Trash2, 
      href: '#',
      onClick: handleCleanDatabase,
      variant: 'danger'
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-top ${
          toast.type === 'success' 
            ? 'bg-emerald-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        {/* Header Section */}
        <header className="mb-12">
          <nav className="flex items-center gap-2 mb-4 text-[11px] font-bold uppercase tracking-widest">
            <span className="text-slate-400 dark:text-slate-500">Dashboard</span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-slate-900 dark:text-slate-200">Super Admin</span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="font-heading font-extrabold text-4xl text-slate-900 dark:text-white tracking-tight">
                Painel Administrativo
              </h1>
              <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">
                Controle total do sistema HB Track
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchStats}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 tracking-[0.15em] uppercase shadow-sm">
                Super Admin
              </span>
            </div>
          </div>
          <div className="mt-8 w-full h-px bg-slate-200 dark:bg-slate-800"></div>
        </header>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
            <button 
              onClick={fetchStats}
              className="ml-auto text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <section className="mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {statsCards.map((stat, idx) => (
              <StatCard key={idx} {...stat} />
            ))}
          </div>
        </section>

        {/* Management Tools Grid */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="font-heading font-bold text-2xl text-slate-900 dark:text-white tracking-tight">
              Gestão e Organização
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
              Acesse rapidamente as ferramentas de administração do sistema.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {managementActions.map((action, idx) => (
              <ActionCard key={idx} {...action} />
            ))}
          </div>
        </section>

        {/* System Tools Grid */}
        <section>
          <div className="mb-8">
            <h2 className="font-heading font-bold text-2xl text-slate-900 dark:text-white tracking-tight">
              Ferramentas do Sistema
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
              Operações avançadas e manutenção do sistema.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {systemActions.map((action, idx) => (
              <ActionCard key={idx} {...action} />
            ))}
          </div>
        </section>

        {/* Quick Links Footer */}
        <footer className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Links rápidos:</span>
            <Link href="/teams" className="hover:text-slate-900 dark:hover:text-white transition-colors">Equipes</Link>
            <Link href="/athletes" className="hover:text-slate-900 dark:hover:text-white transition-colors">Atletas</Link>
            <Link href="/training" className="hover:text-slate-900 dark:hover:text-white transition-colors">Treinos</Link>
            <Link href="/games" className="hover:text-slate-900 dark:hover:text-white transition-colors">Jogos</Link>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
