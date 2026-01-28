'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAthlete } from '@/lib/hooks/useAthletes';
import { usePermissions } from '@/lib/hooks/usePermissions';
import JustificationModal from '@/components/Athletes/JustificationModal';
import { AlertTriangle, Lock, Save, X } from 'lucide-react';

/**
 * Página de Edição de Atleta
 * 
 * Referências:
 * - Seção 5.1: Campos editáveis após cadastro
 * - Data de nascimento: BLOQUEADA quando tem vínculo ativo
 * - RG/CPF/Email: Exigem justificativa obrigatória
 */

// Campos que requerem justificativa para edição
const SENSITIVE_FIELDS = ['athlete_rg', 'athlete_cpf', 'athlete_email', 'birth_date'];

interface FormData {
  athlete_name: string;
  athlete_nickname: string;
  birth_date: string;
  gender: 'masculino' | 'feminino';
  athlete_rg: string;
  athlete_cpf: string;
  athlete_phone: string;
  athlete_email: string;
  guardian_name: string;
  guardian_phone: string;
  zip_code: string;
  street: string;
  address_number: string;
  address_complement: string;
  neighborhood: string;
  city: string;
  address_state: string;
}

export default function EditAthletePage() {
  const params = useParams();
  const router = useRouter();
  const athleteId = params.id as string;
  
  const { athlete, isLoading, error, refetch } = useAthlete(athleteId);
  const { canDoAthleteAction, getEditableFields, userRole } = usePermissions();

  // Estado do formulário
  const [formData, setFormData] = useState<FormData | null>(null);
  const [originalData, setOriginalData] = useState<FormData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Estado para modal de justificativa
  const [justificationModal, setJustificationModal] = useState<{
    isOpen: boolean;
    fieldName: string;
    fieldLabel: string;
    oldValue?: string;
    newValue?: string;
    isBlocked?: boolean;
    blockedMessage?: string;
  }>({
    isOpen: false,
    fieldName: '',
    fieldLabel: '',
  });

  // Pendente de justificativa para campos alterados
  const [pendingJustifications, setPendingJustifications] = useState<Record<string, string>>({});

  // Verificar permissão de edição
  const canEdit = canDoAthleteAction('edit_basic');
  const hasActiveRegistration = athlete?.team_registrations?.some(r => !r.end_at) ?? false;
  const editableFields = getEditableFields({ athleteHasActiveRegistration: hasActiveRegistration });

  // Inicializar formulário com dados da atleta
  useEffect(() => {
    if (athlete && !formData) {
      const genderValue =
        athlete.person?.gender === 'male'
          ? 'masculino'
          : athlete.person?.gender === 'female'
          ? 'feminino'
          : 'feminino';

      const data: FormData = {
        athlete_name: athlete.athlete_name || '',
        athlete_nickname: athlete.athlete_nickname || '',
        birth_date: athlete.birth_date || '',
        gender: genderValue,
        athlete_rg: athlete.athlete_rg || '',
        athlete_cpf: athlete.athlete_cpf || '',
        athlete_phone: athlete.athlete_phone || '',
        athlete_email: athlete.athlete_email || '',
        guardian_name: athlete.guardian_name || '',
        guardian_phone: athlete.guardian_phone || '',
        zip_code: athlete.zip_code || '',
        street: athlete.street || '',
        address_number: athlete.address_number || '',
        address_complement: athlete.address_complement || '',
        neighborhood: athlete.neighborhood || '',
        city: athlete.city || '',
        address_state: athlete.state_address || '',
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [athlete, formData]);

  // Verificar se campo foi alterado
  const isFieldChanged = (fieldName: keyof FormData) => {
    if (!formData || !originalData) return false;
    return formData[fieldName] !== originalData[fieldName];
  };

  // Handler para mudança de campo
  const handleFieldChange = (fieldName: keyof FormData, value: string) => {
    if (!formData || !originalData) return;

    // Verificar se é campo sensível e foi alterado
    if (SENSITIVE_FIELDS.includes(fieldName)) {
      const originalValue = originalData[fieldName];
      
      // Se é data de nascimento e tem vínculo ativo, bloquear
      if (fieldName === 'birth_date' && hasActiveRegistration && userRole !== 'admin') {
        setJustificationModal({
          isOpen: true,
          fieldName,
          fieldLabel: 'Data de Nascimento',
          isBlocked: true,
          blockedMessage: 'Data de nascimento não pode ser alterada quando a atleta possui vínculo ativo. Apenas Dirigentes podem solicitar exceção.',
        });
        return;
      }

      // Se valor mudou, exigir justificativa
      if (value !== originalValue) {
        setJustificationModal({
          isOpen: true,
          fieldName,
          fieldLabel: getFieldLabel(fieldName),
          oldValue: originalValue,
          newValue: value,
          isBlocked: false,
        });
        return;
      }
    }

    setFormData({ ...formData, [fieldName]: value });
  };

  // Handler quando justificativa é confirmada
  const handleJustificationConfirm = (justification: string) => {
    const { fieldName, newValue } = justificationModal;
    
    if (formData && newValue !== undefined) {
      setFormData({ ...formData, [fieldName]: newValue } as FormData);
      setPendingJustifications({ ...pendingJustifications, [fieldName]: justification });
    }
    
    setJustificationModal({ ...justificationModal, isOpen: false });
  };

  // Helper para label de campos
  const getFieldLabel = (fieldName: string): string => {
    const labels: Record<string, string> = {
      'athlete_name': 'Nome',
      'athlete_nickname': 'Apelido',
      'birth_date': 'Data de Nascimento',
      'gender': 'Gênero',
      'athlete_rg': 'RG',
      'athlete_cpf': 'CPF',
      'athlete_phone': 'Telefone',
      'athlete_email': 'Email',
      'guardian_name': 'Nome do Responsável',
      'guardian_phone': 'Telefone do Responsável',
    };
    return labels[fieldName] || fieldName;
  };

  // Handler de submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    // Verificar se há campos sensíveis alterados sem justificativa
    const changedSensitiveFields = SENSITIVE_FIELDS.filter(field => 
      isFieldChanged(field as keyof FormData) && !pendingJustifications[field]
    );

    if (changedSensitiveFields.length > 0) {
      setSaveError(`Campos sensíveis alterados requerem justificativa: ${changedSensitiveFields.map(getFieldLabel).join(', ')}`);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // TODO: Chamar API real de atualização
      // const response = await athletesService.update(athleteId, {
      //   ...formData,
      //   _justifications: pendingJustifications,
      // });
      
      // Simulação
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      router.push(`/admin/athletes/${athleteId}`);
    } catch (err: any) {
      setSaveError(err?.message || 'Erro ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !athlete) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h2 className="text-red-800 dark:text-red-200 font-semibold">Erro ao carregar atleta</h2>
          <p className="text-red-600 dark:text-red-400 mt-1">{error || 'Atleta não encontrada'}</p>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h2 className="text-yellow-800 dark:text-yellow-200 font-semibold">Acesso Negado</h2>
          <p className="text-yellow-600 dark:text-yellow-400 mt-1">
            Você não tem permissão para editar dados de atletas.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Editar Atleta
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {athlete.athlete_name}
        </p>
      </div>

      {/* Aviso sobre campos bloqueados */}
      {hasActiveRegistration && (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                Atleta com vínculo ativo
              </h3>
              <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                Data de nascimento está <strong>bloqueada</strong> (afeta categoria e elegibilidade).
                Alterações em RG, CPF e Email requerem <strong>justificativa obrigatória</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Erro de salvamento */}
      {saveError && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{saveError}</p>
        </div>
      )}

      {/* Formulário de Edição */}
      {formData && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Dados Pessoais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={formData.athlete_name}
                  onChange={(e) => setFormData({ ...formData, athlete_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Apelido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Apelido
                </label>
                <input
                  type="text"
                  value={formData.athlete_nickname}
                  onChange={(e) => setFormData({ ...formData, athlete_nickname: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Data de Nascimento - COM BLOQUEIO */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                  Data de Nascimento
                  {hasActiveRegistration && userRole !== 'admin' && (
                    <Lock className="h-4 w-4 text-yellow-500" />
                  )}
                </label>
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleFieldChange('birth_date', e.target.value)}
                  disabled={hasActiveRegistration && userRole !== 'admin'}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    hasActiveRegistration && userRole !== 'admin'
                      ? 'bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  } text-gray-900 dark:text-white`}
                />
                {hasActiveRegistration && userRole !== 'admin' && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    Bloqueado: afeta categoria natural (R15)
                  </p>
                )}
              </div>

              {/* Gênero */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Gênero
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'masculino' | 'feminino' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="feminino">Feminino</option>
                  <option value="masculino">Masculino</option>
                </select>
              </div>
            </div>
          </div>

          {/* Documentos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Documentos
              <span className="ml-2 text-xs font-normal text-yellow-600 dark:text-yellow-400">
                (requer justificativa)
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* RG */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                  RG
                  {isFieldChanged('athlete_rg') && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                      {pendingJustifications['athlete_rg'] ? '✓ Justificado' : '⚠️ Requer justificativa'}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.athlete_rg}
                  onChange={(e) => handleFieldChange('athlete_rg', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* CPF */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                  CPF
                  {isFieldChanged('athlete_cpf') && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                      {pendingJustifications['athlete_cpf'] ? '✓ Justificado' : '⚠️ Requer justificativa'}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.athlete_cpf}
                  onChange={(e) => handleFieldChange('athlete_cpf', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                  Email
                  {isFieldChanged('athlete_email') && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                      {pendingJustifications['athlete_email'] ? '✓ Justificado' : '⚠️ Requer justificativa'}
                    </span>
                  )}
                </label>
                <input
                  type="email"
                  value={formData.athlete_email}
                  onChange={(e) => handleFieldChange('athlete_email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Contatos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Contatos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.athlete_phone}
                  onChange={(e) => setFormData({ ...formData, athlete_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Responsável
                </label>
                <input
                  type="text"
                  value={formData.guardian_name}
                  onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefone do Responsável
                </label>
                <input
                  type="tel"
                  value={formData.guardian_phone}
                  onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Endereço
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Logradouro
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  value={formData.address_number}
                  onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Complemento
                </label>
                <input
                  type="text"
                  value={formData.address_complement}
                  onChange={(e) => setFormData({ ...formData, address_complement: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  UF
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={formData.address_state}
                  onChange={(e) => setFormData({ ...formData, address_state: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      )}

      {/* Modal de Justificativa */}
      <JustificationModal
        isOpen={justificationModal.isOpen}
        onClose={() => setJustificationModal({ ...justificationModal, isOpen: false })}
        onConfirm={handleJustificationConfirm}
        fieldName={justificationModal.fieldName}
        fieldLabel={justificationModal.fieldLabel}
        oldValue={justificationModal.oldValue}
        newValue={justificationModal.newValue}
        isBlocked={justificationModal.isBlocked}
        blockedMessage={justificationModal.blockedMessage}
      />
    </div>
  );
}

