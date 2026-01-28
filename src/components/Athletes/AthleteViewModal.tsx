"use client";

import React from "react";
import { Athlete } from "../../types/athletes";
import { CloseIcon } from "@/icons";

interface AthleteViewModalProps {
  athlete: Athlete | null;
  isOpen: boolean;
  onClose: () => void;
}

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

const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
};

export default function AthleteViewModal({
  athlete,
  isOpen,
  onClose,
}: AthleteViewModalProps) {
  if (!isOpen || !athlete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Ficha da Atleta
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Dados Pessoais */}
          <section className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
              Dados Pessoais
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Nome Completo</p>
                <p className="text-sm text-gray-900 dark:text-white">{athlete.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Data de Nascimento</p>
                <p className="text-sm text-gray-900 dark:text-white">{formatDate(athlete.birth_date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Telefone</p>
                <p className="text-sm text-gray-900 dark:text-white">{athlete.phone || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-sm text-gray-900 dark:text-white">{athlete.email || "-"}</p>
              </div>
            </div>
          </section>

          {/* Vínculo e Posição */}
          <section className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
              Vínculo e Posição
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Equipe</p>
                <p className="text-sm text-gray-900 dark:text-white">{athlete.team_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Categoria</p>
                <p className="text-sm text-gray-900 dark:text-white">{formatCategory(athlete.category)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Nº da Camisa</p>
                <p className="text-sm text-gray-900 dark:text-white">{athlete.jersey_number || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                <p className="text-sm text-gray-900 dark:text-white">{formatStatus(athlete.sport_status)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Posição Ofensiva</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {athlete.positions.offensive_primary}
                  {athlete.positions.offensive_secondary && ` / ${athlete.positions.offensive_secondary}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Posição Defensiva</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {athlete.positions.defensive_primary}
                  {athlete.positions.defensive_secondary && ` / ${athlete.positions.defensive_secondary}`}
                </p>
              </div>
            </div>
          </section>

          {/* Estatísticas (placeholder) */}
          <section className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
              Estatísticas
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">-</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Presenças</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">-</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Treinos</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">-</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Wellness Médio</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">-</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Casos Médicos</p>
              </div>
            </div>
          </section>

          {/* Wellness Recente (placeholder) */}
          <section className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
              Wellness Recente
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              Nenhum registro de wellness disponível
            </p>
          </section>

          {/* Casos Médicos (placeholder) */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
              Casos Médicos
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              Nenhum caso médico registrado
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
