"use client";

import React, { useState, useEffect } from "react";
import { athletesService, type AthleteCreate } from "@/lib/api/athletes";
import { teamsService } from "@/lib/api/teams";
import { categoriesService, type Category } from "@/lib/api/categories";
import {
  defensivePositionsService,
  offensivePositionsService,
  schoolingLevelsService,
  type DefensivePosition,
  type OffensivePosition,
  type SchoolingLevel,
} from "@/lib/api/positions";

// Componentes FASE 3
import { CEPField, CPFField, RGField, TeamSelector, type Team as TeamSelectorTeam, type Category as TeamSelectorCategory } from "@/components/form";

interface AthleteFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AthleteFormNew({ onSuccess, onCancel }: AthleteFormProps) {
  // Estados para options dos dropdowns
  const [teams, setTeams] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [defensivePositions, setDefensivePositions] = useState<DefensivePosition[]>([]);
  const [offensivePositions, setOffensivePositions] = useState<OffensivePosition[]>([]);
  const [schoolingLevels, setSchoolingLevels] = useState<SchoolingLevel[]>([]);

  // Estado do formulário
  // gender: 'masculino' | 'feminino' - handebol não tem categoria mista
  const [formData, setFormData] = useState<AthleteCreate & { gender: 'masculino' | 'feminino' }>({
    athlete_name: "",
    birth_date: "",
    gender: "feminino", // default feminino (mais comum no handebol brasileiro)
    main_defensive_position_id: 0,
    athlete_rg: "",
    athlete_cpf: "",
    athlete_phone: "",
    team_id: "",
    athlete_nickname: "",
    shirt_number: undefined,
    secondary_defensive_position_id: undefined,
    main_offensive_position_id: undefined,
    secondary_offensive_position_id: undefined,
    athlete_email: "",
    guardian_name: "",
    guardian_phone: "",
    schooling_id: undefined,
    zip_code: "",
    street: "",
    neighborhood: "",
    city: "",
    address_state: "",
    address_number: "",
    address_complement: "",
  });

  // Estados de controle
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Carregar dados iniciais
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoadingData(true);
        const [teamsData, categoriesData, defPositions, offPositions, schooling] =
          await Promise.all([
            teamsService.list({ limit: 100 }),
            categoriesService.list(),
            defensivePositionsService.list(),
            offensivePositionsService.list(),
            schoolingLevelsService.list(),
          ]);

        setTeams(teamsData.items);
        setCategories(categoriesData);
        setDefensivePositions(defPositions);
        setOffensivePositions(offPositions);
        setSchoolingLevels(schooling);

        // Setar equipe padrão
        if (teamsData.items.length > 0) {
          setFormData((prev) => ({ ...prev, team_id: teamsData.items[0].id }));
        }
      } catch (err: any) {
        console.error("Erro ao carregar dados:", err);
        setError(err?.detail || "Erro ao carregar dados do formulário");
      } finally {
        setIsLoadingData(false);
      }
    }
    loadData();
  }, []);

  // Verifica se selecionou goleira (id=5 conforme migration)
  const isGoalkeeper = formData.main_defensive_position_id === 5;

  // Handler para mudanças nos inputs
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? value === ""
            ? undefined
            : parseInt(value, 10)
          : value,
    }));
  };

  // Validação antes de submeter
  const validateForm = (): boolean => {
    // Campos obrigatórios
    if (!formData.athlete_name || formData.athlete_name.length < 3) {
      setError("Nome da atleta é obrigatório (mínimo 3 caracteres)");
      return false;
    }

    if (!formData.birth_date) {
      setError("Data de nascimento é obrigatória");
      return false;
    }

    // Gênero obrigatório (apenas masculino/feminino)
    if (!formData.gender || !['masculino', 'feminino'].includes(formData.gender)) {
      setError("Gênero é obrigatório (masculino ou feminino)");
      return false;
    }

    if (!formData.main_defensive_position_id) {
      setError("Posição defensiva principal é obrigatória");
      return false;
    }

    // Posição ofensiva obrigatória exceto para goleiras
    if (!isGoalkeeper && !formData.main_offensive_position_id) {
      setError("Posição ofensiva principal é obrigatória (exceto para goleiras)");
      return false;
    }

    // RG obrigatório (Seção 11 das REGRAS)
    if (!formData.athlete_rg) {
      setError("RG é obrigatório");
      return false;
    }

    // CPF é OPCIONAL conforme Seção 11 das REGRAS
    // (removida validação obrigatória)

    // Email é OBRIGATÓRIO conforme Seção 11 das REGRAS
    if (!formData.athlete_email || !formData.athlete_email.includes('@')) {
      setError("Email é obrigatório e deve ser válido");
      return false;
    }

    if (!formData.athlete_phone) {
      setError("Telefone é obrigatório");
      return false;
    }

    if (!formData.team_id) {
      setError("Equipe é obrigatória");
      return false;
    }

    // Validar shirt_number entre 1-99
    if (formData.shirt_number && (formData.shirt_number < 1 || formData.shirt_number > 99)) {
      setError("Número da camisa deve estar entre 1 e 99");
      return false;
    }

    setError(null);
    return true;
  };

  // Submit do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setError(null);

      await athletesService.create(formData);

      // Sucesso
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Erro ao criar atleta:", err);
      setError(err?.detail || err?.message || "Erro ao criar atleta");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando formulário...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Seção 1: Dados Pessoais */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Dados Pessoais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome Completo */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="athlete_name"
              value={formData.athlete_name}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              placeholder="Nome completo da atleta"
            />
          </div>

          {/* Apelido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Apelido
            </label>
            <input
              type="text"
              name="athlete_nickname"
              value={formData.athlete_nickname ?? ""}
              onChange={handleChange}
              maxLength={50}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              placeholder="Apelido (opcional)"
            />
          </div>

          {/* Data de Nascimento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data de Nascimento <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="birth_date"
              value={formData.birth_date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Categoria será calculada automaticamente pela idade
            </p>
          </div>

          {/* Gênero - OBRIGATÓRIO (handebol não tem categoria mista) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Gênero <span className="text-red-500">*</span>
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            >
              <option value="feminino">Feminino</option>
              <option value="masculino">Masculino</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Define em quais equipes a atleta pode ser vinculada
            </p>
          </div>
        </div>
      </div>

      {/* Seção 2: Documentos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Documentos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* RG - Usando componente FASE 3 - OBRIGATÓRIO */}
          <RGField
            value={formData.athlete_rg ?? ""}
            onChange={(rg) => setFormData((prev) => ({ ...prev, athlete_rg: rg }))}
            required
            label="RG"
          />

          {/* CPF - Usando componente FASE 3 - OPCIONAL conforme REGRAS */}
          <CPFField
            value={formData.athlete_cpf ?? ""}
            onChange={(cpf) => setFormData((prev) => ({ ...prev, athlete_cpf: cpf }))}
            required={false}
            label="CPF (opcional)"
          />

          {/* Email - OBRIGATÓRIO conforme Seção 11 das REGRAS */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="athlete_email"
              value={formData.athlete_email ?? ""}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              placeholder="email@exemplo.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email é obrigatório para comunicação e acesso ao sistema
            </p>
          </div>
        </div>
      </div>

      {/* Seção 3: Endereço */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Endereço
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CEP - Usando componente FASE 3 com ViaCEP */}
          <CEPField
            value={formData.zip_code ?? ""}
            onChange={(cep) => setFormData((prev) => ({ ...prev, zip_code: cep }))}
            onAddressFound={(address) => {
              setFormData((prev) => ({
                ...prev,
                street: address.street || prev.street,
                neighborhood: address.neighborhood || prev.neighborhood,
                city: address.city || prev.city,
                address_state: address.state || prev.address_state,
              }));
            }}
            label="CEP"
          />

          {/* Rua */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Logradouro
            </label>
            <input
              type="text"
              name="street"
              value={formData.street ?? ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              placeholder="Rua, Avenida, etc."
            />
          </div>

          {/* Número */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Número
            </label>
            <input
              type="text"
              name="address_number"
              value={formData.address_number ?? ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              placeholder="123"
            />
          </div>

          {/* Complemento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Complemento
            </label>
            <input
              type="text"
              name="address_complement"
              value={formData.address_complement ?? ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              placeholder="Apto, Bloco, etc."
            />
          </div>

          {/* Bairro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bairro
            </label>
            <input
              type="text"
              name="neighborhood"
              value={formData.neighborhood ?? ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              placeholder="Bairro"
            />
          </div>

          {/* Cidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cidade
            </label>
            <input
              type="text"
              name="city"
              value={formData.city ?? ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              placeholder="Cidade"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <input
              type="text"
              name="address_state"
              value={formData.address_state ?? ""}
              onChange={handleChange}
              maxLength={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              placeholder="UF"
            />
          </div>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Salvando..." : "Salvar Atleta"}
        </button>
      </div>
    </form>
  );
}
