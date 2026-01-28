'use client';

import React, { useState, useEffect } from 'react';
import { Users, Info, Calendar, Loader2 } from 'lucide-react';
import { AthleteFormStepProps } from '../../../types/athlete-form';
import { teamsService } from '@/lib/api';

interface Team {
  id: string;
  name: string;
  category_id?: number;
  category_name?: string;
}

export default function AthleteFormStep7({ data, onChange, errors }: AthleteFormStepProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      try {
        const response = await teamsService.list();
        if (response.items) {
          setTeams(response.items);
        }
      } catch (error) {
        console.error('Erro ao carregar equipes:', error);
        // Fallback vazio - sem equipes disponíveis
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  // Limpar dados de registro quando desmarcar checkbox
  useEffect(() => {
    if (!data.create_team_registration) {
      onChange('team_id', undefined);
      onChange('registration_date', undefined);
    }
  }, [data.create_team_registration, onChange]);

  // Definir data atual como padrão quando marcar checkbox
  useEffect(() => {
    if (data.create_team_registration && !data.registration_date) {
      const today = new Date().toISOString().split('T')[0];
      onChange('registration_date', today);
    }
  }, [data.create_team_registration, data.registration_date, onChange]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
        <Users className="w-5 h-5 text-pink-600" />
        <span>Vínculo com Equipe</span>
      </div>

      {/* Alerta RF1.1 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
            RF1.1: Vínculo com equipe é opcional no cadastro
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            A atleta pode ser cadastrada sem vínculo com equipe. O vínculo pode ser criado posteriormente.
          </p>
        </div>
      </div>

      {/* Checkbox - Criar vínculo */}
      <div 
        className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
        onClick={() => onChange('create_team_registration', !data.create_team_registration)}
      >
        <input
          type="checkbox"
          checked={data.create_team_registration}
          onChange={(e) => onChange('create_team_registration', e.target.checked)}
          className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
        />
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            Vincular a uma equipe agora
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Associar esta atleta a uma equipe da organização
          </p>
        </div>
      </div>

      {/* Formulário de vínculo - Condicional */}
      {data.create_team_registration && (
        <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Dados do Vínculo
          </h4>

          {/* Equipe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                Equipe *
              </span>
            </label>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Carregando equipes...</span>
              </div>
            ) : teams.length > 0 ? (
              <select
                value={data.team_id || ''}
                onChange={(e) => onChange('team_id', e.target.value ? Number(e.target.value) : undefined)}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                  errors.team_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Selecione uma equipe</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} {team.category_name ? `(${team.category_name})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-700 dark:text-yellow-400">
                Nenhuma equipe encontrada. Cadastre uma equipe primeiro ou prossiga sem vínculo.
              </div>
            )}
            {errors.team_id && (
              <p className="text-sm text-red-500 mt-1">{errors.team_id}</p>
            )}
          </div>

          {/* Data de Registro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Data do Registro *
              </span>
            </label>
            <input
              type="date"
              value={data.registration_date || ''}
              onChange={(e) => onChange('registration_date', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                errors.registration_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.registration_date && (
              <p className="text-sm text-red-500 mt-1">{errors.registration_date}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Data em que a atleta foi vinculada à equipe
            </p>
          </div>
        </div>
      )}

      {/* Resumo final */}
      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">
          ✓ Resumo do Cadastro
        </h4>
        <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
          <li>• Atleta: <strong>{data.first_name} {data.last_name}</strong></li>
          {data.birth_date && (
            <li>• Nascimento: {new Date(data.birth_date).toLocaleDateString('pt-BR')}</li>
          )}
          <li>• Acesso ao sistema: <strong>{data.create_user ? 'Sim' : 'Não'}</strong></li>
          <li>• Vínculo com equipe: <strong>{data.create_team_registration ? 'Sim' : 'Não'}</strong></li>
        </ul>
      </div>
    </div>
  );
}
