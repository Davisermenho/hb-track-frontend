'use client';

/**
 * Página de Relatórios de Atletas
 * 
 * Conforme REGRAS_GERENCIAMENTO_ATLETAS.md Seção 10.2:
 * 7 Relatórios Essenciais:
 * 1. Lista Geral de Atletas
 * 2. Atletas por Categoria/Equipe
 * 3. Atletas por Estado
 * 4. Atletas em Captação
 * 5. Histórico de Vínculos
 * 6. Status Médico
 * 7. Distribuição Estatística
 */

import React, { useState } from 'react';
import { 
  FileText, 
  Users, 
  Activity,
  UserSearch,
  Link2,
  Stethoscope,
  BarChart3,
  Download,
  Filter,
  Printer
} from 'lucide-react';

type ReportType = 
  | 'lista-geral'
  | 'categoria-equipe'
  | 'por-estado'
  | 'em-captacao'
  | 'historico-vinculos'
  | 'status-medico'
  | 'distribuicao';

interface Report {
  id: ReportType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  permission: string[];
  fields: string[];
  filters: string[];
  exports: string[];
}

const REPORTS: Report[] = [
  {
    id: 'lista-geral',
    title: 'Lista Geral de Atletas',
    description: 'Visão completa do elenco com todos os dados cadastrais',
    icon: <Users className="h-6 w-6" />,
    color: 'bg-blue-500',
    permission: ['dirigente', 'coordenador'],
    fields: ['Nome', 'Idade', 'Categoria', 'Equipe', 'Posições', 'Estado', 'Contato'],
    filters: ['Todos disponíveis'],
    exports: ['PDF', 'Excel', 'CSV'],
  },
  {
    id: 'categoria-equipe',
    title: 'Atletas por Categoria/Equipe',
    description: 'Organização esportiva agrupada por categoria ou equipe',
    icon: <Activity className="h-6 w-6" />,
    color: 'bg-green-500',
    permission: ['dirigente', 'coordenador', 'treinador', 'atleta'],
    fields: ['Nome', 'Idade', 'Posições', 'Altura/Peso', 'Dominância'],
    filters: ['Categoria', 'Equipe'],
    exports: ['PDF', 'Excel'],
  },
  {
    id: 'por-estado',
    title: 'Atletas por Estado',
    description: 'Listagem de atletas ativas, dispensadas ou arquivadas',
    icon: <FileText className="h-6 w-6" />,
    color: 'bg-yellow-500',
    permission: ['dirigente', 'coordenador'],
    fields: ['Nome', 'Estado', 'Data Mudança', 'Motivo'],
    filters: ['Estado (ativa/dispensada/arquivada)'],
    exports: ['Excel', 'CSV'],
  },
  {
    id: 'em-captacao',
    title: 'Atletas em Captação',
    description: 'Pipeline de atletas sem vínculo com equipe',
    icon: <UserSearch className="h-6 w-6" />,
    color: 'bg-purple-500',
    permission: ['dirigente', 'coordenador'],
    fields: ['Nome', 'Idade', 'Categoria Natural', 'Data Cadastro', 'Cadastrado Por'],
    filters: ['organization_id IS NULL'],
    exports: ['Excel'],
  },
  {
    id: 'historico-vinculos',
    title: 'Histórico de Vínculos',
    description: 'Em quais equipes cada atleta já atuou na organização',
    icon: <Link2 className="h-6 w-6" />,
    color: 'bg-indigo-500',
    permission: ['dirigente', 'coordenador', 'treinador', 'atleta'],
    fields: ['Atleta', 'Equipe', 'Data Início', 'Data Fim', 'Categoria'],
    filters: ['Atleta', 'Período'],
    exports: ['PDF'],
  },
  {
    id: 'status-medico',
    title: 'Status Médico',
    description: 'Atletas com lesão, restrição ou afastamento',
    icon: <Stethoscope className="h-6 w-6" />,
    color: 'bg-red-500',
    permission: ['dirigente', 'coordenador'],
    fields: ['Nome', 'Tipo Restrição', 'Data Início', 'Observações'],
    filters: ['injured=true', 'medical_restriction=true'],
    exports: ['Excel (dados sensíveis)'],
  },
  {
    id: 'distribuicao',
    title: 'Distribuição Estatística',
    description: 'Gráficos e análises estratégicas do elenco',
    icon: <BarChart3 className="h-6 w-6" />,
    color: 'bg-teal-500',
    permission: ['dirigente', 'coordenador'],
    fields: ['Gráficos: Idade, Posição, Categoria, Altura/Peso'],
    filters: ['Equipe', 'Categoria'],
    exports: ['PDF com gráficos'],
  },
];

interface ReportFilters {
  team_id?: string;
  category_id?: string;
  state?: 'ativa' | 'dispensada' | 'arquivada';
  injured?: boolean;
  medical_restriction?: boolean;
  start_date?: string;
  end_date?: string;
}

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async (reportId: ReportType, format: 'pdf' | 'excel' | 'csv') => {
    setIsGenerating(true);
    
    try {
      // TODO: Chamar API do backend para gerar relatório
      // Por enquanto, simular geração
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Abrir em nova janela para download/impressão
      alert(`Relatório "${REPORTS.find(r => r.id === reportId)?.title}" gerado com sucesso!\nFormato: ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          📊 Relatórios de Atletas
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gere relatórios detalhados do elenco conforme suas necessidades
        </p>
      </div>

      {/* Grid de Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {REPORTS.map((report) => (
          <div
            key={report.id}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md ${
              selectedReport === report.id ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            {/* Header do Card */}
            <div className={`${report.color} p-4 text-white`}>
              <div className="flex items-center gap-3">
                {report.icon}
                <h2 className="font-semibold text-lg">{report.title}</h2>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {report.description}
              </p>

              {/* Campos incluídos */}
              <div className="mb-3">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Campos:
                </span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {report.fields.join(', ')}
                </p>
              </div>

              {/* Filtros disponíveis */}
              <div className="mb-3">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
                  <Filter className="h-3 w-3" /> Filtros:
                </span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {report.filters.join(', ')}
                </p>
              </div>

              {/* Permissões */}
              <div className="mb-4">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Permissão:
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {report.permission.map((perm) => (
                    <span
                      key={perm}
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>

              {/* Botões de exportação */}
              <div className="flex flex-wrap gap-2">
                {report.exports.includes('PDF') && (
                  <button
                    onClick={() => handleGenerateReport(report.id, 'pdf')}
                    disabled={isGenerating}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                  >
                    <Printer className="h-4 w-4" />
                    PDF
                  </button>
                )}
                {report.exports.includes('Excel') && (
                  <button
                    onClick={() => handleGenerateReport(report.id, 'excel')}
                    disabled={isGenerating}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    Excel
                  </button>
                )}
                {report.exports.includes('CSV') && (
                  <button
                    onClick={() => handleGenerateReport(report.id, 'csv')}
                    disabled={isGenerating}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    CSV
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros Globais (Futuro) */}
      <div className="mt-8 bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros Avançados
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Equipe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Equipe
            </label>
            <select
              value={filters.team_id || ''}
              onChange={(e) => setFilters({ ...filters, team_id: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Todas as equipes</option>
              {/* TODO: Popular com equipes da API */}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <select
              value={filters.state || ''}
              onChange={(e) => setFilters({ ...filters, state: e.target.value as any || undefined })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Todos os estados</option>
              <option value="ativa">Ativa</option>
              <option value="dispensada">Dispensada</option>
              <option value="arquivada">Arquivada</option>
            </select>
          </div>

          {/* Período */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Período
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value || undefined })}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <input
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value || undefined })}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Checkboxes de flags */}
        <div className="mt-4 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={filters.injured || false}
              onChange={(e) => setFilters({ ...filters, injured: e.target.checked || undefined })}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            Apenas lesionadas
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={filters.medical_restriction || false}
              onChange={(e) => setFilters({ ...filters, medical_restriction: e.target.checked || undefined })}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            Com restrição médica
          </label>
        </div>
      </div>

      {/* Info sobre formato */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-200">
        <h4 className="font-semibold mb-2">📋 Sobre os formatos de exportação:</h4>
        <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
          <li><strong>PDF:</strong> Layout profissional com cabeçalho e paginação automática</li>
          <li><strong>Excel:</strong> Headers em português, colunas ajustadas, totalizadores</li>
          <li><strong>CSV:</strong> Formato simples para importação em outros sistemas</li>
        </ul>
        <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
          Todos os relatórios incluem: data/hora de geração, usuário que gerou e filtros aplicados.
        </p>
      </div>
    </div>
  );
}
