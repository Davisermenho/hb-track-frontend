# Design System - HB Track

Sistema de design unificado para garantir consistência visual e semântica em toda a aplicação.

## 📦 Estrutura

```
src/design-system/
├── icons.ts          # Sistema de ícones semânticos (Phosphor Icons)
├── README.md         # Esta documentação
└── [futuros]         # colors.ts, typography.ts, spacing.ts, etc.
```

## 🎨 Sistema de Ícones

### Filosofia

O design system usa **Phosphor Icons** para o módulo Training (migração gradual), enquanto mantém compatibilidade com SVG legado para outros módulos.

### Importação

```tsx
import { Icons } from '@/design-system/icons';

// Uso direto
<Icons.Status.Success size={24} weight="bold" />

// Uso via adapter
import { getIcon } from '@/design-system/icons';
const Icon = getIcon('Training.Wellness.Sleep', 'training');
<Icon size={20} color="blue" />
```

### Categorias Disponíveis

#### 🧭 Navigation
- `Left`, `Right`, `Down`, `Up` - Setas direcionais
- `Arrow` - Seta genérica

#### ✅ Status
- `Success` - Sucesso (CheckCircle)
- `Warning` - Aviso (Warning)
- `Error` - Erro (XCircle)
- `Info` - Informação (Info)
- `Check` - Confirmação
- `Close` - Fechar

#### ⚡ Actions
- `Add`, `Edit`, `Delete`, `Copy`
- `View`, `Download`, `Upload`
- `Save`, `Search`

#### 🏀 Training
- `Exercise` - Exercício (Dumbbell)
- `Session` - Sessão (Basketball)
- `Physical` - Físico (Heartbeat)
- `Target`, `Performance`, `Decline`

##### Wellness (subcategoria)
- `Sleep` - Sono (Moon)
- `Fatigue` - Fadiga (Lightning)
- `Stress` - Estresse (Heart)
- `Pain` - Dor (Fire)

#### 🔒 Security
- `Lock`, `Shield`

#### 🏥 Medical
- `Medical` - Ícone médico (FirstAid)

#### 📊 Charts
- `Bar` - Gráfico de barras
- `Line` - Gráfico de linha

#### 📄 Files
- `PDF` - Arquivo PDF

#### 🎯 UI
- `More`, `Star`, `Loading`
- `Lightbulb`, `CheckSquare`, `ListChecks`
- `User`, `Users`
- `Trophy`, `Medal`, `Crown` - Gamificação
- `Bell`, `BellRinging` - Notificações
- `Database`, `Calendar`, `Countdown`
- `Sliders` - Controles

### Props Padrão

Todos os ícones suportam as props do Phosphor Icons:

```tsx
interface DesignSystemIconProps {
  size?: number | string;    // Tamanho (default: 24)
  color?: string;            // Cor (default: "currentColor")
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  mirrored?: boolean;        // Espelhar horizontalmente
  className?: string;        // Classes CSS adicionais
}
```

### Exemplos de Uso

#### Wellness Form (Atleta)

```tsx
import { Icons } from '@/design-system/icons';

function WellnessPreForm() {
  return (
    <div>
      <div>
        <Icons.Training.Wellness.Sleep size={20} />
        <label>Qualidade do Sono</label>
        <input type="range" min="0" max="10" />
      </div>
      
      <div>
        <Icons.Training.Wellness.Fatigue size={20} />
        <label>Fadiga</label>
        <input type="range" min="0" max="10" />
      </div>
      
      <button>
        <Icons.Actions.Save size={18} />
        Salvar Wellness
      </button>
    </div>
  );
}
```

#### Status Dashboard (Treinador)

```tsx
import { Icons } from '@/design-system/icons';

function WellnessStatusDashboard({ athletes }) {
  return (
    <div>
      {athletes.map(athlete => (
        <div key={athlete.id}>
          <span>{athlete.name}</span>
          {athlete.respondedBoth ? (
            <Icons.UI.CheckSquare color="green" weight="fill" />
          ) : athlete.respondedPre ? (
            <Icons.Status.Warning color="yellow" weight="fill" />
          ) : (
            <Icons.Status.Error color="red" />
          )}
          {athlete.hasBadge && (
            <Icons.UI.Medal color="gold" size={16} />
          )}
        </div>
      ))}
    </div>
  );
}
```

#### Notificações (Header)

```tsx
import { Icons } from '@/design-system/icons';

function NotificationBell({ unreadCount }) {
  return (
    <button>
      {unreadCount > 0 ? (
        <Icons.UI.BellRinging size={24} weight="fill" />
      ) : (
        <Icons.UI.Bell size={24} />
      )}
      {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
    </button>
  );
}
```

### Migração de SVG para Phosphor

**Status atual:** Apenas módulo Training usa Phosphor Icons.

**Roadmap:**
1. ✅ Training module (Step 1)
2. ⏳ Matches module (futuro)
3. ⏳ Athletes module (futuro)
4. ⏳ Admin module (futuro)

Para adicionar um novo ícone ao design system:

1. Importar do Phosphor: `import { NewIcon } from '@phosphor-icons/react';`
2. Adicionar ao objeto `Icons` na categoria apropriada
3. Documentar neste README
4. Criar exemplo de uso

### Feature Flag

O adapter `getIcon()` usa feature flag por módulo:

```tsx
// Módulo training: usa Phosphor ✅
const Icon = getIcon('Training.Session', 'training');

// Outros módulos: fallback SVG ⚠️
const Icon = getIcon('Actions.Edit', 'matches'); // Warning no console
```

### Tree-shaking

O Phosphor Icons suporta tree-shaking automático. Apenas os ícones importados serão incluídos no bundle final.

### Acessibilidade

Sempre adicione `aria-label` quando o ícone for o único conteúdo de um botão:

```tsx
<button aria-label="Salvar wellness">
  <Icons.Actions.Save size={20} />
</button>
```

Para ícones decorativos (acompanhados de texto):

```tsx
<button>
  <Icons.Actions.Save size={18} />
  <span>Salvar</span>
</button>
```

## 🚀 Próximos Passos

- [ ] Criar `colors.ts` - Sistema de cores semânticas
- [ ] Criar `typography.ts` - Tipografia e hierarquia
- [ ] Criar `spacing.ts` - Sistema de espaçamento
- [ ] Criar `components/` - Componentes base reutilizáveis
- [ ] Criar Storybook para documentação visual

## 📚 Referências

- [Phosphor Icons - React](https://phosphoricons.com/)
- [Design System Best Practices](https://www.designsystems.com/)
- [Accessibility Guidelines - WCAG 2.1 AA](https://www.w3.org/WAI/WCAG21/quickref/)
