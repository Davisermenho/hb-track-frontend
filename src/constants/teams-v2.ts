
import { Team, Member, Training } from '@/types/teams-v2';

export const MOCK_TEAMS: Team[] = [
  {
    id: '1',
    name: 'Cadete Masculino A',
    code: 'HB-2024-CM',
    role: 'Treinador Principal',
    lastActivity: 'Análise de Vídeo - Jogo 04',
    activityTime: 'Hoje, 14:30',
    status: 'active',
    initial: 'C',
    category: 'Sub-17',
    gender: 'Masculino',
    club: 'Clube HB Track',
    season: '2024/2025'
  },
  {
    id: '2',
    name: 'Juvenil Feminino',
    code: 'HB-2024-JF',
    role: 'Assistente Técnico',
    lastActivity: 'Treino Físico #12',
    activityTime: 'Ontem, 09:00',
    status: 'active',
    initial: 'J'
  },
  {
    id: '3',
    name: 'Projeto Social HB',
    code: 'SOC-8821',
    role: 'Admin (Proprietário)',
    lastActivity: 'Atualização de Elenco',
    activityTime: '2 dias atrás',
    status: 'active',
    initial: 'P'
  },
  {
    id: '4',
    name: 'Senior B (Arquivo)',
    code: 'ARC-1102',
    role: 'Observador',
    lastActivity: 'Temporada 2023 Encerrada',
    activityTime: '12 Nov 2023',
    status: 'archived',
    initial: 'S'
  }
];

export const MOCK_MEMBERS: Member[] = [
  { id: 'm1', name: 'Victor Silva', email: 'victor@hbtrack.com', role: 'ADMIN', status: 'Ativo', initials: 'VS' },
  { id: 'm2', name: '', email: 'treinador.adjunto@email.com', role: 'MEMBRO', status: 'Pendente', initials: '' }
];

export const MOCK_ATHLETES = [
  { id: 'a1', name: 'Lucas Ferreira', number: '#23', category: 'Sub-17', offensivePosition: 'Armador Central', defensivePosition: 'Base', status: 'Ativo', initials: 'LF', attendance: 95, gamesPlayed: 12 },
  { id: 'a2', name: 'Gabriel Santos', number: '#15', category: 'Sub-17', offensivePosition: 'Ponta Esq.', defensivePosition: 'Avançado', status: 'Lesionado', initials: 'GS', attendance: 68, gamesPlayed: 8 },
  { id: 'a3', name: 'Matheus Oliveira', number: '#02', category: 'Sub-16', offensivePosition: 'Pivô', defensivePosition: 'Bloco Central', status: 'Ativo', initials: 'MO', attendance: 88, gamesPlayed: 10 }
];

export const MOCK_TRAININGS: Training[] = [
  { id: 't1', name: 'Treino Tático - Defesa 5:1', date: '24 Out, 2023', time: '18:30 - 20:00', type: 'Tático', status: 'Agendado' },
  { id: 't2', name: 'Preparação Física - Potência', date: '22 Out, 2023', time: '19:00 - 20:30', type: 'Físico', status: 'Concluído' },
  { id: 't3', name: 'Técnico - Finalização de Pontas', date: '20 Out, 2023', time: '18:00 - 19:30', type: 'Técnico', status: 'Concluído' },
  { id: 't4', name: 'Coletivo vs Equipe B', date: '18 Out, 2023', time: '20:00 - 21:30', type: 'Jogo-Treino', status: 'Cancelado' }
];
