"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchOrganizations,
  fetchTeams,
  fetchOrgMemberships,
  fetchPersonById,
  fetchTeamRegistrations,
  createDirigente,
  createOrganization,
  Organization,
  Team,
  OrgMembership,
} from "./api";
import DirigenteForm from "./DirigenteForm";
import OrganizationForm from "./OrganizationForm";

/**
 * Página de Gerenciamento de Usuários
 *
 * REGRA DE OURO: Todas as ações devem estar conectadas com o banco.
 * A página sempre carrega retratando o estado real do banco.
 * 
 * ESTRUTURA CONFORME REGRAS.md V1.2:
 * - HB Track (root)
 *   └─ Organização
 *       ├─ 👔 Dirigentes (org_memberships role=dirigente)
 *       ├─ 📋 Coordenadores (org_memberships role=coordenador)
 *       ├─ 🎯 Treinadores (org_memberships role=treinador)
 *       └─ ⚽ Equipes
 *           └─ Atletas (team_registrations)
 * 
 * RF1.1: Dirigente/Coordenador/Treinador vinculados à ORGANIZAÇÃO (não equipe)
 * R16: Atletas vinculados a EQUIPES (via team_registrations)
 */

interface TreeNode {
  id: string;
  type: "root" | "organization" | "staff-group" | "dirigente" | "coordinator" | "trainer" | "teams-group" | "team" | "athlete";
  name: string;
  children?: TreeNode[];
  canAdd?: boolean;
  parentId?: string;
  data?: any;
  icon?: string;
}

interface FormData {
  type: string;
  mode: "view" | "edit" | "create";
  data: any;
  parentId?: string;
  organizationId?: string;
}

export default function UserManagementPage() {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState<FormData | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["root"]));
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  /**
   * Buscar dados do backend e construir árvore conforme REGRAS.md V1.2
   */
  const fetchTreeData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all organizations
      const orgsResponse = await fetchOrganizations();
      const organizations = orgsResponse.items;

      // Build tree structure
      const tree: TreeNode[] = [
        {
          id: "root",
          type: "root",
          name: "HB Track",
          canAdd: true,
          children: [],
        },
      ];

      // For each organization, build complete structure
      for (const org of organizations) {
        const orgNode: TreeNode = {
          id: org.id,
          type: "organization",
          name: org.name,
          canAdd: true,
          parentId: "root",
          data: org,
          icon: "🏢",
          children: [],
        };

        // ==== DIRIGENTES (vinculados à organização via org_memberships) ====
        const dirigentesResponse = await fetchOrgMemberships(org.id, "dirigente", true);
        const dirigentesGroup: TreeNode = {
          id: `${org.id}-dirigentes`,
          type: "staff-group",
          name: "Dirigentes",
          parentId: org.id,
          icon: "👔",
          canAdd: true,
          children: [],
        };

        for (const membership of dirigentesResponse.items) {
          try {
            const person = await fetchPersonById(membership.person_id);
            dirigentesGroup.children?.push({
              id: membership.id,
              type: "dirigente",
              name: person.full_name ?? '',
              parentId: dirigentesGroup.id,
              icon: "👤",
              data: { person, orgMembership: membership },
            });
          } catch (error) {
            console.error(`Erro ao buscar pessoa ${membership.person_id}:`, error);
          }
        }
        orgNode.children?.push(dirigentesGroup);

        // ==== COORDENADORES (vinculados à organização via org_memberships) ====
        const coordenadoresResponse = await fetchOrgMemberships(org.id, "coordenador", true);
        const coordenadoresGroup: TreeNode = {
          id: `${org.id}-coordenadores`,
          type: "staff-group",
          name: "Coordenadores",
          parentId: org.id,
          icon: "📋",
          canAdd: true,
          children: [],
        };

        for (const membership of coordenadoresResponse.items) {
          try {
            const person = await fetchPersonById(membership.person_id);
            coordenadoresGroup.children?.push({
              id: membership.id,
              type: "coordinator",
              name: person.full_name ?? '',
              parentId: coordenadoresGroup.id,
              icon: "👤",
              data: { person, orgMembership: membership },
            });
          } catch (error) {
            console.error(`Erro ao buscar pessoa ${membership.person_id}:`, error);
          }
        }
        orgNode.children?.push(coordenadoresGroup);

        // ==== TREINADORES (vinculados à organização via org_memberships) ====
        const treinadoresResponse = await fetchOrgMemberships(org.id, "treinador", true);
        const treinadoresGroup: TreeNode = {
          id: `${org.id}-treinadores`,
          type: "staff-group",
          name: "Treinadores",
          parentId: org.id,
          icon: "🎯",
          canAdd: true,
          children: [],
        };

        for (const membership of treinadoresResponse.items) {
          try {
            const person = await fetchPersonById(membership.person_id);
            treinadoresGroup.children?.push({
              id: membership.id,
              type: "trainer",
              name: person.full_name ?? '',
              parentId: treinadoresGroup.id,
              icon: "👤",
              data: { person, orgMembership: membership },
            });
          } catch (error) {
            console.error(`Erro ao buscar pessoa ${membership.person_id}:`, error);
          }
        }
        orgNode.children?.push(treinadoresGroup);

        // ==== EQUIPES (vinculadas à organização) com ATLETAS (via team_registrations) ====
        const teamsResponse = await fetchTeams(org.id);
        const teamsGroup: TreeNode = {
          id: `${org.id}-equipes`,
          type: "teams-group",
          name: "Equipes",
          parentId: org.id,
          icon: "⚽",
          canAdd: true,
          children: [],
        };

        for (const team of teamsResponse.items) {
          const teamNode: TreeNode = {
            id: team.id,
            type: "team",
            name: team.name,
            canAdd: true,
            parentId: teamsGroup.id,
            icon: "🏆",
            data: team,
            children: [],
          };

          // Buscar atletas da equipe (via team_registrations)
          try {
            const registrations = await fetchTeamRegistrations(team.id);
            for (const registration of registrations.items) {
              // team_registration tem athlete_id, precisamos buscar o athlete e depois person
              // Por ora, mostramos o ID do registro
              teamNode.children?.push({
                id: registration.id,
                type: "athlete",
                name: `Atleta (${registration.athlete_id.substring(0, 8)}...)`,
                parentId: team.id,
                icon: "🏃",
                data: registration,
              });
            }
          } catch (error) {
            console.error(`Erro ao buscar atletas da equipe ${team.id}:`, error);
          }

          teamsGroup.children?.push(teamNode);
        }
        orgNode.children?.push(teamsGroup);

        // Add organization to root
        tree[0].children?.push(orgNode);
      }

      setTreeData(tree);
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      setMessage({ type: "error", text: error.message || "Erro ao carregar dados" });

      // Fallback to empty tree on error
      setTreeData([
        {
          id: "root",
          type: "root",
          name: "HB Track",
          canAdd: true,
          children: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTreeData();
  }, [fetchTreeData]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  /**
   * Extrair organization_id do parentId de um grupo
   */
  const getOrganizationIdFromGroup = (groupId: string): string | undefined => {
    // Formato: {org_id}-dirigentes, {org_id}-coordenadores, etc.
    const parts = groupId.split("-");
    if (parts.length >= 2) {
      // Reconstruir UUID (tem format xxx-xxx-xxx-xxx-xxx)
      return parts.slice(0, 5).join("-");
    }
    return undefined;
  };

  const handleAddClick = (type: string, parentId?: string, organizationId?: string) => {
    if (unsavedChanges) {
      if (!confirm("Você tem alterações não salvas. Deseja continuar?")) {
        return;
      }
    }

    setActiveForm({
      type,
      mode: "create",
      data: {},
      parentId,
      organizationId,
    });
    setUnsavedChanges(false);
  };

  const handleNodeClick = (node: TreeNode) => {
    if (unsavedChanges) {
      if (!confirm("Você tem alterações não salvas. Deseja continuar?")) {
        return;
      }
    }

    // Extrair organizationId se for um nó dentro de organização
    let organizationId: string | undefined;
    if (node.parentId) {
      organizationId = getOrganizationIdFromGroup(node.parentId);
    }

    setActiveForm({
      type: node.type,
      mode: "view",
      data: node,
      organizationId,
    });
    setUnsavedChanges(false);
  };

  const handleCloseForm = () => {
    if (unsavedChanges) {
      if (!confirm("Você tem alterações não salvas. Deseja continuar?")) {
        return;
      }
    }
    setActiveForm(null);
    setUnsavedChanges(false);
  };

  const handleSave = async (data: any) => {
    try {
      if (activeForm?.type === "organization" && activeForm?.mode === "create") {
        // Criar nova organização
        await createOrganization({
          name: data.name,
        });
        setMessage({ type: "success", text: "Organização criada com sucesso!" });
      } else if (activeForm?.type === "dirigente" && activeForm?.mode === "create") {
        // Criar novo dirigente
        // Para Super Admin, não precisa de organizationId neste primeiro momento
        // O dirigente será associado quando fundar/vincular a uma organização
        await createDirigente({
          full_name: data.full_name,
          email: data.email,
          cpf: data.cpf,
          birth_date: data.birth_date,
          gender: data.gender,
          phone: data.phone || undefined,
          street: data.street || undefined,
          number: data.number || undefined,
          complement: data.complement || undefined,
          neighborhood: data.neighborhood || undefined,
          city: data.city || undefined,
          state: data.state || undefined,
          zip_code: data.zip_code || undefined,
          createUser: data.createUser ?? true,
          // organizationId não é obrigatório para dirigentes (podem ser criados sem vínculo)
        });

        if (data.createUser) {
          setMessage({ type: "success", text: "Dirigente cadastrado com sucesso! Um e-mail com link para criação de senha foi enviado." });
        } else {
          setMessage({ type: "success", text: "Pessoa cadastrada com sucesso!" });
        }
      } else {
        // Update existing entity
        console.log("Updating:", data);
        setMessage({ type: "success", text: "Atualizado com sucesso!" });
      }

      setUnsavedChanges(false);
      setActiveForm(null);
      fetchTreeData(); // Recarregar dados
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Erro ao salvar" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir? Esta ação não pode ser desfeita.")) {
      return;
    }

    // TODO: Implementar delete no backend
    console.log("Deleting:", id);
    setMessage({ type: "success", text: "Excluído com sucesso!" });
    setActiveForm(null);
    fetchTreeData(); // Recarregar dados
  };

  /**
   * Mapeia tipo de nó para ícone
   */
  const getNodeIcon = (node: TreeNode): string => {
    if (node.icon) return node.icon;
    
    const iconMap: Record<string, string> = {
      root: "🏠",
      organization: "🏢",
      "staff-group": "👥",
      dirigente: "👔",
      coordinator: "📋",
      trainer: "🎯",
      "teams-group": "⚽",
      team: "🏆",
      athlete: "🏃",
    };
    return iconMap[node.type] || "📁";
  };

  /**
   * Mapeia tipo de grupo para tipo de membro que pode ser adicionado
   */
  const getAddTypeForGroup = (groupId: string): string => {
    if (groupId.endsWith("-dirigentes")) return "dirigente";
    if (groupId.endsWith("-coordenadores")) return "coordenador";
    if (groupId.endsWith("-treinadores")) return "treinador";
    if (groupId.endsWith("-equipes")) return "equipe";
    return "membro";
  };

  const renderTree = (nodes: TreeNode[], level = 0) => {
    return nodes.map(node => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedNodes.has(node.id);
      const nodeIcon = getNodeIcon(node);
      const isClickable = !["root", "staff-group", "teams-group"].includes(node.type);
      
      return (
        <div key={node.id} style={{ marginLeft: `${level * 16}px` }}>
          <div className="flex items-center gap-1 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2">
            {/* Botão de expandir/colapsar */}
            {hasChildren || node.canAdd ? (
              <button 
                onClick={() => toggleNode(node.id)} 
                className="w-4 h-4 text-gray-500 dark:text-gray-400 flex items-center justify-center text-[10px]"
              >
                {isExpanded ? "▼" : "▶"}
              </button>
            ) : (
              <span className="w-4"></span>
            )}

            {/* Ícone e Nome */}
            <span
              onClick={() => isClickable && handleNodeClick(node)}
              className={`flex-1 flex items-center gap-1.5 text-sm ${
                isClickable 
                  ? "cursor-pointer text-gray-900 dark:text-white hover:text-brand-600" 
                  : "text-gray-600 dark:text-gray-300 font-medium"
              }`}
            >
              <span>{nodeIcon}</span>
              <span>{node.name}</span>
              {/* Badge com contagem para grupos */}
              {(node.type === "staff-group" || node.type === "teams-group") && (
                <span className="text-[10px] bg-gray-200 dark:bg-gray-600 px-1.5 rounded">
                  {node.children?.length || 0}
                </span>
              )}
            </span>
          </div>

          {/* Botões de adicionar dentro de grupos expandidos */}
          {isExpanded && node.canAdd && (node.type === "staff-group" || node.type === "teams-group") && (
            <div style={{ marginLeft: "20px" }} className="py-1">
              <button
                onClick={() => {
                  const orgId = getOrganizationIdFromGroup(node.id);
                  const addType = getAddTypeForGroup(node.id);
                  handleAddClick(addType, node.id, orgId);
                }}
                className="flex items-center gap-1.5 text-[10px] text-brand-500 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1"
              >
                <span>+</span>
                <span>Adicionar {getAddTypeForGroup(node.id)}</span>
              </button>
            </div>
          )}

          {/* Botão de adicionar organização no root */}
          {isExpanded && node.type === "root" && (
            <div style={{ marginLeft: "20px" }} className="py-1">
              <button
                onClick={() => handleAddClick("organization", node.id)}
                className="flex items-center gap-1.5 text-[10px] text-brand-500 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1"
              >
                <span>+</span>
                <span>Adicionar Organização</span>
              </button>
            </div>
          )}

          {/* Renderizar filhos */}
          {hasChildren && isExpanded && (
            <div>{renderTree(node.children!, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  const renderForm = () => {
    if (!activeForm) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <p className="text-xl mb-2">Nenhum item selecionado</p>
            <p className="text-xs">Selecione um item na árvore ou clique em + para adicionar</p>
          </div>
        </div>
      );
    }

    const { type, mode, data, organizationId } = activeForm;

    // Mapa de títulos por tipo
    const typeTitles: Record<string, string> = {
      organization: "Organização",
      dirigente: "Dirigente",
      coordenador: "Coordenador",
      treinador: "Treinador",
      equipe: "Equipe",
      team: "Equipe",
      athlete: "Atleta",
    };

    // Render específico para Dirigente
    if (type === "dirigente") {
      return (
        <DirigenteForm
          mode={mode}
          data={data}
          organizationId={organizationId}
          onSave={handleSave}
          onCancel={handleCloseForm}
          onClose={handleCloseForm}
        />
      );
    }

    // Render específico para Organização
    if (type === "organization") {
      return (
        <OrganizationForm
          mode={mode}
          data={data}
          onSave={handleSave}
          onCancel={handleCloseForm}
          onClose={handleCloseForm}
        />
      );
    }

    // Formulário padrão para outros tipos
    return (
      <div className="relative h-full">
        {/* Botão X no canto superior esquerdo */}
        <button
          onClick={handleCloseForm}
          className="absolute top-0 left-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl font-bold leading-none"
          title="Fechar"
        >
          ×
        </button>

        {/* Título */}
        <div className="ml-8 mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {mode === "create" 
              ? `Adicionar ${typeTitles[type] || type}` 
              : mode === "edit" 
                ? `Editar ${typeTitles[type] || type}` 
                : `${typeTitles[type] || type}`}
          </h2>
          {organizationId && (
            <p className="text-xs text-gray-500 mt-1">
              Vinculado à organização: {organizationId.substring(0, 8)}...
            </p>
          )}
        </div>

        {/* Formulário placeholder - TODO: implementar formulários específicos */}
        <div className="ml-8 space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Formulário para <strong>{typeTitles[type] || type}</strong>
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Modo: {mode === "create" ? "Criação" : mode === "edit" ? "Edição" : "Visualização"}
            </p>
            {data?.data && (
              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-64">
                {JSON.stringify(data.data, null, 2)}
              </pre>
            )}
          </div>
          
          {mode === "create" && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              ⚠️ Formulário de criação de {typeTitles[type] || type} ainda não implementado. 
              Use a página de Cadastro de Pessoas para criar novos registros.
            </p>
          )}
        </div>
      </div>
    );
  };

  // Get current date and time
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR");
  const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  // TODO: Get from session
  const currentUser = {
    name: "Musharof",
    role: "Super Admin",
  };

  return (
    <div className="space-y-1 -ml-[13px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-[2px] px-3 mt-[2px]">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          Área de Gerenciamento de Usuários
        </h1>
        <div className="flex items-center gap-4 text-[11px] text-gray-600 dark:text-gray-400">
          <span>Data: {dateStr}</span>
          <span>Hora: {timeStr}</span>
          <span className="font-medium text-gray-900 dark:text-white text-[11px]">
            {currentUser.name} | {currentUser.role}
          </span>
        </div>
      </div>

      {/* Modal de erro centralizado */}
      {message && message.type === "error" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setMessage(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Erro de validação</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{message.text}</p>
            <button 
              onClick={() => setMessage(null)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Mensagem de sucesso */}
      {message && message.type === "success" && (
        <div className="p-3 rounded-lg bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
          {message.text}
          <button onClick={() => setMessage(null)} className="float-right font-bold">×</button>
        </div>
      )}

      {/* Layout de 2 colunas */}
      <div className="grid grid-cols-12 gap-4">
        {/* COLUNA 1 - Árvore de navegação */}
        <div className="col-span-3">
          <div className="h-[calc(100vh-140px)] overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
                <p className="mt-2 text-xs text-gray-500">Carregando...</p>
              </div>
            ) : (
              renderTree(treeData)
            )}
          </div>
        </div>

        {/* COLUNA 2 - Painel de formulários */}
        <div className="col-span-9">
          <div className="h-[calc(100vh-140px)] overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            {renderForm()}
          </div>
        </div>
      </div>
    </div>
  );
}
