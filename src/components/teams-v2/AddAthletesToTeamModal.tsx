'use client';

import React, { useState, useEffect } from 'react';
import { Cross2Icon, MagnifyingGlassIcon, ReloadIcon } from '@radix-ui/react-icons';
import { teamsService } from '@/lib/api/teams';

// Mapeamento de categorias de handebol
const CATEGORY_NAMES: Record<number, string> = {
  1: 'Mirim',
  2: 'Infantil',
  3: 'Cadete',
  4: 'Juvenil',
  5: 'Júnior',
  6: 'Adulto',
  7: 'Master',
};

interface Athlete {
  id: string;
  name: string;
  number?: number;
  position?: string;
  photo_url?: string;
}

interface AddAthletesToTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamId: string;
  teamGender: string;      // Obrigatório
  teamCategoryId: number;  // Obrigatório
}

const AddAthletesToTeamModal: React.FC<AddAthletesToTeamModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  teamId,
  teamGender = 'masculino',
  teamCategoryId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('');
  const [defensivePositionFilter, setDefensivePositionFilter] = useState<string>('');
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthletes, setSelectedAthletes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Buscar atletas disponíveis ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      // Resetar filtros ao abrir
      setSearchQuery('');
      setPositionFilter('');
      setDefensivePositionFilter('');
      setSelectedAthletes(new Set());
    }
  }, [isOpen]);

  // Listener para ESC e Enter
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'Enter' && !isSubmitting && selectedAthletes.size > 0) {
        e.preventDefault();
        handleAddAthletes();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, selectedAthletes.size]);

  const fetchAvailableAthletes = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('🔍 [AddAthletesModal] Filtrando atletas:', {
        teamId,
        teamGender,
        teamCategoryId: teamCategoryId || 'NÃO INFORMADA',
        teamCategoryName: teamCategoryId ? CATEGORY_NAMES[teamCategoryId] : 'N/A',
        searchQuery
      });

      if (!teamCategoryId) {
        console.error('❌ [AddAthletesModal] ERRO GRAVE: teamCategoryId não foi passado ao modal!');
        console.error('   Isso vai prejudicar filtros, relatórios e estatísticas.');
      }
      
      // Buscar atletas disponíveis usando o teamsService com filtros
      const response = await teamsService.getAvailableAthletes({
        page: 1,
        limit: 100,
        search: searchQuery || undefined,
        gender: teamGender || undefined,
        excludeTeamId: teamId,
        teamCategoryId: teamCategoryId, // Filtro automático no backend
      });
      
      console.log('✅ [AddAthletesModal] Atletas retornados:', response.items?.length || 0);

      setAthletes(response.items || []);
    } catch (err) {
      console.error('Erro ao buscar atletas:', err);
      setError('Não foi possível carregar a lista de atletas');
    } finally {
      setIsLoading(false);
    }
  };

  // Recarregar quando filtros mudarem
  useEffect(() => {
    if (isOpen) {
      fetchAvailableAthletes();
    }
  }, [isOpen, searchQuery, positionFilter, defensivePositionFilter]);

  const toggleAthleteSelection = (athleteId: string) => {
    const newSelection = new Set(selectedAthletes);
    if (newSelection.has(athleteId)) {
      newSelection.delete(athleteId);
    } else {
      newSelection.add(athleteId);
    }
    setSelectedAthletes(newSelection);
  };

  const handleAddAthletes = async () => {
    if (selectedAthletes.size === 0) return;

    try {
      setIsSubmitting(true);
      setError('');

      // Adicionar cada atleta selecionado à equipe usando teamsService
      const promises = Array.from(selectedAthletes).map(personId =>
        teamsService.addAthleteToTeam(teamId, personId)
      );

      await Promise.all(promises);

      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Erro ao adicionar atletas:', err);
      setError('Erro ao adicionar atletas. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setPositionFilter('');
    setDefensivePositionFilter('');
    setSelectedAthletes(new Set());
    setError('');
    onClose();
  };

  const filteredAthletes = athletes; // Filtragem já feita no backend
  const selectedCountLabel = selectedAthletes.size > 0 ? ` (${selectedAthletes.size})` : '';

  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      // Primeira letra do primeiro nome + primeira letra do último nome
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    // Se só tem um nome, usa as duas primeiras letras
    return name.substring(0, 2).toUpperCase();
  };

  const getAthleteName = (athlete: any) => {
    return athlete.full_name || athlete.name || 'Sem nome';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-[#111] rounded-lg shadow-2xl w-full max-w-xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111]">
          <h2 className="text-[18px] font-heading font-bold text-slate-900 dark:text-white tracking-tight">
            Adicione Atletas na sua Equipe
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-sm p-0.5"
            disabled={isSubmitting}
          >
            <Cross2Icon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Elenco Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-[14px] font-bold text-slate-900 dark:text-white mb-2">
                Elenco
              </label>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
                Selecione os atletas disponíveis
              </p>

              {/* Informações da Equipe (readonly) */}
              <div className="grid grid-cols-2 gap-5 mb-3">
                {/* Gênero da Equipe */}
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                    Gênero da Equipe
                  </label>
                  <input
                    type="text"
                    value={teamGender === 'masculino' ? 'Masculino' : 'Feminino'}
                    disabled
                    className="block w-full rounded-sm border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-[13px] text-slate-500 cursor-not-allowed"
                  />
                </div>

                {/* Categoria da Equipe */}
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                    Categoria da Equipe
                  </label>
                  <input
                    type="text"
                    value={teamCategoryId ? CATEGORY_NAMES[teamCategoryId] || `Categoria ${teamCategoryId}` : 'Não informada'}
                    disabled
                    className="block w-full rounded-sm border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-[13px] text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Filtros de Posição */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Posição Ofensiva
                  </label>
                  <select
                    value={positionFilter}
                    onChange={(e) => setPositionFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Todas</option>
                    <option value="armador">Armador</option>
                    <option value="ponta_esquerda">Ponta Esquerda</option>
                    <option value="ponta_direita">Ponta Direita</option>
                    <option value="pivo">Pivô</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Posição Defensiva
                  </label>
                  <select
                    value={defensivePositionFilter}
                    onChange={(e) => setDefensivePositionFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Todas</option>
                    <option value="goleiro">Goleiro</option>
                    <option value="fixo">Fixo</option>
                    <option value="lateral">Lateral</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end mb-3">
                {selectedAthletes.size > 0 && (
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-sm border border-slate-200 dark:border-slate-700 font-bold">
                    {selectedAthletes.size} Selecionado{selectedAthletes.size > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Search */}
              <div className="relative mb-3 group">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar atleta por nome ou ID..."
                  className="block w-full rounded-sm border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] pl-9 py-2 text-[13px] text-slate-900 dark:text-white placeholder-slate-400 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-0 focus:bg-white transition-all"
                />
              </div>

              {/* Athletes List with Loading Inside */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden flex flex-col h-[280px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 space-y-4">
                    <div className="relative w-16 h-16 animate-pulse">
                      <img 
                        src="/images/logo/logo-icon.svg" 
                        alt="HB Track" 
                        className="w-full h-full object-contain dark:hidden"
                      />
                      <img 
                        src="/images/logo/logo-icon-dark.svg" 
                        alt="HB Track" 
                        className="w-full h-full object-contain hidden dark:block"
                      />
                    </div>
                    <div className="w-48 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-slate-900 dark:bg-slate-100 rounded-full"
                        style={{ 
                          animation: 'loading-bar 2.5s ease-in-out infinite'
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Carregando atletas...</p>
                    <style jsx>{`
                      @keyframes loading-bar {
                        0% {
                          width: 0%;
                          margin-left: 0%;
                        }
                        50% {
                          width: 70%;
                          margin-left: 15%;
                        }
                        100% {
                          width: 0%;
                          margin-left: 100%;
                        }
                      }
                    `}</style>
                  </div>
                ) : error ? (
                  <div className="text-center py-12 bg-white dark:bg-slate-900">
                    <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>
                    <button
                      onClick={fetchAvailableAthletes}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Tentar novamente
                    </button>
                  </div>
                ) : filteredAthletes.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-slate-900">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Nenhum atleta disponível
                    </p>
                  </div>
                ) : (
                  <div className="overflow-y-auto custom-scrollbar bg-white dark:bg-[#0f0f0f] divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAthletes.map((athlete) => {
                      const isSelected = selectedAthletes.has(athlete.id);
                      return (
                        <div
                          key={athlete.id}
                          onClick={() => toggleAthleteSelection(athlete.id)}
                          className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/30'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                          }`}
                        >
                        {/* Avatar */}
                        {athlete.photo_url ? (
                          <img
                            src={athlete.photo_url}
                            alt={athlete.name}
                            className="h-8 w-8 rounded-full bg-slate-200 object-cover border border-slate-100 dark:border-slate-700"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-slate-900 dark:bg-slate-100 flex items-center justify-center text-white dark:text-black font-bold text-[10px] border border-slate-100 dark:border-slate-700">
                            {getInitials(getAthleteName(athlete))}
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 leading-none">
                            {getAthleteName(athlete)}
                          </p>
                          <p className="text-[11px] font-mono text-slate-400 mt-1">
                            ID: {athlete.number || athlete.id.substring(0, 8)}
                          </p>
                        </div>

                        {/* Ação: + em círculo */}
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center transition-all border ${
                            isSelected
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-slate-400 dark:hover:border-slate-500'
                          }`}
                        >
                          {isSelected ? (
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-[#151515] border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-[13px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleAddAthletes}
            disabled={isSubmitting || selectedAthletes.size === 0}
            className="px-5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-black text-[13px] font-bold rounded-sm shadow-sm hover:bg-slate-800 dark:hover:bg-white transition-colors border border-transparent disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <ReloadIcon className="w-3 h-3 animate-spin" />
                Adicionando...
              </>
            ) : (
              `Adicionar${selectedCountLabel}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddAthletesToTeamModal;
