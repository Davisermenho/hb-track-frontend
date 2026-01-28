'use client';

import { useEffect, useMemo, useState } from 'react';
import { teamsService, type Team } from '@/lib/api/teams';
import { Plus, SlidersHorizontal, Search, RefreshCw, ArrowRight } from 'lucide-react';
import { CreateTeamModal } from '@/components/Teams/CreateTeamModal';

type TeamStatus = 'todos' | 'ativo' | 'inativo';
type TeamGender = 'todos' | 'feminino' | 'masculino';

const CATEGORY_MAP: Record<string, string> = {
  '1': 'Mirim',
  '2': 'Infantil',
  '3': 'Cadete',
  '4': 'Juvenil',
  '5': 'Júnior',
  '6': 'Adulto',
  '7': 'Master',
};

type DetailAthlete = {
  number: string;
  name: string;
  position: string;
  age: number;
  status: 'Ativo' | 'Lesionado' | 'Suspenso';
  id: string;
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TeamStatus>('todos');
  const [genderFilter, setGenderFilter] = useState<TeamGender>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const detailAthletes: DetailAthlete[] = useMemo(
    () => [
      { number: '10', name: 'Lucas Mendes', position: 'Armador Central', age: 19, status: 'Ativo', id: '8492' },
      { number: '04', name: 'Rafael Costa', position: 'Ponta Esquerda', age: 18, status: 'Ativo', id: '9921' },
      { number: '12', name: 'Gabriel Silva', position: 'Goleiro', age: 20, status: 'Lesionado', id: '1023' },
      { number: '07', name: 'Bruno Ferreira', position: 'Pivô', age: 19, status: 'Ativo', id: '7711' },
      { number: '22', name: 'Pedro Santos', position: 'Armador Direito', age: 18, status: 'Suspenso', id: '9922' },
    ],
    []
  );

  useEffect(() => {
    refreshTeams();
  }, []);

  const refreshTeams = async () => {
    setLoading(true);
    const resp = await teamsService.list();
    setTeams(resp.items || []);
    setLoading(false);
  };

  useEffect(() => {
    setVisibleCount(4);
  }, [search, statusFilter, genderFilter, categoryFilter]);

  const resolveCategoryLabel = (team: Team) => {
    const catId = team.category_id ? String(team.category_id) : '';
    if (catId && CATEGORY_MAP[catId]) return CATEGORY_MAP[catId];
    if ((team as any).category_name) return (team as any).category_name as string;
    return 'Categoria';
  };

  const filtered = useMemo(() => {
    return teams
      .filter((t) => t.is_our_team !== false)
      .filter((t) => {
        const term = search.toLowerCase().trim();
        if (!term) return true;
        return (
          t.name.toLowerCase().includes(term) ||
          t.id.toLowerCase().includes(term) ||
          (t.organization_name || '').toLowerCase().includes(term)
        );
      })
      .filter((t) => {
        if (statusFilter === 'todos') return true;
        const active = t.is_active ?? true;
        return statusFilter === 'ativo' ? active : !active;
      })
      .filter((t) => {
        if (genderFilter === 'todos') return true;
        return (t.gender || '').toLowerCase() === genderFilter;
      })
      .filter((t) => {
        if (categoryFilter === 'todos') return true;
        const catId = t.category_id ? String(t.category_id) : '';
        const catLabel = resolveCategoryLabel(t).toLowerCase();
        return catId === categoryFilter || catLabel === CATEGORY_MAP[categoryFilter]?.toLowerCase();
      });
  }, [teams, search, statusFilter, genderFilter, categoryFilter]);

  const visibleTeams = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const organizationId = teams.find((t) => t.organization_id)?.organization_id;

  return (
    <div className="flex h-[calc(100vh-72px)] overflow-hidden bg-hb-surface text-hb-text dark:bg-[#0a0a0a] dark:text-slate-100">
      {/* Coluna esquerda (lista) */}
      <div className="w-full lg:w-[520px] flex flex-col border-r border-hb-border dark:border-slate-800 bg-white dark:bg-[#0f0f0f]">
        <div className="px-6 py-5 border-b border-hb-border dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center justify-between mb-5">
            <h1 className="font-semibold text-[18px] tracking-tight">Equipes</h1>
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-hb-border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-sm shadow-sm"
                onClick={() => setShowFilters((prev) => !prev)}
                type="button"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {showFilters ? 'Esconder filtros' : 'Filtrar'}
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-sm shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Nova equipe
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                className="w-full bg-slate-50 dark:bg-slate-900 border border-hb-border dark:border-slate-800 rounded-sm py-2 pl-9 pr-4 text-[13px] placeholder-slate-400 focus:ring-0 focus:border-slate-400 dark:focus:border-slate-600 shadow-sm"
                placeholder="Buscar por nome, ID ou clube..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
              />
            </div>
            {showFilters && (
              <div className="grid grid-cols-2 gap-3">
                <select
                  className="w-full bg-white dark:bg-slate-900 border border-hb-border dark:border-slate-800 rounded-sm py-2 px-3 text-[13px] text-slate-900 dark:text-white focus:ring-0 focus:border-slate-400 dark:focus:border-slate-600 shadow-sm"
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value as TeamGender)}
                >
                  <option value="todos">Todos os gêneros</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                </select>
                <select
                  className="w-full bg-white dark:bg-slate-900 border border-hb-border dark:border-slate-800 rounded-sm py-2 px-3 text-[13px] text-slate-900 dark:text-white focus:ring-0 focus:border-slate-400 dark:focus:border-slate-600 shadow-sm"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="todos">Todas categorias</option>
                  {Object.entries(CATEGORY_MAP).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 px-6 py-2 border-b border-hb-border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 text-[11px] font-medium text-slate-500 uppercase tracking-wide">
          <div className="col-span-6 pl-1">Identificação</div>
          <div className="col-span-3 text-right">Categoria</div>
          <div className="col-span-3 text-right pr-1">Status</div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
          {loading ? (
            <div className="p-6 text-sm text-slate-500">Carregando equipes...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">Nenhuma equipe encontrada.</div>
          ) : (
            visibleTeams.map((team) => {
              const isSelected = selectedTeam?.id === team.id;
              return (
                <div
                  key={team.id}
                  className={`group grid grid-cols-12 gap-4 px-6 py-3.5 cursor-pointer border-l-4 transition-all ${
                    isSelected
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-l-black dark:border-l-white'
                      : 'border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:border-l-black dark:hover:border-l-white focus-within:border-l-black dark:focus-within:border-l-white active:border-l-black dark:active:border-l-white'
                  }`}
                  onClick={() => setSelectedTeam(team)}
                >
                  <div className="col-span-6 flex flex-col justify-center">
                    <span className="text-[13px] font-semibold">{team.name}</span>
                    <span className="text-[11px] font-mono text-slate-500 mt-0.5">ID: {team.id.substring(0, 8).toUpperCase()}</span>
                    <span className="text-[11px] text-slate-500">Clube: {team.organization_name || team.organization_id}</span>
                  </div>
                  <div className="col-span-3 flex items-center justify-end">
                    <span className="px-2 py-0.5 rounded-sm text-[11px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-sm">
                      {resolveCategoryLabel(team)}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center justify-end gap-2">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{team.is_active ?? true ? 'Ativo' : 'Inativo'}</span>
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${
                        team.is_active ?? true ? 'bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-900/30' : 'bg-slate-400'
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
          <div className="p-4 text-center border-t border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40">
            {hasMore ? (
              <button
                onClick={() => setVisibleCount((prev) => prev + 4)}
                className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-medium flex items-center justify-center gap-2 mx-auto"
              >
                <RefreshCw className="h-4 w-4" />
                Carregar mais
              </button>
            ) : (
              <span className="text-[11px] text-slate-500">Todas as equipes carregadas</span>
            )}
          </div>
        </div>

        <div className="px-6 py-2.5 border-t border-hb-border dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-[10px] font-mono text-slate-400 flex justify-between items-center">
          <span>
            Registros: {visibleTeams.length} / {filtered.length}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Atualizado
          </span>
        </div>
      </div>

      {/* Coluna direita (detalhe) */}
      <div className="hidden lg:flex flex-1 bg-slate-50/60 dark:bg-[#050505] flex-col overflow-hidden relative">
        {!selectedTeam ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="glass-panel max-w-md w-full text-center relative z-10 p-8 rounded-lg backdrop-blur-sm">
              <div className="h-14 w-14 mx-auto mb-6 text-slate-300 dark:text-slate-700 flex items-center justify-center bg-white dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm">
                <Search className="h-6 w-6" />
              </div>
              <h2 className="text-[16px] font-medium mb-2">Selecione uma equipe</h2>
              <p className="text-slate-500 dark:text-slate-400 text-[13px] leading-relaxed mb-8 max-w-xs mx-auto">
                Clique em uma equipe na lista para abrir o perfil detalhado.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#0d0d0d]">
            <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 bg-white dark:bg-[#0d0d0d] flex-shrink-0">
              <div className="flex items-center text-sm text-slate-500">
                <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors">Equipes</span>
                <ArrowRight className="h-4 w-4 mx-2 text-slate-300" />
                <span className="text-slate-900 dark:text-white font-medium">{selectedTeam.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Search className="absolute inset-y-0 left-0 my-auto ml-0 text-slate-400 h-4 w-4 pointer-events-none" />
                  <input
                    className="pl-6 pr-4 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm transition-all focus:ring-0 focus:border-slate-400 placeholder-slate-400 text-slate-600 dark:text-slate-200 rounded-sm"
                    placeholder="Buscar..."
                    type="text"
                  />
                </div>
              </div>
            </header>

            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-8 pt-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                      <span className="text-slate-400 text-[28px] font-semibold">HB</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">{selectedTeam.name}</h1>
                        <span className="inline-flex items-center px-2 py-1 rounded text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200/60">
                          Temporada Ativa
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="font-mono text-slate-400">ID: {selectedTeam.id.substring(0, 8).toUpperCase()}</span>
                        <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                        <span>Categoria: {resolveCategoryLabel(selectedTeam)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
                      Editar detalhes
                    </button>
                    <button className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 border border-transparent rounded hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2">
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar atleta
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-8 mb-8 border-b border-slate-100 dark:border-slate-800 pb-8">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Jogos</p>
                    <p className="text-2xl font-medium text-slate-900 tracking-tight tabular-nums">24</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Vitórias</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-medium text-slate-900 tracking-tight tabular-nums">18</p>
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">75%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Média gols</p>
                    <p className="text-2xl font-medium text-slate-900 tracking-tight tabular-nums">28.5</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Elenco</p>
                    <p className="text-[13px] text-slate-700 dark:text-slate-300 font-medium">24 atletas</p>
                  </div>
                </div>

                <div className="flex items-center gap-8 border-b border-slate-100 dark:border-slate-800">
                  <button className="pb-3 text-sm font-medium text-slate-900 dark:text-white border-b-2 border-slate-900">Elenco</button>
                  <button className="pb-3 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors border-b-2 border-transparent">
                    Calendário
                  </button>
                  <button className="pb-3 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors border-b-2 border-transparent">
                    Estatísticas
                  </button>
                  <button className="pb-3 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors border-b-2 border-transparent">
                    Histórico
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-8 pb-10">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white dark:bg-[#0d0d0d] z-10">
                    <tr>
                      <th className="py-3 text-xs font-medium text-slate-500 border-b border-slate-100 w-12 text-center">#</th>
                      <th className="py-3 text-xs font-medium text-slate-500 border-b border-slate-100 pl-4">Atleta</th>
                      <th className="py-3 text-xs font-medium text-slate-500 border-b border-slate-100">Posição</th>
                      <th className="py-3 text-xs font-medium text-slate-500 border-b border-slate-100 w-24">Idade</th>
                      <th className="py-3 text-xs font-medium text-slate-500 border-b border-slate-100 w-32">Status</th>
                      <th className="py-3 border-b border-slate-100 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {detailAthletes.map((ath) => (
                      <tr key={ath.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="py-3 text-slate-400 font-mono text-xs text-center border-b border-slate-50 group-hover:border-slate-100">
                          {ath.number}
                        </td>
                        <td className="py-3 pl-4 border-b border-slate-50 group-hover:border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-medium text-slate-600">
                              {ath.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <p className="font-medium text-slate-900 text-[13px] leading-tight">{ath.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">ID: {ath.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-slate-600 text-[13px] border-b border-slate-50 group-hover:border-slate-100">{ath.position}</td>
                        <td className="py-3 text-slate-500 font-mono text-xs border-b border-slate-50 group-hover:border-slate-100">{ath.age}</td>
                        <td className="py-3 border-b border-slate-50 group-hover:border-slate-100">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                ath.status === 'Ativo' ? 'bg-emerald-500' : ath.status === 'Lesionado' ? 'bg-amber-400' : 'bg-slate-400'
                              }`}
                            ></span>
                            <span className="text-[12px] text-slate-600">{ath.status}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right border-b border-slate-50 group-hover:border-slate-100 pr-2">
                          <span className="text-slate-300">⋯</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <CreateTeamModal
        visible={showCreate}
        organizationId={organizationId}
        onClose={() => setShowCreate(false)}
        onCreated={refreshTeams}
      />
    </div>
  );
}
