"use client";

import { useState, useEffect, useCallback } from "react";
import { personsService } from "@/lib/api/persons";
import PersonAvatar, { AvatarWithName } from "@/components/common/PersonAvatar";
import type { 
  Person, 
  PersonCreate, 
  PersonUpdate, 
  PersonFilters,
  PersonContact,
  PersonContactCreate,
  PersonAddress,
  PersonAddressCreate,
  PersonDocument,
  PersonDocumentCreate,
  Gender,
  ContactType,
  AddressType,
  DocumentType,
} from "../../../../types/persons";

/**
 * Página de Cadastro de Pessoas
 * 
 * REGRAS.md V1.2:
 * - Person é a entidade base (identidade)
 * - Dados normalizados em tabelas separadas (contacts, addresses, documents, media)
 * - Pessoa pode existir sem ter papel/função definido ainda
 * - Pessoa ≠ Usuário (User é quem tem acesso ao sistema)
 */

// Labels para enums
const genderLabels: Record<Gender, string> = {
  female: "Feminino",
  male: "Masculino",
  other: "Outro",
  not_informed: "Não informado",
};

const contactTypeLabels: Record<ContactType, string> = {
  phone: "Telefone",
  email: "E-mail",
  whatsapp: "WhatsApp",
};

const addressTypeLabels: Record<AddressType, string> = {
  residential: "Residencial",
  commercial: "Comercial",
  correspondence: "Correspondência",
};

const documentTypeLabels: Record<DocumentType, string> = {
  cpf: "CPF",
  rg: "RG",
  cnh: "CNH",
  passport: "Passaporte",
  birth_certificate: "Certidão de Nascimento",
  other: "Outro",
};

type ModalMode = "view" | "edit" | "create" | null;
type ActiveTab = "dados" | "foto" | "contatos" | "enderecos" | "documentos";

export default function PersonsPage() {
  // Estado da lista
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<Gender | "">("");
  const [activeFilter, setActiveFilter] = useState<boolean | "">("");
  
  // Modal de edição/criação
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dados");
  
  // Formulário
  const [formData, setFormData] = useState<PersonCreate>({
    first_name: "",
    last_name: "",
    birth_date: "",
    gender: "not_informed",
    contacts: [],
    addresses: [],
    documents: [],
  });
  
  // Mensagens
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  /**
   * Buscar lista de pessoas do backend
   */
  const fetchPersons = useCallback(async () => {
    try {
      setLoading(true);
      
      const filters: PersonFilters = {
        page,
        page_size: pageSize,
      };
      
      if (searchTerm) {
        filters.search = searchTerm;
      }
      if (genderFilter) {
        filters.gender = genderFilter;
      }
      if (activeFilter !== "") {
        filters.is_active = activeFilter;
      }
      
      const response = await personsService.list(filters);
      setPersons(response.items as Person[]);
      setTotal(response.total);
    } catch (error: any) {
      console.error("Erro ao buscar pessoas:", error);
      setMessage({ type: "error", text: error.detail || error.message || "Erro ao carregar pessoas" });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, genderFilter, activeFilter]);

  useEffect(() => {
    fetchPersons();
  }, [fetchPersons]);

  /**
   * Abrir modal de criação
   */
  const handleCreate = () => {
    setFormData({
      first_name: "",
      last_name: "",
      birth_date: "",
      gender: "not_informed",
      contacts: [],
      addresses: [],
      documents: [],
    });
    setSelectedPerson(null);
    setActiveTab("dados");
    setModalMode("create");
  };

  /**
   * Abrir modal de visualização/edição
   */
  const handleView = async (person: Person) => {
    try {
      // Buscar pessoa com relacionamentos completos
      const fullPerson = await personsService.getById(person.id) as any;
      setSelectedPerson(fullPerson);
      setFormData({
        first_name: fullPerson.first_name,
        last_name: fullPerson.last_name || "",
        full_name: fullPerson.full_name || "",
        nickname: fullPerson.nickname || "",
        birth_date: fullPerson.birth_date || "",
        gender: fullPerson.gender,
        nationality: fullPerson.nationality || "",
        notes: fullPerson.notes || "",
      });
      setActiveTab("dados");
      setModalMode("view");
    } catch (error: any) {
      setMessage({ type: "error", text: error.detail || "Erro ao carregar pessoa" });
    }
  };

  /**
   * Salvar pessoa (criar ou atualizar)
   */
  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (!formData.first_name?.trim()) {
        setMessage({ type: "error", text: "Nome é obrigatório" });
        return;
      }
      
      if (modalMode === "create") {
        // Criar nova pessoa
        const newPerson = await personsService.create({
          ...formData,
          full_name: formData.full_name || 
            (formData.last_name ? `${formData.first_name} ${formData.last_name}` : formData.first_name),
        });
        setMessage({ type: "success", text: "Pessoa cadastrada com sucesso!" });
        setSelectedPerson(newPerson);
        setModalMode("view");
      } else if (modalMode === "edit" && selectedPerson) {
        // Atualizar pessoa existente
        const updated = await personsService.update(selectedPerson.id, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          full_name: formData.full_name || 
            (formData.last_name ? `${formData.first_name} ${formData.last_name}` : formData.first_name),
          nickname: formData.nickname,
          birth_date: formData.birth_date || undefined,
          gender: formData.gender,
          nationality: formData.nationality,
          notes: formData.notes,
        });
        setSelectedPerson(updated);
        setMessage({ type: "success", text: "Pessoa atualizada com sucesso!" });
        setModalMode("view");
      }
      
      fetchPersons();
    } catch (error: any) {
      setMessage({ type: "error", text: error.detail || error.message || "Erro ao salvar" });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Excluir pessoa
   */
  const handleDelete = async () => {
    if (!selectedPerson) return;
    
    if (!confirm("Tem certeza que deseja excluir esta pessoa? Esta ação não pode ser desfeita.")) {
      return;
    }
    
    try {
      await personsService.delete(selectedPerson.id);
      setMessage({ type: "success", text: "Pessoa excluída com sucesso!" });
      setModalMode(null);
      setSelectedPerson(null);
      fetchPersons();
    } catch (error: any) {
      setMessage({ type: "error", text: error.detail || "Erro ao excluir" });
    }
  };

  /**
   * Adicionar contato
   */
  const handleAddContact = async (contact: PersonContactCreate) => {
    if (!selectedPerson) return;
    
    try {
      // TODO: Implementar personContactsService
      // await personContactsService.create(selectedPerson.id, contact);
      // Recarregar pessoa com contatos atualizados
      const updated = await personsService.getById(selectedPerson.id);
      setSelectedPerson(updated);
      setMessage({ type: "success", text: "Contato adicionado!" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.detail || "Erro ao adicionar contato" });
    }
  };

  /**
   * Remover contato
   */
  const handleDeleteContact = async (contactId: string) => {
    if (!selectedPerson) return;
    
    try {
      // TODO: Implementar personContactsService
      // await personContactsService.delete(selectedPerson.id, contactId);
      const updated = await personsService.getById(selectedPerson.id);
      setSelectedPerson(updated);
      setMessage({ type: "success", text: "Contato removido!" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.detail || "Erro ao remover contato" });
    }
  };

  /**
   * Adicionar endereço
   */
  const handleAddAddress = async (address: PersonAddressCreate) => {
    if (!selectedPerson) return;
    
    try {
      // TODO: Implementar personAddressesService
      // await personAddressesService.create(selectedPerson.id, address);
      const updated = await personsService.getById(selectedPerson.id);
      setSelectedPerson(updated);
      setMessage({ type: "success", text: "Endereço adicionado!" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.detail || "Erro ao adicionar endereço" });
    }
  };

  /**
   * Remover endereço
   */
  const handleDeleteAddress = async (addressId: string) => {
    if (!selectedPerson) return;
    
    try {
      // TODO: Implementar personAddressesService
      // await personAddressesService.delete(selectedPerson.id, addressId);
      const updated = await personsService.getById(selectedPerson.id);
      setSelectedPerson(updated);
      setMessage({ type: "success", text: "Endereço removido!" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.detail || "Erro ao remover endereço" });
    }
  };

  /**
   * Adicionar documento
   */
  const handleAddDocument = async (doc: PersonDocumentCreate) => {
    if (!selectedPerson) return;
    
    try {
      // TODO: Implementar personDocumentsService
      // await personDocumentsService.create(selectedPerson.id, doc);
      const updated = await personsService.getById(selectedPerson.id);
      setSelectedPerson(updated);
      setMessage({ type: "success", text: "Documento adicionado!" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.detail || "Erro ao adicionar documento" });
    }
  };

  /**
   * Remover documento
   */
  const handleDeleteDocument = async (docId: string) => {
    if (!selectedPerson) return;
    
    try {
      // TODO: Implementar personDocumentsService
      // await personDocumentsService.delete(selectedPerson.id, docId);
      const updated = await personsService.getById(selectedPerson.id);
      setSelectedPerson(updated);
      setMessage({ type: "success", text: "Documento removido!" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.detail || "Erro ao remover documento" });
    }
  };

  /**
   * Upload de foto de perfil
   */
  const handlePhotoUpload = async (file: File) => {
    if (!selectedPerson) return;
    
    try {
      // TODO: Implementar personMediaService
      // await personMediaService.uploadProfilePhoto(selectedPerson.id, file);
      const updated = await personsService.getById(selectedPerson.id);
      setSelectedPerson(updated);
      setMessage({ type: "success", text: "Foto de perfil atualizada!" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.detail || "Erro ao fazer upload da foto" });
      throw error; // Re-throw para o componente de avatar saber que falhou
    }
  };

  /**
   * Remover foto de perfil
   */
  const handlePhotoRemove = async () => {
    if (!selectedPerson) return;
    
    // Encontrar a foto de perfil primária
    const profilePhoto = selectedPerson.media?.find((m: any) => m.media_type === "profile_photo" && m.is_primary
    );
    
    if (!profilePhoto) {
      setMessage({ type: "error", text: "Nenhuma foto de perfil para remover" });
      return;
    }
    
    try {
      // TODO: Implementar personMediaService
      // await personMediaService.delete(selectedPerson.id, profilePhoto.id);
      const updated = await personsService.getById(selectedPerson.id);
      setSelectedPerson(updated);
      setMessage({ type: "success", text: "Foto de perfil removida!" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.detail || "Erro ao remover foto" });
      throw error;
    }
  };

  // Formatar data para exibição
  const formatDate = (date: string | null | undefined): string => {
    if (!date) return "-";
    try {
      return new Date(date).toLocaleDateString("pt-BR");
    } catch {
      return date;
    }
  };

  // Calcular idade
  const calculateAge = (birthDate: string | null | undefined): string => {
    if (!birthDate) return "-";
    try {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return `${age} anos`;
    } catch {
      return "-";
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cadastro de Pessoas
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gerenciamento de identidades (base para usuários e atletas)
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <span>+</span>
          <span>Nova Pessoa</span>
        </button>
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <div className={`p-3 rounded-lg ${
          message.type === "success" 
            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
            : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
        }`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="float-right font-bold">×</button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
        </div>
        <div>
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as Gender | "")}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">Todos os gêneros</option>
            {Object.entries(genderLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={activeFilter === "" ? "" : activeFilter ? "true" : "false"}
            onChange={(e) => setActiveFilter(e.target.value === "" ? "" : e.target.value === "true")}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">Todos os status</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
        </div>
        <button
          onClick={() => { setSearchTerm(""); setGenderFilter(""); setActiveFilter(""); }}
          className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          Limpar filtros
        </button>
      </div>

      {/* Tabela de pessoas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Gênero
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nascimento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Idade
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Carregando...</p>
                  </td>
                </tr>
              ) : persons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Nenhuma pessoa encontrada
                  </td>
                </tr>
              ) : (
                persons.map((person) => (
                  <tr 
                    key={person.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleView(person)}
                  >
                    <td className="px-4 py-3">
                      <AvatarWithName 
                        person={person} 
                        size="sm" 
                        showNickname={!!person.nickname}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {genderLabels[person.gender]}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(person.birth_date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {calculateAge(person.birth_date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {person.primary_email || person.primary_phone || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        person.is_active 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      }`}>
                        {person.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleView(person); }}
                        className="text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300 text-sm"
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {((page - 1) * pageSize) + 1} a {Math.min(page * pageSize, total)} de {total} pessoas
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="px-3 py-1 text-sm">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de visualização/edição */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header do modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {modalMode === "create" ? "Nova Pessoa" : modalMode === "edit" ? "Editar Pessoa" : "Dados da Pessoa"}
              </h2>
              <div className="flex items-center gap-2">
                {modalMode === "view" && (
                  <button
                    onClick={() => setModalMode("edit")}
                    className="px-3 py-1.5 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded transition-colors"
                  >
                    Editar
                  </button>
                )}
                <button
                  onClick={() => { setModalMode(null); setSelectedPerson(null); }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Abas */}
            {(modalMode === "view" || modalMode === "edit") && selectedPerson && (
              <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
                {(["dados", "foto", "contatos", "enderecos", "documentos"] as ActiveTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab
                        ? "border-brand-500 text-brand-600 dark:text-brand-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    {tab === "dados" && "Dados Pessoais"}
                    {tab === "foto" && "📷 Foto"}
                    {tab === "contatos" && `Contatos (${selectedPerson.contacts?.length || 0})`}
                    {tab === "enderecos" && `Endereços (${selectedPerson.addresses?.length || 0})`}
                    {tab === "documentos" && `Documentos (${selectedPerson.documents?.length || 0})`}
                  </button>
                ))}
              </div>
            )}

            {/* Conteúdo do modal */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Aba: Dados Pessoais */}
              {(activeTab === "dados" || modalMode === "create") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData(f => ({ ...f, first_name: e.target.value }))}
                      disabled={modalMode === "view"}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sobrenome
                    </label>
                    <input
                      type="text"
                      value={formData.last_name || ""}
                      onChange={(e) => setFormData(f => ({ ...f, last_name: e.target.value }))}
                      disabled={modalMode === "view"}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Apelido
                    </label>
                    <input
                      type="text"
                      value={formData.nickname || ""}
                      onChange={(e) => setFormData(f => ({ ...f, nickname: e.target.value }))}
                      disabled={modalMode === "view"}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      value={formData.birth_date || ""}
                      onChange={(e) => setFormData(f => ({ ...f, birth_date: e.target.value }))}
                      disabled={modalMode === "view"}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Gênero
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData(f => ({ ...f, gender: e.target.value as Gender }))}
                      disabled={modalMode === "view"}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                    >
                      {Object.entries(genderLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nacionalidade
                    </label>
                    <input
                      type="text"
                      value={formData.nationality || "Brasil"}
                      onChange={(e) => setFormData(f => ({ ...f, nationality: e.target.value }))}
                      disabled={modalMode === "view"}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Observações
                    </label>
                    <textarea
                      value={formData.notes || ""}
                      onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
                      disabled={modalMode === "view"}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Aba: Foto de Perfil */}
              {activeTab === "foto" && selectedPerson && (
                <div className="flex flex-col items-center space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Foto de Perfil
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {modalMode === "edit" 
                        ? "Clique na foto para alterar ou arraste uma nova imagem"
                        : "Visualização da foto de perfil atual"
                      }
                    </p>
                  </div>
                  
                  {/* Avatar grande com upload */}
                  <PersonAvatar
                    person={selectedPerson}
                    size="xl"
                    editable={modalMode === "edit"}
                    onPhotoChange={handlePhotoUpload}
                    onPhotoRemove={handlePhotoRemove}
                  />
                  
                  {/* Informações sobre a foto atual */}
                  {selectedPerson.media?.find((m: any) => m.media_type === "profile_photo" && m.is_primary) ? (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                      <p>
                        Foto carregada em: {new Date(
                          selectedPerson.media.find((m: any) => m.media_type === "profile_photo" && m.is_primary)!.uploaded_at
                        ).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                      <p>Nenhuma foto de perfil cadastrada</p>
                      {modalMode === "edit" && (
                        <p className="mt-1 text-xs">
                          Clique no avatar acima para adicionar uma foto
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Requisitos da foto */}
                  {modalMode === "edit" && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-sm">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Requisitos da foto:
                      </h4>
                      <ul className="text-gray-500 dark:text-gray-400 space-y-1 list-disc list-inside">
                        <li>Formatos aceitos: JPG, PNG, GIF, WebP</li>
                        <li>Tamanho máximo: 5 MB</li>
                        <li>Recomendado: foto quadrada (1:1)</li>
                        <li>Resolução mínima recomendada: 200x200 pixels</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Aba: Contatos */}
              {activeTab === "contatos" && selectedPerson && (
                <div className="space-y-4">
                  {selectedPerson.contacts && selectedPerson.contacts.length > 0 ? (
                    <div className="space-y-2">
                      {selectedPerson.contacts.map((contact: any) => (
                        <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                              {contactTypeLabels[contact.contact_type as keyof typeof contactTypeLabels] || contact.contact_type}
                              {contact.is_primary && " (Principal)"}
                            </span>
                            <p className="text-sm text-gray-900 dark:text-white">{contact.contact_value}</p>
                          </div>
                          {modalMode === "edit" && (
                            <button
                              onClick={() => handleDeleteContact(contact.id)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                      Nenhum contato cadastrado
                    </p>
                  )}
                  
                  {modalMode === "edit" && (
                    <ContactForm onAdd={handleAddContact} />
                  )}
                </div>
              )}

              {/* Aba: Endereços */}
              {activeTab === "enderecos" && selectedPerson && (
                <div className="space-y-4">
                  {selectedPerson.addresses && selectedPerson.addresses.length > 0 ? (
                    <div className="space-y-2">
                      {selectedPerson.addresses.map((address: any) => (
                        <div key={address.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                              {addressTypeLabels[address.address_type as keyof typeof addressTypeLabels] || address.address_type}
                              {address.is_primary && " (Principal)"}
                            </span>
                            {modalMode === "edit" && (
                              <button
                                onClick={() => handleDeleteAddress(address.id)}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                Remover
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {[address.street, address.number].filter(Boolean).join(", ")}
                            {address.complement && ` - ${address.complement}`}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {[address.neighborhood, address.city, address.state].filter(Boolean).join(" - ")}
                          </p>
                          {address.zip_code && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              CEP: {address.zip_code}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                      Nenhum endereço cadastrado
                    </p>
                  )}
                  
                  {modalMode === "edit" && (
                    <AddressForm onAdd={handleAddAddress} />
                  )}
                </div>
              )}

              {/* Aba: Documentos */}
              {activeTab === "documentos" && selectedPerson && (
                <div className="space-y-4">
                  {selectedPerson.documents && selectedPerson.documents.length > 0 ? (
                    <div className="space-y-2">
                      {selectedPerson.documents.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                              {documentTypeLabels[doc.document_type as keyof typeof documentTypeLabels] || doc.document_type}
                            </span>
                            <p className="text-sm text-gray-900 dark:text-white font-mono">
                              {doc.document_number}
                            </p>
                            {doc.issuing_authority && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Emissor: {doc.issuing_authority}
                              </p>
                            )}
                          </div>
                          {modalMode === "edit" && (
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                      Nenhum documento cadastrado
                    </p>
                  )}
                  
                  {modalMode === "edit" && (
                    <DocumentForm onAdd={handleAddDocument} />
                  )}
                </div>
              )}
            </div>

            {/* Footer do modal */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              {modalMode === "view" && selectedPerson && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  Excluir pessoa
                </button>
              )}
              {modalMode === "edit" && (
                <button
                  onClick={() => setModalMode("view")}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancelar edição
                </button>
              )}
              {modalMode === "create" && <div />}
              
              <div className="flex gap-2">
                <button
                  onClick={() => { setModalMode(null); setSelectedPerson(null); }}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Fechar
                </button>
                {(modalMode === "edit" || modalMode === "create") && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {saving ? "Salvando..." : "Salvar"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENTES AUXILIARES PARA FORMULÁRIOS
// ============================================================================

/**
 * Formulário para adicionar contato
 */
function ContactForm({ onAdd }: { onAdd: (data: PersonContactCreate) => Promise<void> }) {
  const [contactType, setContactType] = useState<ContactType>("phone");
  const [contactValue, setContactValue] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactValue.trim()) return;
    
    setAdding(true);
    try {
      await onAdd({
        contact_type: contactType,
        contact_value: contactValue,
        is_primary: isPrimary,
      });
      setContactValue("");
      setIsPrimary(false);
    } finally {
      setAdding(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end mt-4 p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
      <div className="flex-1">
        <label className="block text-xs text-gray-500 mb-1">Tipo</label>
        <select
          value={contactType}
          onChange={(e) => setContactType(e.target.value as ContactType)}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
        >
          {Object.entries(contactTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <div className="flex-[2]">
        <label className="block text-xs text-gray-500 mb-1">Valor</label>
        <input
          type="text"
          value={contactValue}
          onChange={(e) => setContactValue(e.target.value)}
          placeholder={contactType === "email" ? "email@exemplo.com" : "(00) 00000-0000"}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
        />
      </div>
      <label className="flex items-center gap-1 text-xs">
        <input
          type="checkbox"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
        />
        Principal
      </label>
      <button
        type="submit"
        disabled={adding || !contactValue.trim()}
        className="px-3 py-1.5 text-sm bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50"
      >
        {adding ? "..." : "Adicionar"}
      </button>
    </form>
  );
}

/**
 * Formulário para adicionar endereço
 */
function AddressForm({ onAdd }: { onAdd: (data: PersonAddressCreate) => Promise<void> }) {
  const [addressType, setAddressType] = useState<AddressType>("residential");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setAdding(true);
    try {
      await onAdd({
        address_type: addressType,
        street: street || undefined,
        number: number || undefined,
        complement: complement || undefined,
        neighborhood: neighborhood || undefined,
        city: city || undefined,
        state: state || undefined,
        zip_code: zipCode || undefined,
        is_primary: isPrimary,
      });
      // Reset form
      setStreet(""); setNumber(""); setComplement(""); setNeighborhood("");
      setCity(""); setState(""); setZipCode(""); setIsPrimary(false);
      setShowForm(false);
    } finally {
      setAdding(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full py-2 text-sm text-brand-600 hover:text-brand-800 border border-dashed border-brand-300 rounded-lg"
      >
        + Adicionar endereço
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tipo</label>
          <select
            value={addressType}
            onChange={(e) => setAddressType(e.target.value as AddressType)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          >
            {Object.entries(addressTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">CEP</label>
          <input
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="00000-000"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Rua/Logradouro</label>
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Número</label>
          <input
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Complemento</label>
          <input
            type="text"
            value={complement}
            onChange={(e) => setComplement(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Bairro</label>
          <input
            type="text"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Cidade</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Estado</label>
          <input
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="UF"
            maxLength={2}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
          />
          Endereço principal
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={adding}
            className="px-3 py-1.5 text-sm bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50"
          >
            {adding ? "..." : "Adicionar"}
          </button>
        </div>
      </div>
    </form>
  );
}

/**
 * Formulário para adicionar documento
 */
function DocumentForm({ onAdd }: { onAdd: (data: PersonDocumentCreate) => Promise<void> }) {
  const [documentType, setDocumentType] = useState<DocumentType>("cpf");
  const [documentNumber, setDocumentNumber] = useState("");
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [adding, setAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentNumber.trim()) return;
    
    setAdding(true);
    try {
      await onAdd({
        document_type: documentType,
        document_number: documentNumber,
        issuing_authority: issuingAuthority || undefined,
      });
      setDocumentNumber("");
      setIssuingAuthority("");
    } finally {
      setAdding(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end mt-4 p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
      <div className="flex-1">
        <label className="block text-xs text-gray-500 mb-1">Tipo</label>
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value as DocumentType)}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
        >
          {Object.entries(documentTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <div className="flex-[2]">
        <label className="block text-xs text-gray-500 mb-1">Número</label>
        <input
          type="text"
          value={documentNumber}
          onChange={(e) => setDocumentNumber(e.target.value)}
          placeholder={documentType === "cpf" ? "000.000.000-00" : "Número do documento"}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
        />
      </div>
      <div className="flex-1">
        <label className="block text-xs text-gray-500 mb-1">Emissor</label>
        <input
          type="text"
          value={issuingAuthority}
          onChange={(e) => setIssuingAuthority(e.target.value)}
          placeholder="SSP/UF"
          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
        />
      </div>
      <button
        type="submit"
        disabled={adding || !documentNumber.trim()}
        className="px-3 py-1.5 text-sm bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50"
      >
        {adding ? "..." : "Adicionar"}
      </button>
    </form>
  );
}






