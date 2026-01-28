'use client';

/**
 * DataExportSection Component
 * 
 * LGPD Compliance - Art. 18, II (Direito à Portabilidade)
 * Allows athletes to export their personal data in JSON or CSV format
 */

import { useState } from 'react';
import { Icons } from '@/design-system/icons';
import { toast } from 'sonner';
import { 
  exportAthleteDataJSON, 
  exportAthleteDataCSV, 
  downloadBlob,
  formatFileSize,
  type AthleteDataExportResponse 
} from '@/lib/api/athlete-export';

export function DataExportSection() {
  const [loadingJSON, setLoadingJSON] = useState(false);
  const [loadingCSV, setLoadingCSV] = useState(false);
  const [jsonData, setJsonData] = useState<AthleteDataExportResponse | null>(null);
  const [showJsonModal, setShowJsonModal] = useState(false);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleExportJSON = async () => {
    setLoadingJSON(true);
    try {
      const data = await exportAthleteDataJSON();
      setJsonData(data);
      setShowJsonModal(true);
      toast.success('Dados exportados em JSON', {
        description: `${data.total_records} registros encontrados`,
      });
    } catch (error: any) {
      console.error('Export JSON error:', error);
      
      if (error.response?.status === 400) {
        toast.error('Erro ao exportar', {
          description: 'Apenas atletas podem exportar seus dados',
        });
      } else if (error.response?.status === 404) {
        toast.error('Atleta não encontrado', {
          description: 'Perfil de atleta não está configurado',
        });
      } else {
        toast.error('Erro ao exportar dados', {
          description: 'Tente novamente em alguns instantes',
        });
      }
    } finally {
      setLoadingJSON(false);
    }
  };

  const handleExportCSV = async () => {
    setLoadingCSV(true);
    try {
      const blob = await exportAthleteDataCSV();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `athlete_data_${timestamp}.zip`;
      downloadBlob(blob, filename);
      
      toast.success('Download iniciado', {
        description: `Arquivo: ${filename}`,
      });
    } catch (error: any) {
      console.error('Export CSV error:', error);
      
      if (error.response?.status === 400) {
        toast.error('Erro ao exportar', {
          description: 'Apenas atletas podem exportar seus dados',
        });
      } else if (error.response?.status === 404) {
        toast.error('Atleta não encontrado', {
          description: 'Perfil de atleta não está configurado',
        });
      } else {
        toast.error('Erro ao exportar dados', {
          description: 'Tente novamente em alguns instantes',
        });
      }
    } finally {
      setLoadingCSV(false);
    }
  };

  const handleDownloadJSON = () => {
    if (!jsonData) return;
    
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const fileName = `athlete-data-${jsonData.personal_info.full_name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    downloadBlob(blob, fileName);
    
    toast.success('Download JSON iniciado');
  };

  const handleCloseModal = () => {
    setShowJsonModal(false);
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      {/* Card Principal */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Icons.UI.Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Privacidade e Dados
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Seus direitos garantidos pela LGPD
            </p>
          </div>
        </div>

        {/* LGPD Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Icons.Status.Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Direito à Portabilidade de Dados
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                Conforme LGPD Art. 18, II, você pode exportar todos os seus dados pessoais 
                em formato estruturado para uso próprio ou transferência.
              </p>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div data-tour="personal-history" className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Exportar Meus Dados
          </h3>

          {/* JSON Option */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Icons.UI.FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />        
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Formato JSON
                </h4>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Estrutura de dados completa para integração com outros sistemas
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportJSON}
              disabled={loadingJSON}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {loadingJSON ? (
                <>
                  <Icons.UI.Loading className="h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Icons.Actions.Download className="h-4 w-4" />
                  Exportar JSON
                </>
              )}
            </button>
          </div>

          {/* CSV Option */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Icons.UI.FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Formato CSV (ZIP)
                </h4>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Múltiplos arquivos CSV para visualização em Excel/Google Sheets
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={loadingCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {loadingCSV ? (
                <>
                  <Icons.UI.Loading className="h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Icons.Actions.Download className="h-4 w-4" />
                  Exportar CSV
                </>
              )}
            </button>
          </div>
        </div>

        {/* Privacy Policy Link */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <a
            href="/privacy-policy"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
          >
            Ler Política de Privacidade Completa
          </a>
        </div>

        {/* What's Included */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            O que está incluído na exportação:
          </h4>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <Icons.Status.CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span>Informações pessoais (nome, data de nascimento, posição, altura, peso)</span>
            </li>
            <li className="flex items-start gap-2">
              <Icons.Status.CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span>Histórico completo de wellness pré e pós-treino</span>
            </li>
            <li className="flex items-start gap-2">
              <Icons.Status.CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span>Registro de presenças em treinos</span>
            </li>
            <li className="flex items-start gap-2">
              <Icons.Status.CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span>Histórico médico (lesões e acompanhamentos)</span>
            </li>
            <li className="flex items-start gap-2">
              <Icons.Status.CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span>Badges e conquistas gamificadas</span>
            </li>
          </ul>
        </div>

        {/* What's NOT Included */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Por motivos de privacidade, NÃO incluímos:
          </h4>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <Icons.Status.Error className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <span>Logs de quem acessou seus dados</span>
            </li>
            <li className="flex items-start gap-2">
              <Icons.Status.Error className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <span>Dados de outros atletas</span>
            </li>
            <li className="flex items-start gap-2">
              <Icons.Status.Error className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <span>Informações internas de equipes/organizações</span>
            </li>
          </ul>
        </div>
      </div>

      {/* JSON Preview Modal */}
      {showJsonModal && jsonData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Dados Exportados (JSON)
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {jsonData.total_records} registros • Gerado em {new Date(jsonData.generated_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Icons.Status.Close className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Modal Content - JSON Preview */}
            <div className="flex-1 overflow-auto p-6">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <pre className="text-xs text-gray-800 dark:text-gray-200 font-mono overflow-x-auto">
                  {JSON.stringify(jsonData, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <Icons.Status.Info className="inline h-4 w-4 mr-1" />
                Formato: JSON • {formatFileSize(new Blob([JSON.stringify(jsonData)]).size)}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleDownloadJSON}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Icons.Actions.Download className="h-4 w-4" />
                  Baixar JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
