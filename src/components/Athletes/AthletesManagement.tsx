"use client";

import React, { useState, useMemo } from "react";
import AthletesFilter from "@/components/Athletes/AthletesFilter";
import AthletesList from "@/components/Athletes/AthletesList";
import AthleteViewModal from "@/components/Athletes/AthleteViewModal";
import AthleteEditModal from "@/components/Athletes/AthleteEditModal";
import AthleteCreateModal from "@/components/Athletes/AthleteCreateModal";
import { Athlete, AthletesFilters } from "../../types/athletes";

// Dados mock para demonstração
const MOCK_TEAMS = [
  { id: "1", name: "Time A" },
  { id: "2", name: "Time B" },
  { id: "3", name: "Time C" },
];

const MOCK_ATHLETES: Athlete[] = [
  {
    id: "1",
    name: "Maria Silva",
    birth_date: "1998-03-15",
    phone: "(11) 99999-1234",
    email: "maria.silva@email.com",
    jersey_number: "7",
    category: "senior",
    sport_status: "ativa",
    operational_status: "disponível",
    team_id: "1",
    team_name: "Time A",
    has_history: true,
    positions: {
      offensive_primary: "Armadora Central",
      offensive_secondary: "Lateral Esquerda",
      defensive_primary: "1ª Defensora",
      defensive_secondary: "2ª Defensora",
    },
  },
  {
    id: "2",
    name: "Ana Costa",
    birth_date: "2000-07-22",
    phone: "(11) 98888-5678",
    jersey_number: "10",
    category: "juvenil",
    sport_status: "ativa",
    operational_status: "disponível",
    team_id: "1",
    team_name: "Time A",
    has_history: true,
    positions: {
      offensive_primary: "Pivô",
      defensive_primary: "Defensora Base",
    },
  },
  {
    id: "3",
    name: "Carla Mendes",
    birth_date: "1995-11-10",
    phone: "(21) 97777-9012",
    email: "carla.mendes@email.com",
    jersey_number: "15",
    category: "senior",
    sport_status: "dispensada",
    operational_status: "em_caso_médico",
    team_id: "2",
    team_name: "Time B",
    has_history: true,
    positions: {
      offensive_primary: "Ponta Direita",
      defensive_primary: "Goleira",
    },
  },
  {
    id: "4",
    name: "Fernanda Oliveira",
    birth_date: "2005-02-28",
    phone: "(31) 96666-3456",
    jersey_number: "3",
    category: "cadete",
    sport_status: "ativa",
    operational_status: "retorno",
    team_id: "2",
    team_name: "Time B",
    has_history: false,
    positions: {
      offensive_primary: "Lateral Direita",
      offensive_secondary: "Ponta Esquerda",
      defensive_primary: "2ª Defensora",
    },
  },
  {
    id: "5",
    name: "Beatriz Rocha",
    birth_date: "2008-09-05",
    phone: "(41) 95555-7890",
    jersey_number: "9",
    category: "infantil",
    sport_status: "ativa",
    operational_status: "disponível",
    team_id: "3",
    team_name: "Time C",
    has_history: false,
    positions: {
      offensive_primary: "Ponta Esquerda",
      defensive_primary: "Defensora Avançada",
    },
  },
  {
    id: "6",
    name: "Juliana Ferreira",
    birth_date: "1999-05-18",
    jersey_number: "21",
    category: "senior",
    sport_status: "arquivada",
    operational_status: "restrita",
    team_id: "3",
    team_name: "Time C",
    has_history: true,
    positions: {
      offensive_primary: "Armadora Central",
      defensive_primary: "1ª Defensora",
    },
  },
];

export default function AthletesManagement() {
  const [athletes, setAthletes] = useState<Athlete[]>(MOCK_ATHLETES);
  const [filters, setFilters] = useState<AthletesFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isLoading] = useState(false);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);

  // Aplicar filtros e busca
  const filteredAthletes = useMemo(() => {
    return athletes.filter((athlete) => {
      // Não mostrar atletas arquivadas por padrão
      if (athlete.sport_status === "arquivada" && 
          (!filters.sport_status || !filters.sport_status.includes("arquivada"))) {
        return false;
      }

      // Filtro por busca de nome
      if (searchTerm && !athlete.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filtro por equipe
      if (
        filters.team_ids &&
        filters.team_ids.length > 0 &&
        !filters.team_ids.includes(athlete.team_id)
      ) {
        return false;
      }

      // Filtro por categoria
      if (
        filters.categories &&
        filters.categories.length > 0 &&
        !filters.categories.includes(athlete.category)
      ) {
        return false;
      }

      // Filtro por status esportivo
      if (
        filters.sport_status &&
        filters.sport_status.length > 0 &&
        !filters.sport_status.includes(athlete.sport_status)
      ) {
        return false;
      }

      return true;
    });
  }, [athletes, filters, searchTerm]);

  const handleSearch = () => {
    setSearchTerm(searchInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleViewDetails = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setViewModalOpen(true);
  };

  const handleEdit = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setEditModalOpen(true);
  };

  const handleArchive = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setArchiveModalOpen(true);
  };

  const handleDelete = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setDeleteModalOpen(true);
  };

  const confirmArchive = () => {
    if (selectedAthlete) {
      setAthletes(prev =>
        prev.map(a =>
          a.id === selectedAthlete.id
            ? { ...a, sport_status: "arquivada" as const }
            : a
        )
      );
      setArchiveModalOpen(false);
      setSelectedAthlete(null);
    }
  };

  const confirmDelete = () => {
    if (selectedAthlete && !selectedAthlete.has_history) {
      setAthletes(prev => prev.filter(a => a.id !== selectedAthlete.id));
      setDeleteModalOpen(false);
      setSelectedAthlete(null);
    }
  };

  const handleSaveEdit = (updatedAthlete: Athlete) => {
    setAthletes(prev =>
      prev.map(a => (a.id === updatedAthlete.id ? updatedAthlete : a))
    );
    setEditModalOpen(false);
    setSelectedAthlete(null);
  };

  const handleCreateAthlete = (newAthleteData: Omit<Athlete, "id" | "has_history" | "created_at" | "updated_at">) => {
    const newAthlete: Athlete = {
      ...newAthleteData,
      id: String(Date.now()),
      has_history: false,
    };
    setAthletes(prev => [...prev, newAthlete]);
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <AthletesFilter
        teams={MOCK_TEAMS}
        filters={filters}
        onFilterChange={setFilters}
      />

      {/* Bloco de Lista de Atletas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Cabeçalho com busca e botão de adicionar */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          {/* Campo de busca */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <input
              type="text"
              placeholder="Buscar atleta por nome..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Buscar
            </button>
          </div>

          {/* Botão de adicionar atleta */}
          <div className="ml-auto">
            <a
              href="/admin/cadastro"
              className="flex items-center justify-center w-8 h-8 text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors"
              title="Cadastrar nova pessoa"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </a>
          </div>
        </div>

        {/* Lista de Atletas */}
        <AthletesList
          athletes={filteredAthletes}
          isLoading={isLoading}
          onViewDetails={handleViewDetails}
          onEdit={handleEdit}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onAddAthlete={() => setCreateModalOpen(true)}
          onClearSearch={() => setSearchInput("")}
          onClearFilters={() => setFilters({})}
          searchTerm={searchTerm}
          hasFilters={Object.keys(filters).some(k => {
            const val = filters[k as keyof AthletesFilters];
            return Array.isArray(val) ? val.length > 0 : !!val;
          })}
        />
      </div>

      {/* Modal de Visualização */}
      <AthleteViewModal
        athlete={selectedAthlete}
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedAthlete(null);
        }}
      />

      {/* Modal de Edição */}
      <AthleteEditModal
        athlete={selectedAthlete}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedAthlete(null);
        }}
        onSave={handleSaveEdit}
      />

      {/* Modal de Criação */}
      <AthleteCreateModal
        teams={MOCK_TEAMS}
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleCreateAthlete}
      />

      {/* Modal de Confirmação de Arquivamento */}
      {archiveModalOpen && selectedAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setArchiveModalOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Arquivar Atleta
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Tem certeza que deseja arquivar <strong>{selectedAthlete.name}</strong>?
              A atleta será marcada como fora de operação e não aparecerá mais nas listas padrão.
              Todos os dados históricos serão preservados.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setArchiveModalOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmArchive}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
              >
                Arquivar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Deleção */}
      {deleteModalOpen && selectedAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteModalOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Deletar Atleta
            </h3>
            {selectedAthlete.has_history ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <strong className="text-red-600 dark:text-red-400">Não é possível deletar esta atleta.</strong>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  <strong>{selectedAthlete.name}</strong> possui registros históricos (treinos, presenças, 
                  wellness ou casos médicos). Atletas com histórico só podem ser arquivadas para preservar 
                  a integridade dos dados.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteModalOpen(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Entendi
                  </button>
                  <button
                    onClick={() => {
                      setDeleteModalOpen(false);
                      handleArchive(selectedAthlete);
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
                  >
                    Arquivar em vez disso
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Tem certeza que deseja deletar <strong>{selectedAthlete.name}</strong> permanentemente?
                  Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteModalOpen(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                  >
                    Deletar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
