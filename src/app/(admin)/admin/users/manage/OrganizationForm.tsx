"use client";

import { useState } from "react";

interface OrganizationFormProps {
  mode: "view" | "edit" | "create";
  data?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  onClose: () => void;
}

export default function OrganizationForm({ mode, data, onSave, onCancel, onClose }: OrganizationFormProps) {
  const [formData, setFormData] = useState({
    name: data?.name || "",
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isViewMode = mode === "view";
  const isCreateMode = mode === "create";
  const isEditMode = mode === "edit";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSubmit = async () => {
    // Validação básica
    if (!formData.name.trim()) {
      setShowValidationModal(true);
      return;
    }

    if (formData.name.trim().length < 3) {
      setShowValidationModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: formData.name.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowDiscardModal(true);
    } else {
      onCancel();
    }
  };

  const confirmDiscard = () => {
    setShowDiscardModal(false);
    onCancel();
  };

  return (
    <div className="relative h-full overflow-y-auto">
      {/* Botão X no canto superior esquerdo */}
      <button
        onClick={handleCancel}
        className="absolute top-0 left-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl font-bold leading-none"
        title="Fechar"
      >
        ×
      </button>

      {/* Título */}
      <div className="ml-8 mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {isCreateMode 
            ? "Adicionar Organização" 
            : isEditMode 
              ? "Editar Organização" 
              : "Detalhes da Organização"}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          {isCreateMode 
            ? "Preencha os dados para criar uma nova organização"
            : isEditMode
              ? "Altere os dados conforme necessário"
              : "Visualização dos dados da organização"}
        </p>
      </div>

      {/* Formulário */}
      <div className="ml-8 space-y-6">
        {/* Card Principal */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🏢</span>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Dados da Organização
            </h3>
          </div>

          <div className="space-y-4">
            {/* Nome da Organização */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome da Organização *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={isViewMode}
                placeholder="Ex: Clube de Handebol São Paulo"
                className={`w-full px-3 py-2 border rounded-lg text-sm 
                  ${isViewMode 
                    ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed" 
                    : "bg-white dark:bg-gray-800"
                  }
                  border-gray-300 dark:border-gray-600 
                  text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-brand-500 focus:border-transparent`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Nome completo do clube ou organização esportiva
              </p>
            </div>
          </div>
        </div>

        {/* Informações sobre a criação */}
        {isCreateMode && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-blue-500">ℹ️</span>
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Sobre a criação de Organizações
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                  Após criar a organização, você poderá adicionar Dirigentes, Coordenadores, 
                  Treinadores e Equipes a ela. Conforme REGRAS.md V1.2, a organização é 
                  a entidade base para o gerenciamento de clubes esportivos.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botões de ação */}
        {!isViewMode && (
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.name.trim()}
              className="px-4 py-2 text-sm font-medium text-white 
                bg-brand-600 hover:bg-brand-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                rounded-lg transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Salvando...</span>
                </>
              ) : (
                <span>{isCreateMode ? "Criar Organização" : "Salvar Alterações"}</span>
              )}
            </button>
          </div>
        )}

        {/* Modo visualização - botão de editar */}
        {isViewMode && (
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {/* TODO: implementar modo edição */}}
              className="px-4 py-2 text-sm font-medium text-white 
                bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
            >
              Editar
            </button>
          </div>
        )}
      </div>

      {/* Modal de Validação */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Dados incompletos
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              O nome da organização é obrigatório e deve ter pelo menos 3 caracteres.
            </p>
            <button 
              onClick={() => setShowValidationModal(false)}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      {/* Modal de Descarte */}
      {showDiscardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Descartar alterações?
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Você tem alterações não salvas. Deseja realmente descartá-las?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDiscardModal(false)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Continuar editando
              </button>
              <button 
                onClick={confirmDiscard}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
