"use client";

import React from "react";
import { Athlete } from "../../types/athletes";
import { EyeIcon, PencilIcon, BoxIcon, TrashBinIcon } from "@/icons";
import { AthleteTableSkeleton } from "@/components/common/Skeletons";
import { AthleteEmptyState, SearchEmptyState, FilterEmptyState } from "@/components/common/EmptyStates";

interface AthletesListProps {
  athletes: Athlete[];
  isLoading: boolean;
  onViewDetails: (athlete: Athlete) => void;
  onEdit: (athlete: Athlete) => void;
  onArchive: (athlete: Athlete) => void;
  onDelete: (athlete: Athlete) => void;
  onAddAthlete?: () => void;
  onClearSearch?: () => void;
  onClearFilters?: () => void;
  searchTerm?: string;
  hasFilters?: boolean;
}

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "ativa":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "lesionada":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "afastada":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "arquivada":
      return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
  }
};

const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR");
};

const formatCategory = (category: string) => {
  const categories: Record<string, string> = {
    infantil: "Infantil",
    cadete: "Cadete",
    juvenil: "Juvenil",
    senior: "Sênior",
  };
  return categories[category] || category;
};

export default function AthletesList({
  athletes,
  isLoading,
  onViewDetails,
  onEdit,
  onArchive,
  onDelete,
  onAddAthlete,
  onClearSearch,
  onClearFilters,
  searchTerm,
  hasFilters,
}: AthletesListProps) {
  // FASE 6.2: Loading state com Skeleton
  if (isLoading) {
    return <AthleteTableSkeleton rows={5} />;
  }

  // FASE 6.2: Empty states contextuais
  if (athletes.length === 0) {
    // Se tem busca ativa, mostra estado de "busca sem resultados"
    if (searchTerm && searchTerm.trim().length > 0) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 py-8">
          <SearchEmptyState searchTerm={searchTerm} onAction={onClearSearch} />
        </div>
      );
    }
    
    // Se tem filtros ativos, mostra estado de "filtros sem resultados"
    if (hasFilters) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 py-8">
          <FilterEmptyState onAction={onClearFilters} />
        </div>
      );
    }
    
    // Nenhum atleta cadastrado
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 py-8">
        <AthleteEmptyState onAction={onAddAthlete} />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Nome Completo
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Data de Nascimento
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Categoria
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Nº Camisa
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Telefone
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="py-3 px-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {athletes.map((athlete) => (
            <tr
              key={athlete.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                {athlete.name}
              </td>
              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                {formatDate(athlete.birth_date)}
              </td>
              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                {formatCategory(athlete.category)}
              </td>
              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                {athlete.jersey_number || "-"}
              </td>
              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                {athlete.phone || "-"}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(
                    athlete.sport_status
                  )}`}
                >
                  {formatStatus(athlete.sport_status)}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onViewDetails(athlete)}
                    title="Visualizar ficha"
                    className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(athlete)}
                    title="Editar dados"
                    className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onArchive(athlete)}
                    title="Arquivar atleta"
                    className="p-1.5 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <BoxIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(athlete)}
                    title="Deletar atleta"
                    className={`p-1.5 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      athlete.has_history
                        ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                        : "text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    }`}
                    disabled={athlete.has_history}
                  >
                    <TrashBinIcon className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
