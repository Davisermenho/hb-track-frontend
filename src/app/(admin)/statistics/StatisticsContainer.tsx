'use client';

import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { statisticsService, type OperationalSessionSnapshot } from '@/lib/api/statistics';
import { apiClient } from '@/lib/api/client';
import { ShieldAlert, ActivitySquare, ClipboardList, Users, AlertTriangle } from 'lucide-react';

type SessionOption = {
  id: string;
  type: 'training' | 'match';
  team: string;
  date: string;
  status: 'scheduled' | 'ongoing' | 'completed';
};

type AthleteRow = {
  athlete_id: string;
  name: string;
  presence: string;
  wellness: string;
  load_status: string;
  overall_status: 'critical' | 'attention' | 'ok';
};


async function fetchSessions(): Promise<SessionOption[]> {
  const resp = await apiClient.get<{ items: any[] }>('/training-sessions', {
    params: { limit: 15, page: 1 },
  });
  const items = resp.items || [];
  return items.map((s) => {
    const date = s.session_at?.split('T')[0] || '';
    const sessionDate = date ? new Date(date) : null;
    const now = new Date();
    const status: SessionOption['status'] =
      sessionDate && sessionDate < new Date(now.getTime() - 3 * 60 * 60 * 1000)
        ? 'completed'
        : sessionDate && sessionDate <= now
          ? 'ongoing'
          : 'scheduled';
    return {
      id: s.id,
      type: 'training',
      team: s.team?.name || s.team_name || 'Equipe',
      date,
      status,
    };
  });
}

export default function StatisticsContainer() {
  const [selectedSession, setSelectedSession] = useState<SessionOption | null>(null);
  const [showModal, setShowModal] = useState(true);
  const [data, setData] = useState<OperationalSessionSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionOptions, setSessionOptions] = useState<SessionOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  const orderedAthletes = useMemo(() => {
    if (!data) return [];
    const priority = { critical: 0, attention: 1, ok: 2 };
    return [...data.athletes].sort(
      (a, b) => priority[a.overall_status] - priority[b.overall_status]
    );
  }, [data]);

  useEffect(() => {
    async function loadSessions() {
      try {
        const sessions = await fetchSessions();
        setSessionOptions(sessions);
        if (sessions.length === 0) {
          setError('Nenhuma sessao recente encontrada.');
        }
      } catch (err) {
        setError('Nao foi possivel carregar as sessoes.');
      }
    }
    loadSessions();
  }, []);

  useEffect(() => {
    if (!selectedSession) return;
    async function fetchSnapshot() {
      setLoading(true);
      setError(null);
      try {
        const snapshot = await statisticsService.getOperationalSession(selectedSession!.id);
        setData(snapshot);
      } catch (error) {
        setData(null);
        setError('Nao foi possivel carregar a sessao selecionada.');
      } finally {
        setLoading(false);
      }
    }
    fetchSnapshot();
  }, [selectedSession]);



  const hasSelection = !!selectedSession;

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white flex flex-col">
      <header className="border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Estatísticas operacionais</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Controle diário de presença, wellness e carga da sessão
          </p>
        </div>
        {hasSelection && data && (
          <div className="text-sm text-right">
            <div className="font-semibold">{data.context.team.name}</div>
            <div className="text-gray-500 dark:text-gray-400">
              {data.context.session_type === 'training' ? 'Treino' : 'Jogo'} · {data.context.date} · {data.context.status}
            </div>
            <button
              className="mt-2 text-brand-500 hover:text-brand-600"
              onClick={() => setShowModal(true)}
            >
              Trocar sessão
            </button>
          </div>
        )}
      </header>

      {error && (
        <div className="mx-6 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-200">
          {error}
        </div>
      )}

      {!hasSelection && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md space-y-3">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8 text-gray-500 dark:text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold">Selecione um treino ou jogo</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Para ver o controle operacional do dia, escolha a sessão relevante. Nenhum dado é exibido sem contexto.
            </p>
            <button
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
              onClick={() => setShowModal(true)}
            >
              Selecionar sessão
            </button>
          </div>
        </div>
      )}

      {hasSelection && data && (
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Pendências */}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card
              title="Ausentes"
              value={data.process_status.absent}
              accent="bg-rose-500/10 text-rose-700 dark:text-rose-300"
              icon={<Users className="w-5 h-5" />}
            />
            <Card
              title="Wellness pendente"
              value={data.process_status.wellness_pending}
              accent="bg-amber-500/10 text-amber-700 dark:text-amber-300"
              icon={<ClipboardList className="w-5 h-5" />}
            />
            <Card
              title="Fora do processo"
              value={data.process_status.inactive_engagement}
              accent="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
              icon={<ShieldAlert className="w-5 h-5" />}
            />
            <Card
              title="Alertas de carga"
              value={data.load_summary.out_of_zone_athletes}
              accent="bg-orange-500/10 text-orange-700 dark:text-orange-300"
              icon={<ActivitySquare className="w-5 h-5" />}
            />
          </section>

          {/* Carga */}
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Carga da sessão</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Média da sessão vs baseline recente · atletas fora da zona
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <Stat label="Média sessão" value={`${data.load_summary.session_load_avg} AU`} />
              <Stat label="Baseline 7d" value={`${data.load_summary.team_baseline_avg} AU`} />
              <Stat label="Desvio" value={`${data.load_summary.deviation_pct.toFixed(1)}%`} />
              <Stat label="Fora da zona" value={data.load_summary.out_of_zone_athletes} />
            </div>
          </section>

          {/* Lista operacional */}
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Lista operacional</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Uma linha por atleta · ordenado por problema
                </p>
              </div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {orderedAthletes.map((athlete) => (
                <div key={athlete.athlete_id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex items-center gap-3">
                    <StatusPill status={athlete.overall_status} />
                    <div>
                      <div className="font-medium">{athlete.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Presença: {athlete.presence} · Wellness: {athlete.wellness} · Carga: {athlete.load_status}
                      </div>
                    </div>
                  </div>
                  <button className="text-brand-500 hover:text-brand-600 text-sm">
                    Ver perfil
                  </button>
                </div>
              ))}
              {orderedAthletes.length === 0 && (
                <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                  Nenhum atleta para esta sessão
                </div>
              )}
            </div>
          </section>

          {/* Alertas persistentes */}
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold">Alertas persistentes</h3>
            </div>
            <div className="space-y-2">
              {data.alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-md border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-900/20 px-3 py-2"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-300 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium capitalize">
                      {alert.level} · {alert.type}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-200">{alert.message}</div>
                  </div>
                </div>
              ))}
              {data.alerts.length === 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Nenhum alerta crítico no momento.
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Selecionar sessão</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Escolha treino ou jogo para carregar o controle operacional.
                </p>
              </div>
            </div>
            <div className="space-y-3 max-h-72 overflow-auto">
              {sessionOptions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    setSelectedSession(session);
                    setShowModal(false);
                  }}
                  className="w-full text-left border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-500/10 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">
                      {session.type === 'training' ? 'Treino' : 'Jogo'} · {session.team}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{session.date}</div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {session.status}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => {
                  // Modal é hard gate: não fechar sem seleção
                }}
              >
                Modal bloqueante (selecione uma sessão)
              </button>
            </div>
          </div>
        </div>
      )}

      {hasSelection && loading && (
        <div className="absolute inset-0 bg-white/70 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-300">Carregando sessão...</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({
  title,
  value,
  accent,
  icon,
}: {
  title: string;
  value: number;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
        <div className="text-2xl font-semibold">{value}</div>
      </div>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${accent}`}>{icon}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: AthleteRow['overall_status'] }) {
  const map: Record<AthleteRow['overall_status'], { label: string; className: string }> = {
    critical: { label: 'Crítico', className: 'bg-rose-500/15 text-rose-700 dark:text-rose-200' },
    attention: { label: 'Atenção', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-200' },
    ok: { label: 'OK', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200' },
  };
  const cfg = map[status];
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full inline-flex ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
