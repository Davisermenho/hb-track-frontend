"use client";

import React from "react";
import Link from "next/link";
import { Users, AlertTriangle, ShieldAlert, UserPlus } from "lucide-react";

interface AthleteStats {
  total: number;
  ativas: number;
  lesionadas: number;
  dispensadas: number;
  dm: number;
  em_captacao: number;
  suspensas: number;
  arquivadas: number;
  com_restricao_medica: number;
  carga_restrita: number;
  por_categoria: Record<string, number>;
}

interface AthleteKPIsProps {
  stats: AthleteStats | null;
}

interface KPICardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "green" | "orange" | "red";
  link?: string;
}

const colorClasses = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    icon: "text-blue-600 dark:text-blue-400",
    value: "text-blue-700 dark:text-blue-300",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-900/20",
    icon: "text-green-600 dark:text-green-400",
    value: "text-green-700 dark:text-green-300",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    icon: "text-orange-600 dark:text-orange-400",
    value: "text-orange-700 dark:text-orange-300",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-900/20",
    icon: "text-red-600 dark:text-red-400",
    value: "text-red-700 dark:text-red-300",
  },
};

function KPICard({ title, value, icon, color, link }: KPICardProps) {
  const colors = colorClasses[color];
  
  const content = (
    <div className={`${colors.bg} rounded-lg p-4 transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className={`text-2xl font-bold ${colors.value}`}>{value}</p>
        </div>
        <div className={`${colors.icon}`}>{icon}</div>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link href={link} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export default function AthleteKPIs({ stats }: AthleteKPIsProps) {
  if (!stats) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
          Visão Geral das Atletas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 animate-pulse"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
        Visão Geral das Atletas
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Total de Atletas"
          value={stats.total}
          icon={<Users size={28} />}
          color="blue"
          link="/admin/athletes"
        />
        <KPICard
          title="Em Captação"
          value={stats.em_captacao}
          icon={<UserPlus size={28} />}
          color="green"
          link="/admin/athletes?filter=captacao"
        />
        <KPICard
          title="Lesionadas"
          value={stats.lesionadas}
          icon={<AlertTriangle size={28} />}
          color="orange"
          link="/admin/athletes?filter=lesionadas"
        />
        <KPICard
          title="Suspensas"
          value={stats.suspensas}
          icon={<ShieldAlert size={28} />}
          color="red"
          link="/admin/athletes?filter=suspensas"
        />
      </div>
      
      {/* Secondary Stats Row */}
      {(stats.com_restricao_medica > 0 || stats.carga_restrita > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {stats.com_restricao_medica > 0 && (
            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs rounded-full">
              {stats.com_restricao_medica} com restrição médica
            </span>
          )}
          {stats.carga_restrita > 0 && (
            <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-xs rounded-full">
              {stats.carga_restrita} com carga restrita
            </span>
          )}
        </div>
      )}
    </div>
  );
}
