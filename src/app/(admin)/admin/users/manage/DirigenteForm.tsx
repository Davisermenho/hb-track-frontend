"use client";

import { useState } from "react";
import { 
  getPrimaryPhone, 
  getPrimaryEmail, 
  getPersonCPF, 
  getPrimaryAddress,
  formatPersonName,
  type Person 
} from "../../../../../types/persons";

interface DirigenteFormProps {
  mode: "view" | "edit" | "create";
  data?: any;
  organizationId?: string;
  onSave: (data: any) => void;
  onCancel: () => void;
  onClose: () => void;
}

/**
 * Extrai dados de Person V1.2 para o formulário
 * V1.2: Dados estão em tabelas separadas (contacts, addresses, documents)
 */
function extractPersonDataForForm(data: any) {
  if (!data?.person) {
    return {
      full_name: "",
      cpf: "",
      birth_date: "",
      gender: "",
      email: "",
      phone: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zip_code: "",
      occupation: "",
      company: "",
    };
  }

  const person = data.person as Person;
  
  // V1.2: Nome pode estar em full_name ou first_name + last_name
  const fullName = formatPersonName(person);
  
  // V1.2: Contatos estão em person_contacts
  const email = getPrimaryEmail(person) || "";
  const phone = getPrimaryPhone(person) || "";
  
  // V1.2: CPF está em person_documents
  const cpf = getPersonCPF(person) || "";
  
  // V1.2: Endereço está em person_addresses
  const primaryAddress = getPrimaryAddress(person);
  
  // Mapear gênero V1.2 para labels legíveis
  const genderMap: Record<string, string> = {
    'female': 'feminino',
    'male': 'masculino',
    'other': 'outro',
    'not_informed': '',
  };
  const gender = genderMap[person.gender] || "";

  return {
    full_name: fullName,
    cpf,
    birth_date: person.birth_date || "",
    gender,
    email,
    phone,
    street: primaryAddress?.street || "",
    number: primaryAddress?.number || "",
    complement: primaryAddress?.complement || "",
    neighborhood: primaryAddress?.neighborhood || "",
    city: primaryAddress?.city || "",
    state: primaryAddress?.state || "",
    zip_code: primaryAddress?.zip_code || "",
    occupation: "",  // Não implementado em Person V1.2
    company: "",     // Não implementado em Person V1.2
  };
}

export default function DirigenteForm({ mode, data, onSave, onCancel, onClose }: DirigenteFormProps) {
  // V1.2: Usar helper para extrair dados do Person normalizado
  const [formData, setFormData] = useState(extractPersonDataForForm(data));

  const [createUser, setCreateUser] = useState(true); // Checkbox "Criar Usuário"
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showInvalidCpfModal, setShowInvalidCpfModal] = useState(false);

  // Validação de CPF
  const isValidCPF = (cpf: string): boolean => {
    cpf = cpf.replace(/[^\d]/g, "");
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    return digit === parseInt(cpf.charAt(10));
  };

  // Busca CEP via ViaCEP API
  const fetchAddressByCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/[^\d]/g, "");
    if (cleanCEP.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);

    // Buscar endereço ao preencher CEP
    if (name === "zip_code" && value.replace(/[^\d]/g, "").length === 8) {
      fetchAddressByCEP(value);
    }
  };

  const handleCloseClick = () => {
    if (hasUnsavedChanges && mode !== "view") {
      setShowDiscardModal(true);
    } else {
      onClose();
    }
  };

  const handleDiscardChanges = () => {
    setShowDiscardModal(false);
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleClear = () => {
    setFormData({
      full_name: "",
      cpf: "",
      birth_date: "",
      gender: "",
      email: "",
      phone: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zip_code: "",
      occupation: "",
      company: "",
    });
    setCreateUser(true);
    setHasUnsavedChanges(false);
  };

  const handleSave = () => {
    // Validação básica - apenas nome e email são obrigatórios para dirigente
    if (!formData.full_name || !formData.email) {
      setShowValidationModal(true);
      return;
    }

    // Validar CPF apenas se foi preenchido
    if (formData.cpf && !isValidCPF(formData.cpf)) {
      setShowInvalidCpfModal(true);
      return;
    }

    // Incluir informação sobre criação de usuário
    onSave({ ...formData, createUser });
    setHasUnsavedChanges(false);
  };

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isCreateMode = mode === "create";

  return (
    <>
      {/* Modal de CPF inválido */}
      {showInvalidCpfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-1">
              CPF Inválido
            </h3>
            <p className="text-[12px] text-gray-600 dark:text-gray-400 mb-6">
              O CPF informado não é válido. Por favor, verifique e tente novamente.
            </p>
            <div className="flex gap-1.5 justify-end">
              <button
                onClick={() => setShowInvalidCpfModal(false)}
                className="px-2 py-0.5 text-[12px] bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de validação */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-1">
              Campos obrigatórios não preenchidos
            </h3>
            <p className="text-[12px] text-gray-600 dark:text-gray-400 mb-6">
              Para cadastrar um dirigente, preencha:<br/>
              • Nome Completo<br/>
              • E-mail
            </p>
            <div className="flex gap-1.5 justify-end">
              <button
                onClick={() => setShowValidationModal(false)}
                className="px-2 py-0.5 text-[12px] bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de descarte */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-1">
              Descartar alterações?
            </h3>
            <p className="text-[12px] text-gray-600 dark:text-gray-400 mb-6">
              Você tem alterações não salvas. Deseja descartar essas mudanças?
            </p>
            <div className="flex gap-1.5 justify-end">
              <button
                onClick={() => setShowDiscardModal(false)}
                className="px-2 py-0.5 text-[12px] bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleDiscardChanges}
                className="px-2 py-0.5 text-[12px] bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Descartar mudanças
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulário principal */}
      <div className="relative h-full">
        {/* Botão X no canto superior DIREITO */}
        <button
          onClick={handleCloseClick}
          className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl font-bold leading-none"
          title="Fechar"
        >
          ×
        </button>

        {/* Título */}
        <div className="mb-1 pr-8 flex items-center gap-2 flex-wrap">
          <h2 className="text-[14px] font-bold text-gray-900 dark:text-white">
            {isCreateMode ? "Adicionar dirigente" : isEditMode ? "Editar dirigente" : "Visualizar dirigente"}
          </h2>
          <div className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-[10px] rounded inline-block">
            Papel: Dirigente (inalterável)
          </div>
        </div>

        {/* Formulário */}
        <form className="space-y-2">
          {/* SEÇÃO 1 - Dados Pessoais Obrigatórios */}
          <div>
<div className="grid grid-cols-2 gap-1.5">
              <div className="col-span-2">
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  disabled={isViewMode}
                  required
                  className="w-full px-2 py-0.5 text-[12px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  placeholder="Digite o nome completo"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  CPF
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  disabled={isViewMode}
                  maxLength={14}
                  className="w-full px-2 py-0.5 text-[12px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  placeholder="000.000.000-00"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="w-full px-2 py-0.5 text-[12px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  Gênero
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="w-full px-2 py-0.5 text-[12px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                >
                  <option value="">Selecione</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  E-mail <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isViewMode}
                  required
                  className="w-full px-2 py-0.5 text-[12px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 2 - Dados de Contato (Opcionais) */}
          <div>
            <h3 className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-1 pb-1 border-b border-gray-200 dark:border-gray-700">
              Dados de Contato (Opcionais)
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  Telefone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="w-full px-2 py-0.5 text-[12px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 3 - Endereço (Opcionais) */}
          <div>
            <h3 className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-1 pb-1 border-b border-gray-200 dark:border-gray-700">
              Endereço (Opcionais)
            </h3>
            <div className="grid grid-cols-4 gap-1.5">
              <div className="col-span-2">
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  Rua
                </label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="w-full px-2 py-0.5 text-[12px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  Número
                </label>
                <input
                  type="text"
                  name="number"
                  value={formData.number}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="w-full px-2 py-0.5 text-[12px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  Complemento
                </label>
                <input
                  type="text"
                  name="complement"
                  value={formData.complement}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="w-full px-2 py-0.5 text-[12px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  Bairro
                </label>
                <input
                  type="text"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="w-full px-2 py-0.5 text-[12px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  Cidade
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="w-full px-2 py-0.5 text-[12px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  Estado
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="w-full px-2 py-0.5 text-[12px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                >
                  <option value="">Selecione</option>
                  <option value="AC">AC</option>
                  <option value="AL">AL</option>
                  <option value="AP">AP</option>
                  <option value="AM">AM</option>
                  <option value="BA">BA</option>
                  <option value="CE">CE</option>
                  <option value="DF">DF</option>
                  <option value="ES">ES</option>
                  <option value="GO">GO</option>
                  <option value="MA">MA</option>
                  <option value="MT">MT</option>
                  <option value="MS">MS</option>
                  <option value="MG">MG</option>
                  <option value="PA">PA</option>
                  <option value="PB">PB</option>
                  <option value="PR">PR</option>
                  <option value="PE">PE</option>
                  <option value="PI">PI</option>
                  <option value="RJ">RJ</option>
                  <option value="RN">RN</option>
                  <option value="RS">RS</option>
                  <option value="RO">RO</option>
                  <option value="RR">RR</option>
                  <option value="SC">SC</option>
                  <option value="SP">SP</option>
                  <option value="SE">SE</option>
                  <option value="TO">TO</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  CEP
                </label>
                <input
                  type="text"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleChange}
                  disabled={isViewMode}
                  maxLength={9}
                  className="w-full px-2 py-0.5 text-[12px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  placeholder="00000-000"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 4 - Dados Profissionais (Opcionais) */}
          <div>
            <h3 className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-1 pb-1 border-b border-gray-200 dark:border-gray-700">
              Dados Profissionais (Opcionais)
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  Ocupação/Profissão
                </label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="w-full px-2 py-0.5 text-[12px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  Empresa
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="w-full px-2 py-0.5 text-[12px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Checkbox "Criar Usuário" + Botões */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            {/* Checkbox "Criar Usuário" */}
            {(isCreateMode || isEditMode) && (
              <div className="flex items-center gap-1.5 mb-3 p-1.5 bg-blue-50 dark:bg-blue-900/10 rounded border border-blue-200 dark:border-blue-800">
                <input
                  type="checkbox"
                  id="createUser"
                  checked={createUser}
                  onChange={(e) => {
                    setCreateUser(e.target.checked);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="createUser" className="text-[10px] font-medium text-gray-900 dark:text-white cursor-pointer">
                  Criar Usuário
                </label>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-1">
                  {createUser ? "(Será enviado email com link de redefinição de senha)" : "(Cadastro apenas como pessoa)"}
                </span>
              </div>
            )}

            {/* Botões alinhados à direita */}
            <div className="flex gap-1.5 justify-end">
              {isViewMode && (
                <>
                  <button
                    type="button"
                    onClick={() => {}}
                    className="px-2 py-0.5 text-[10px] bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => {}}
                    className="px-2 py-0.5 text-[10px] bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    🗑️ Excluir
                  </button>
                </>
              )}

              {(isEditMode || isCreateMode) && (
                <>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-2 py-0.5 text-[10px] bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    LIMPAR
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-2 py-0.5 text-[10px] bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-2 py-0.5 text-[10px] bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    SALVAR
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
