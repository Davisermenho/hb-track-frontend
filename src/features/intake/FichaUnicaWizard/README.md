# FichaUnicaWizard - Ficha Única de Cadastro

## 📋 Visão Geral

Este é o **componente CANÔNICO** de cadastro do sistema HB Track. Implementa o fluxo completo de cadastro integrado.

## 🎯 Propósito

A Ficha Única permite o cadastro completo e integrado de:
- **Pessoa** (dados pessoais, contatos, documentos, endereço)
- **Usuário** (acesso ao sistema - opcional)
- **Temporada** (create ou select - opcional)
- **Organização** (create ou select)
- **Equipe** (create ou select)
- **Atleta** (dados esportivos - opcional)
- **Vínculo** (team_registration - opcional)

## 🏗️ Arquitetura

```
FichaUnicaWizard/
├── index.tsx                   # Componente principal (wizard container)
├── FichaUnicaWizard.tsx        # (vazio - pode ser removido)
├── types.ts                    # Schemas Zod + TypeScript types
├── hooks/
│   └── useFichaUnicaForm.ts   # Lógica do formulário + react-query
├── steps/
│   ├── StepPerson.tsx         # Etapa 1: Dados da pessoa
│   ├── StepAccess.tsx         # Etapa 2: Acesso ao sistema
│   ├── StepSeason.tsx         # Etapa 3: Temporada
│   ├── StepOrganization.tsx   # Etapa 4: Organização
│   ├── StepTeam.tsx           # Etapa 5: Equipe
│   ├── StepAthlete.tsx        # Etapa 6: Atleta
│   └── StepReview.tsx         # Etapa 7: Revisão final
└── components/
    ├── StepIndicator.tsx      # Indicador de progresso
    ├── ErrorSummary.tsx       # Sumário de erros
    ├── FormField.tsx          # Campo de formulário reutilizável
    ├── MaskedInput.tsx        # Input com máscara (CPF, telefone, etc)
    ├── PhotoUpload.tsx        # Upload de foto de perfil
    ├── RoleSelect.tsx         # Seletor de papel (role_id)
    └── Autocomplete.tsx       # Autocomplete genérico
```

## 🔑 Features Principais

### 1. Validação Progressiva
- Cada etapa tem seu próprio schema Zod
- Validação em tempo real
- Feedback visual de erros
- Sumário de erros no topo

### 2. Idempotência
- Gera `idempotencyKey` único (UUID)
- Enviado no header `Idempotency-Key`
- Previne duplicatas em caso de retry
- Exibido ao usuário (8 primeiros caracteres)

### 3. Autosave
- Salva rascunho no localStorage automaticamente
- Restaura dados ao reabrir página
- Botão "Limpar Rascunho" para recomeçar

### 4. Dry Run
- Botão "Validar Dados" na última etapa
- Envia `?validate_only=true` para API
- Valida sem gravar no banco
- Exibe erros antes do submit final

### 5. Responsividade
- Layout adaptativo mobile/desktop
- Navegação otimizada para mobile
- Botões reposicionados em telas pequenas

## 📡 Integração com API

### Endpoint
```
POST /api/v1/intake/ficha-unica
Headers:
  - Idempotency-Key: <uuid>
  - Content-Type: application/json
Query Params:
  - validate_only: boolean (opcional)
```

### Payload
```typescript
interface FichaUnicaPayload {
  person: PersonData;
  create_user: boolean;
  user?: UserData;
  season?: SeasonData;
  organization: OrganizationData;
  membership?: MembershipData;
  team?: TeamData;
  athlete?: AthleteData;
  registration?: RegistrationData;
}
```

### Response
```typescript
interface FichaUnicaResponse {
  id: string;
  person_id: string;
  user_id?: string;
  organization_id: string;
  team_id?: string;
  athlete_id?: string;
  registration_id?: string;
  message: string;
}
```

## 🎨 Uso

### Básico
```tsx
import { FichaUnicaWizard } from '@/features/intake/FichaUnicaWizard';

export default function CadastroPage() {
  return <FichaUnicaWizard />;
}
```

### Com callbacks
```tsx
<FichaUnicaWizard
  onSuccess={(response) => {
    console.log('Cadastro criado:', response);
    router.push(`/atletas/${response.athlete_id}`);
  }}
  onCancel={() => {
    router.push('/dashboard');
  }}
/>
```

## 🔧 Customização

### Adicionar nova etapa
1. Criar arquivo em `steps/StepNomeEtapa.tsx`
2. Adicionar ao array `stepComponents` em `index.tsx`
3. Adicionar metadados em `WIZARD_STEPS` em `types.ts`
4. Atualizar schema Zod se necessário

### Validações customizadas
Edite os schemas em `types.ts`:
```typescript
const cpfSchema = z.string()
  .min(14, 'CPF inválido')
  .refine(validateCPF, 'CPF inválido');
```

## ⚠️ Observações Importantes

### Erro de Hidratação
O `idempotencyKey` é gerado com `crypto.randomUUID()` e pode causar erro de hidratação React. A solução implementada usa `useState` + `useEffect` para renderizar apenas no cliente:

```tsx
const [isMounted, setIsMounted] = useState(false);

useEffect(() => {
  setIsMounted(true);
}, []);

// Renderizar apenas se montado
{isMounted && <div>{idempotencyKey.slice(0, 8)}</div>}
```

### Autosave
O autosave usa `localStorage` com a chave `ficha_unica_draft`. Dados sensíveis não são salvos (senha, tokens).

### Permissões
O wizard valida permissões no backend. O frontend apenas exibe os campos, a validação de autorização é server-side.

## 📚 Referências

- **Backend**: `FICHA.MD` - Especificação completa da ficha única
- **RAG**: `RAG.json` - Regras de negócio e validações
- **API**: `app/api/v1/routers/intake.py` - Endpoint de criação
- **Service**: `app/services/intake/ficha_unica_service.py` - Lógica de negócio
- **Validações**: `app/services/intake/validators.py` - Validações de autorização

## 🚀 Melhorias Futuras

- [ ] Upload de múltiplas fotos (documentos)
- [ ] Assinatura digital
- [ ] Histórico de alterações
- [ ] Modo offline com sincronização
- [ ] Exportar ficha em PDF
- [ ] Importar dados de planilha Excel
- [ ] Templates de ficha por organização
- [ ] Validação de dados com APIs externas (CEP, CPF)

## 📝 Changelog

### v1.0.0 (2026-01-03)
- ✅ Implementação inicial com 7 etapas
- ✅ Validação Zod completa
- ✅ Idempotência
- ✅ Autosave
- ✅ Dry run
- ✅ Correção de erro de hidratação
- ✅ Documentação completa
