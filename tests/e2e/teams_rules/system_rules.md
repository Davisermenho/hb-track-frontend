# REGRAS DO SISTEMA (V1)

## Sumário

- [0. Changelog V1.1 → V1.2](#0-changelog-v11--v12)
- [1. Regras Estruturais](#1-regras-estruturais)
- [2. Regras Operacionais - V1.2](#2-regras-operacionais---v12)
- [2.X Regras Operacionais - Casos Especiais, UX e Edge Cases](#2x-regras-operacionais---casos-especiais-ux-e-edge-cases)
- [3. Regras de Domínio Esportivo - V1.2](#3-regras-de-dominio-esportivo---v12)
- [4. Visibilidade do Perfil Atleta](#4-visibilidade-do-perfil-atleta)
- [5. Regras de Participação da Atleta - V1.2](#5-regras-de-participacao-da-atleta---v12)
- [6. Regras de Configuração do Banco - V1.2](#6-regras-de-configuracao-do-banco---v12)
- [7. Organização das Regras por Camada de Configuração](#7-organizacao-das-regras-por-camada-de-configuracao)

---


## 1. Regras Estruturais

### R1. Pessoa
Pessoa representa o indivíduo real e é independente de função esportiva.

### R2. Usuário
Usuário representa acesso ao sistema. Apenas o Super Administrador pode existir sem vínculo organizacional.

**V1.2 Atualização:** Atletas podem existir sem usuário (sem login). Criação de usuário para atleta é opcional, definida por checkbox "Criar acesso ao sistema" no cadastro.

### R3. Super Administrador
Existe exatamente um Super Administrador estrutural, vitalício, imutável e não removível. Possui autoridade máxima sobre **todos os clubes** e pode ignorar travas operacionais; toda ação crítica é auditada.

### R4. Papéis do sistema
Papéis organizacionais válidos: Dirigente, Coordenador, Treinador, Atleta.

### R5. Papéis não acumuláveis
Uma pessoa não pode ter múltiplos papéis ativos simultaneamente. Mudanças de papel exigem encerramento de vínculo e criação de novo, sem sobreposição temporal.

### R6. Vínculo organizacional
- **Staff (Dirigente/Coordenador/Treinador):** Vínculo entre pessoa + papel + organização (via `org_memberships`), sem vínculo com temporada.
- **Atleta:** Vínculo esportivo com equipes (via `team_registrations`), sem vínculo direto com organização ou temporada.
- **Temporada:** Representa período de competição específico de uma equipe (ex: "Campeonato Estadual 2024" da equipe "Cadete Feminino").

### R7. Vínculo ativo e exclusividade
- **Staff (Dirigente/Coordenador/Treinador):** Uma pessoa possui apenas um vínculo ativo por organização (via `org_memberships`).
- **Atleta:** Pode ter múltiplos `team_registrations` ativos simultâneos em equipes diferentes **da mesma organização**, permitindo jogar em categorias superiores ou participar de desenvolvimento em múltiplas equipes.

**IMPORTANTE:** Atleta **NÃO pode ter vínculos simultâneos em organizações diferentes**. Vínculo é exclusivo por organização (evita conflitos regulatórios/jurídicos do handebol).

### R8. Temporada por equipe
Temporadas representam períodos de competição específicos de uma equipe.
- Estrutura: `seasons` (id, team_id, name, year, competition_type, start_date, end_date, canceled_at, interrupted_at).
- Exemplo: Equipe "Cadete Masculino" participa de:
  - "Campeonato Estadual 2024" (Jan-Abr)
  - "Copa Regional 2024" (Mai-Jun)
  - "Amistosos 2024" (Ano todo)

### R8.1. Múltiplas temporadas simultâneas
Uma equipe pode participar de múltiplas competições (temporadas) simultaneamente.

### R9. Encerramento de vínculo
- **Staff:** Encerramento manual de `org_membership`, solicitado pelo usuário e validado pelo Dirigente.
- **Atleta:** Encerramento manual de `team_registration`, solicitado por Coordenador/Treinador.
- Encerramento automático não ocorre (sem virada de temporada para vínculos).

### R10. Histórico imutável
Vínculos encerrados jamais são apagados ou alterados retroativamente.

### R11. Atleta como papel permanente
Atleta é papel permanente no histórico: uma pessoa nunca deixa de ser atleta no histórico, embora não possa acumular papéis simultaneamente.

### R12. Estados operacionais da atleta
**Estado base único (enum):**
- `ativa`: operacional e disponível.
- `dispensada`: não participa mais da equipe; encerra todos os `team_registrations` ativos.
- `arquivada`: registro histórico; sem participação operacional.

**Flags de restrição (camadas adicionais, independentes):**
- `injured` (boolean): Lesionada; NÃO pode treinar nem jogar; afastamento total.
- `medical_restriction` (boolean): Impedimento médico; pode treinar/jogar com limitações (movimentos restritos).
- `suspended_until` (date): Suspensa; NÃO entra em súmulas/jogos até data X; pode treinar normalmente.
- `load_restricted` (boolean): Restrita de carga; participa com limitação de volume.

**Combinações válidas:**
- Estado base + múltiplas flags podem coexistir.
- Exemplo: `ativa + injured + suspended_until` (lesionada e suspensa simultaneamente).

### R13. Impacto dos estados e flags
**V1.2 Reformulação completa:**
- **ativa (sem flags):** Participa de tudo normalmente.
- **ativa + medical_restriction:** Participa com alertas; movimentos limitados; decisão médica registrada.
- **ativa + injured:** NÃO pode treinar/jogar; sistema **bloqueia** escalação em súmulas/convocações.
- **ativa + suspended_until:** NÃO entra em súmulas/jogos; **bloqueio automático** até data; pode treinar.
- **ativa + load_restricted:** Participa com alertas de carga; limitação de minutos/volume.
- **dispensada:** Aparece apenas em histórico; todos os `team_registrations` ativos são encerrados automaticamente.
- **arquivada:** Apenas histórico; sem operação; não recebe comunicação.

### R14. Categorias globais
Categorias são globais e definidas por idade máxima (`max_age`). Não possuem idade mínima (`min_age`), permitindo atletas jogarem em categorias superiores.

### R15. Regra etária obrigatória
A atleta pode atuar na sua categoria natural ou em categorias acima (superior), nunca em categorias abaixo (inferior).

**V1.2 Complemento:** Categoria natural calculada: `ano_temporada - ano_nascimento` → lookup em `categories WHERE idade <= max_age ORDER BY max_age ASC LIMIT 1`.

### R16. Múltiplas equipes
**V1.2 Atualização:**
A participação da atleta em equipes é temporal (via `team_registrations`). Atleta pode ter múltiplos vínculos ativos simultâneos em equipes diferentes.

**Exemplo prático:**
- Atleta Infantil (13 anos) joga em:
  - Equipe "Infantil Feminino" (categoria natural)
  - Equipe "Cadete Feminino" (categoria superior)
- Estatísticas separadas por equipe + agregação total por temporada.

### R17. Treinos
Treinos são eventos operacionais, editáveis dentro dos limites do sistema (R40), históricos e usados para carga, presença e análise.

### R18. Jogos
Jogos são eventos oficiais e, após finalizados, são imutáveis como evento; alterações só ocorrem por reabertura (RF15).

### R19. Estatísticas primárias
Estatísticas primárias estão sempre vinculadas a um jogo e a uma equipe.

**V1.2 Complemento:** Estatísticas registradas sempre incluem `team_id` e `athlete_id`, permitindo agregação por equipe e por atleta total.

### R20. Estatísticas agregadas
Estatísticas agregadas são derivadas e recalculáveis; nunca são fonte primária.

**V1.2 Complemento:** Agregações disponíveis:
- Por equipe (ex: Infantil Feminino).
- Por atleta total (soma de todas as equipes da temporada).
- Por atleta+equipe (detalhamento por contexto).

### R21. Métricas de treino
Dados de treino são métricas operacionais (carga, PSE, assiduidade) e não substituem estatísticas primárias de jogo.

### R22. Correção permitida com justificativa
Correções em estatísticas são permitidas somente com justificativa obrigatória (`admin_note`), identificação do responsável e data/hora.

### R23. Preservação do dado anterior
O dado corrigido substitui o anterior para fins operacionais; o valor anterior é preservado apenas para auditoria (`old_value` em `audit_logs`), sem efeito analítico.

### R24. Permissões por papel
Permissões são definidas por papel e aplicadas via vínculo organizacional.

### R25. Escopo implícito
- **Treinador:** Acesso apenas às suas equipes (definidas via RF7).
- **Coordenador:** Acesso total a dados operacionais e esportivos da organização.
- **Dirigente:** Acesso administrativo total da organização.
- **Atleta:** Acesso restrito aos próprios dados (seção 4).

### R26. Troca de função
Não existe troca direta de papel.

### R27. Transição obrigatória
O vínculo atual é encerrado (`org_membership.end_at` ou `team_registration.end_at`), um novo vínculo é criado, sem sobreposição temporal.

### R28. Exclusão lógica
Nenhuma entidade relevante é apagada fisicamente (soft delete obrigatório via `deleted_at` + `deleted_reason`).

### R29. Reativação de vínculo
Vínculos podem ser reativados desde que não violem exclusividade, não alterem histórico passado e passem a valer somente a partir da data de reativação.

**V1.2 Atualização:** Reativação cria **nova linha** com novo UUID; não reabre linha anterior.

### R30. Ações críticas auditáveis
São obrigatoriamente auditadas:
- Correção de estatística.
- Encerramento/reativação de vínculo.
- Exclusão lógica de jogo.
- Mudança de estado de atleta.
- Aplicação/remoção de flags de restrição.
- Criação de organização.
- Dirigente assume/funda organização.

### R31. Log obrigatório
Todo evento crítico deve registrar: `actor_id` (quem), `timestamp` (quando), `action` (o quê), `context` (detalhes), `old_value`, `new_value`.

### R32. Regra de ouro do sistema
Nada acontece fora de um vínculo. Nada relevante é apagado. Nada histórico é sobrescrito sem rastro.

**V1.2 Atualização:** Exceção: Atleta pode ser cadastrada sem vínculo (sem equipe), mas não opera até ter `team_registration` ativo.

### R33. Múltiplos clubes na V1
**V1.2 Reformulação completa:**
O sistema suporta múltiplos clubes (organizações) desde a V1.
- Cada clube possui seus próprios usuários (Dirigentes, Coordenadores, Treinadores, Atletas).
- Super Administrador possui acesso a todos os clubes do sistema.
- **Atletas só podem ter vínculos ativos em uma única organização por vez** (múltiplos vínculos permitidos apenas entre equipes da mesma organização).

### R34. Imutabilidade dos logs
Logs de auditoria são absolutamente imutáveis, não podendo ser alterados ou removidos, nem pelo Super Administrador.

### R35. Autoridade de correção de estatísticas
Correções de estatísticas podem ser realizadas por Coordenador, Treinador (da equipe) e Dirigente durante temporada ativa. Após encerrada, apenas Coordenador e Dirigente, via ação administrativa auditada.

### R36. Edição após encerramento da temporada
Após o encerramento da temporada (`end_date` passado), qualquer edição de dados operacionais ou esportivos só pode ocorrer por ação administrativa auditada, sem reabertura temporal.

### R37. Atividades sem equipe competitiva
**V1.2 Atualização:** Atividades sem equipe (avaliações, testes, captação) podem ser vinculadas a "Equipe Institucional" ou "Grupo de Avaliação" (opcional). Atleta também pode ser cadastrada sem equipe e adicionada depois.

### R38. Limite temporal de edição de treinos
O autor tem 10 minutos para correções rápidas. Após esse prazo, até 24 horas, qualquer edição exige aprovação ou perfil de nível superior. Após 24 horas, o registro é somente leitura, exceto por ação administrativa auditada.

### R39. Resolução de conflitos de edição
Em conflito simultâneo de edição, o sistema registra o conflito, bloqueia a sobrescrita automática e exige decisão explícita de usuário autorizado, com auditoria.

### R40. Modo somente leitura sem vínculo
**V1.2 Atualização:**
- **Staff sem org_membership:** Não pode operar.
- **Atleta sem team_registration:** Mantém acesso somente leitura ao próprio histórico pessoal e estatísticas individuais, sem interação nem dados coletivos. Não participa de treinos/jogos/convocações.

### R41. Hierarquia formal
1. Super Administrador > 2. Dirigente > 3. Coordenador > 4. Treinador/Staff > 5. Atleta.

---

## 2. Regras Operacionais — V1.2

### RF1. Cadeia hierárquica de criação ampliada
**V1.2 Reformulação completa:**
- **Super Administrador** pode criar: Dirigentes, Coordenadores, Treinadores, Atletas (todos os papéis).
- **Dirigentes** podem criar: Coordenadores, Treinadores, Atletas.
- **Coordenadores** podem criar: Treinadores, Atletas.
- **Treinadores** podem criar: Atletas.

A criação gera automaticamente o papel correspondente.

### RF1.1. Vínculos automáticos por papel cadastrado
**V1.2 Novo:**

**Dirigente cadastrado:**
- Cria: `person`, `user`, `role=dirigente`.
- **NÃO cria vínculo organizacional automático.**
- Vínculo com organização ocorre quando dirigente **fundar nova organização** ou **solicitar vínculo com organização existente**.

**Coordenador cadastrado:**
- Cria: `person`, `user`, `role=coordenador`.
- Cria **vínculo organizacional automático** (`org_membership`) com a organização do agente criador.
- Papel administrativo; vinculação imediata.

**Treinador cadastrado:**
- Cria: `person`, `user`, `role=treinador`.
- Cria **vínculo organizacional automático** (`org_membership`) com a organização do agente criador.
- **NÃO cria vínculo com equipe** (definido posteriormente via RF7).

**Atleta cadastrada:**
- Cria: `person`, `role=atleta`.
- Criação de `user` é **OPCIONAL** (checkbox "Criar acesso ao sistema" no cadastro).
- **NÃO cria vínculo organizacional automático.**
- **NÃO cria vínculo com equipe automático** (`team_registration` é opcional no cadastro).
- Atleta pode ser cadastrada "sem equipe" e adicionada depois, ou cadastrada diretamente com `team_registration` se informado no POST.

### RF2. Identidade baseada em papel
Pessoas só existem no sistema se identificadas como dirigente, coordenador, treinador ou atleta.

### RF3. Usuário sem vínculo ativo
**V1.2 Atualização:**
- **Staff (exceto Super Administrador):** Não pode operar sem `org_membership` ativo.
- **Atleta:** Mantém acesso somente leitura ao próprio histórico (ver R40). Não opera sem `team_registration` ativo.

### RF4. Criação de temporadas
**V1.2 Atualização:**
Dirigentes e Coordenadores podem criar temporadas para equipes da organização. Temporadas são vinculadas a uma equipe específica.

Campos obrigatórios:
- `team_id` (FK para equipe)
- `name` (ex: "Campeonato Estadual 2024")
- `year` (integer; ano de referência para cálculo de categoria)
- `competition_type` (ex: "oficial", "amistoso", "copa")
- `start_date`, `end_date`

### RF5. Encerramento de temporada
Nenhuma temporada pode ser encerrada manualmente após iniciada; o encerramento ocorre de forma automática ao fim do período (`end_date` passado).

**Sub-regras V1.2:**
- **RF5.1 Cancelamento antes do início:** Permitido apenas se a temporada não possuir dados vinculados (jogos, treinos, convocações). Havendo dados, é obrigatório mover/encerrar esses registros antes do cancelamento. Tudo é auditado.
- **RF5.2 Interrupção após início (força maior):** Não há encerramento manual. A temporada recebe o campo `interrupted_at` (timestamp); o sistema bloqueia criação/edição de novos eventos e cancela automaticamente jogos futuros. A `end_date` permanece inalterada. Tudo é auditado.

### RF6. Criação de equipes
Dirigentes, Coordenadores e Treinadores podem criar equipes dentro da organização.

**V1.3 Atualização:** Treinadores agora podem criar equipes para facilitar a gestão operacional.

**V1.2 Atualização:** Campos obrigatórios:
- `organization_id` (FK para organização)
- `name` (ex: "Cadete Feminino")
- `category_id` (FK para categoria; obrigatório)
- `gender` (enum: masculino, feminino, misto)

Equipes podem existir temporariamente sem atletas vinculadas.

### RF7. Alteração de treinador responsável pela equipe
**V1.2 Atualização:**
A troca pode ser feita por Dirigente ou Coordenador, é auditável e não altera histórico passado.

Treinador só acessa dados operacionais das equipes onde for definido como responsável (via `team_coaches` ou campo `coach_id` em `teams`).

### RF8. Encerramento de equipes
Equipes encerradas (soft delete) deixam de operar, permanecem em histórico e não participam de relatórios ativos.

### RF9. Criação de registros esportivos
Jogos, treinos e estatísticas podem ser criados por Coordenadores e Treinadores.

**V1.2 Complemento:** Jogos/treinos sempre vinculados a uma equipe (`team_id`) e opcionalmente a uma temporada (`season_id`).

### RF10. Registro de presença em treinos
Podem registrar presença: Dirigentes, Coordenadores e Treinadores.

**V1.2 Complemento:** Presença registrada por `team_registration` ativo no momento do treino.

### RF11. Convocação e recusa de atleta
Atletas podem recusar convocações; a recusa exige justificativa registrada; a convocação permanece no histórico com status atualizado.

**V1.2 Complemento:** Convocação vinculada a `team_registration` ativo. Atleta com múltiplos `team_registrations` pode ser convocada separadamente por cada equipe.

### RF12. Edição de treinos
Segue R38 (limite temporal de 10min/24h).

### RF13. Conflito de edição
Segue R39 (bloqueio e decisão auditada).

### RF14. Finalização de jogos
Jogos podem ser finalizados por Dirigentes, Coordenadores e Treinadores.

### RF15. Reabertura e exclusão lógica de jogos
Reabertura é permitida por Coordenador e Dirigente, sempre via ação administrativa auditada. Ao reabrir, o mesmo registro do jogo retorna ao status "em_revisao" (sem criação de nova versão/snapshot). As estatísticas deixam de alimentar dashboards até a nova finalização. Exclusão lógica de jogo pode ser feita por Coordenador ou Dirigente, sempre auditada.

### RF16. Alteração do estado da atleta
O estado base (ativa, dispensada, arquivada) e flags de restrição (injured, suspended_until, medical_restriction, load_restricted) podem ser alterados por Dirigentes, Coordenadores e Treinadores; toda alteração é auditável.

**V1.2 Complemento:**
- Mudança para "dispensada": encerra automaticamente todos os `team_registrations` ativos.
- Aplicação de flag `injured=true`: bloqueia escalação em convocações/súmulas.
- Aplicação de flag `suspended_until=date`: bloqueia participação em jogos até data.

### RF17. Encerramento manual de vínculos e participações
**V1.2 Atualização:**
- Coordenadores e Treinadores podem encerrar `team_registrations` de atletas (participação em equipes).
- Encerramento de `org_memberships` de Treinadores ou Coordenadores exige aprovação explícita do Dirigente.

### RF18. Salvamento de rascunhos
O sistema permite salvar registros incompletos como rascunho; rascunhos não produzem efeitos operacionais nem analíticos.

### RF19. Violação de regras
Quando uma regra é violada, o sistema alerta o usuário, permite salvar quando não estrutural e exige correção antes da efetivação.

### RF20. Prioridade operacional
O sistema prioriza alertas e orientação ao usuário; bloqueios só ocorrem quando a integridade estrutural está em risco.

### RF21. Regra suprema de decisão
Em conflito entre usabilidade e integridade dos dados, a integridade sempre prevalece. Regras automáticas do sistema sempre se sobrepõem à ação humana.

### RF22. Visibilidade de rascunhos
Registros em rascunho são visíveis para toda a comissão técnica, não apenas para quem criou.

### RF23. Duplicação de registros
O sistema permite duplicar treinos, jogos e equipes, sempre gerando um novo registro independente.

### RF24. Notificações obrigatórias
Notificações críticas do sistema bloqueiam ações até serem lidas e confirmadas pelo usuário.

### RF25. Operação offline
O sistema permite registro offline durante jogos, com sincronização posterior, preservando ordem temporal e integridade dos dados.

### RF26. Versionamento visível
Alterações relevantes exibem versionamento visível (antes/depois), além do log técnico interno.

### RF27. Janela de desfazer/editar
O usuário que realizou a ação pode editar ou desfazer por até 10 minutos. Após esse prazo, o registro é travado e apenas um superior hierárquico pode alterar, sempre com auditoria. Para treinos, aplicar também R38; para jogos, aplicar RF15.

### RF28. Comentários e anotações livres
O sistema permite comentários/anotações livres em jogos, treinos e atletas; esses comentários não alteram dados estatísticos.

### RF29. Atualização de relatórios e dashboards
Relatórios e dashboards refletem dados com atraso controlado, somente após validação dos registros.

### RF30. Alertas automáticos
O sistema possui alertas automáticos para inconsistências de dados e riscos esportivos (ex.: excesso de carga, acúmulo disciplinar).

**V1.2 Complemento:** Alerta de carga semanal para atletas com múltiplos `team_registrations` ativos (soma de minutos de todas as equipes).

### RF31. Prioridade entre regras
Em qualquer conflito entre regra esportiva e regra operacional, a regra esportiva sempre prevalece automaticamente.

---

## 2.X Regras Operacionais – Casos Especiais de Transição, UX e Edge Cases

### 2.X.1 Troca de papel sem carência
O encerramento de vínculo e o início de um novo vínculo (ex: de Treinador para Coordenador) podem ocorrer imediatamente, sem necessidade de tempo mínimo ("carência") entre papéis diferentes. O sistema registra ambos os eventos no log de auditoria, cada um com seu timestamp exato. Após a transição, permissões e interface são ajustadas para o novo papel vigente.

### 2.X.2 Controle de presença e ausência em treinos
Ao criar um treino para determinada equipe, o sistema gera automaticamente a lista de atletas vinculadas àquela equipe (via `team_registrations` ativos) como "presença a marcar". Após a realização do treino, o responsável (Dirigente, Coordenador ou Treinador) deve marcar a presença individual de cada atleta. Ausências registradas impactam diretamente as métricas de assiduidade e podem acionar alertas de baixa frequência. Não existe "convocação formal" para treinos; estar vinculado à equipe garante inclusão automática na lista de presença.

### 2.X.3 Bloqueio operacional por ausência de temporada ativa ("Seed")
**V1.2 Atualização:**
Não existe bloqueio por ausência de temporada. Seed mínimo contém apenas `roles` e `superadmin`. Organizações, equipes e temporadas são criadas conforme necessário por Dirigentes/Coordenadores.

### 2.X.4 Vínculo histórico correto em estatísticas após múltiplas trocas
Todas as estatísticas e eventos de participação são sempre vinculadas à equipe vigente do atleta no momento da ocorrência do evento (via `team_registration` ativo). Mudanças de equipe geram um novo vínculo — sem sobreposição de períodos — e consultas históricas sempre exibem o vínculo/equipe correspondente à data do evento, mesmo diante de múltiplas transferências no mesmo dia.

### 2.X.5 Liberação ou impedimento médico sob responsabilidade especializada
O status de impedimento para treinamentos ou jogos, quando houver restrição médica, é controlado exclusivamente por um usuário médico, devidamente designado no sistema. O sistema apenas exibe o alerta de restrição; a liberação para atividades só pode ocorrer mediante ação auditada do profissional de saúde.

**V1.2 Atualização:** Flag `medical_restriction=true` permite participação com limitações. Flag `injured=true` bloqueia participação total.

### 2.X.6 Validação de convites duplicados e restrição de equipes
**V1.2 Nova Regra:**

Usuários pendentes ou com vínculos ativos (tanto `team_memberships` para staff quanto `team_registrations` para atletas) **NÃO podem receber novos convites** para outras equipes.

**EXCEÇÃO:** Podem receber convites para equipes do **mesmo gênero** e **categorias inferiores** (categoria com `max_age` menor que a categoria da equipe atual).

**Validação aplicada:**
1. Ao enviar convite, sistema verifica se a pessoa possui:
   - Vínculos pendentes (`status='pendente'` em `team_memberships`)
   - Vínculos ativos (`status='ativo'` em `team_memberships` ou `end_at IS NULL` em `team_registrations`)

2. Se existirem vínculos:
   - **Gênero diferente:** Convite bloqueado (ex: vínculo com equipe feminina → convite para equipe masculina)
   - **Mesmo gênero + categoria superior ou igual:** Convite bloqueado (ex: Sub-16 → Sub-18)
   - **Mesmo gênero + categoria inferior:** Convite permitido (ex: Sub-16 → Sub-14)

**Mensagens de erro:**
- "Membro já possui vínculo com equipe de gênero diferente ({equipe} - {gênero}). Não é possível convidar para equipe {nova_equipe} ({novo_gênero})."
- "Membro já possui vínculo com equipe {equipe} (categoria {categoria}, max_age={idade}). Só pode receber convite para categorias inferiores (max_age < {idade})."

**Objetivo:** Evitar convites duplicados e garantir que pessoas só possam atuar em múltiplas equipes quando for permitido pelo regulamento esportivo (mesma organização, mesmo gênero, categoria inferior).

### 2.X.7 Bloqueios para erro de posição de goleira
No cadastro e edição de atletas, se a posição defensiva principal for "goleira", o sistema bloqueia estatísticas típicas de atleta de linha (ver RD13). O backend rejeita tentativas de lançamento de estatísticas bloqueadas para goleira, retornando erro informativo. Ao tentar alterar uma jogadora de goleira para linha ou vice-versa, o sistema alerta que a alteração pode impactar estatísticas e permissões e exige confirmação explícita do usuário responsável.

### 2.X.8 Rascunhos não auditáveis
Registros salvos como rascunho (ex: drafts de jogos, treinos, fichas) não são auditados ou versionados no log de auditoria. Rascunhos podem ser salvos e descartados a qualquer tempo sem trilha de rastreabilidade. Apenas ações efetivas publicadas no sistema são auditadas.

### 2.X.9 Descontinuação de categorias/posições (Tabelas auxiliares)
Categorias e posições utilizam tabelas auxiliares ("lookups") que não podem ser fisicamente excluídas, mas apenas inativadas/descontinuadas (campo `is_active=false`). Novos registros não podem usar categorias ou posições inativas. Dados históricos continuam vinculados a essas referências para consultas e relatórios.

### 2.X.10 Notificação crítica bloqueante (hard-block)
Notificações críticas (ex: pendência disciplinar, inconsistência de dados) geram sobresposição visual (modal hard-block) na interface, bloqueando a continuidade de ações relacionadas até que o usuário confirme ciência. Enquanto não houver confirmação, o sistema bloqueia toda interação sobre o contexto afetado.

### 2.X.11 Permissões isoladas por vínculo em promoções/demissões rápidas
Cada mudança de vínculo (início ou encerramento) é registrada de modo independente e auditável. O usuário só tem permissões conforme o vínculo ativo em vigor naquele momento; ao ficar sem vínculo operacional, acessa o sistema apenas em modo leitura restrito. O histórico completo de permissões e acessos é rastreável por meio dos logs de vínculos.

### 2.X.11 Janela curta de edição/desfazer
Após criar um registro (exemplo: presença, estatística, treino), o usuário possui até 10 minutos para editar ou desfazer a operação de forma autônoma. Após esse prazo, apenas níveis superiores podem editar ou o registro deverá ser excluído e refeito. Essa janela visa agilizar correções rápidas de erros e evitar excesso de versões e auditoria para pequenas alterações.

### 2.X.12 Dados derivados e operação offline
Dados derivados (como idade, categoria) são recalculados apenas na virada de temporada ou ao sincronizar com o backend. Caso haja operação offline, esses dados só serão atualizados após restabelecimento da conexão, momento em que o sistema aplica recalculo automático e exibe aviso ao usuário. Riscos de inconsistência só existem se o sistema permanecer offline por períodos atípicos (ex: mais de um ano).

### 2.X.13 Seed mínimo, disaster recovery e restauração do sistema
**V1.2 Atualização:**
Em caso de ausência, corrupção ou inconsistência grave das entidades mínimas do banco (`roles`, `superadmin`), apenas admin/superadmin pode acessar área especial de "Recuperação do Sistema". O painel de recuperação oferece um comando para restaurar o seed mínimo obrigatório, com registro obrigatório desta ação no log de auditoria. Enquanto não houver restauração, usuários comuns são bloqueados e informados sobre a necessidade de intervenção administrativa.

---

## 3. Regras de Domínio Esportivo — V1.2

### RD1. Cálculo de idade esportiva
**V1.2 Reformulação completa:**
A idade da atleta é calculada por: `ano_temporada - ano_nascimento`.

Exemplo: Atleta nascida em 2011, temporada com `year=2026` → idade = 15 anos.

Campo `seasons.year` (integer) é obrigatório e usado como referência para cálculo de categoria.

### RD2. Categoria natural da atleta
**V1.2 Reformulação completa:**
A categoria natural da atleta é derivada pela idade calculada e a tabela `categories`.

**Lógica:**
```sql
SELECT id, name
FROM categories
WHERE idade <= max_age
  AND is_active = true
ORDER BY max_age ASC
LIMIT 1;
```

Exemplo:
- Idade 11 anos → Mirim (max_age=12).
- Idade 13 anos → Infantil (max_age=14).
- Idade 15 anos → Cadete (max_age=16).
- Idade 17 anos → Juvenil (max_age=18).
- Idade 20 anos → Júnior (max_age=21).
- Idade 30 anos → Adulto (max_age=36).
- Idade 45 anos → Master (max_age=60).

### RD2.1. Categoria de atuação vs categoria natural
**V1.2 Novo:**
Em relatórios e estatísticas, o sistema exibe:
- **Categoria natural:** categoria baseada na idade da atleta (RD2).
- **Categoria de atuação:** categoria da equipe em que está jogando (`teams.category_id`).
- **Ambas** quando a atleta joga em categoria superior à natural.

**Exemplo:**
- Atleta: 13 anos → Categoria natural: Infantil.
- Equipe: "Cadete Feminino" → Categoria da equipe: Cadete.
- Relatório exibe: "Atleta Infantil atuando na equipe Cadete".

**Agregação de estatísticas:**
- **Por equipe:** Estatísticas da atleta em "Cadete Feminino".
- **Por atleta total:** Soma de todas as equipes (Infantil + Cadete).
- **Por atleta+equipe:** Detalhamento por contexto (quebra: Infantil vs Cadete).

### RD3. Atuação em categorias superiores
A atleta pode atuar em categorias acima da sua categoria natural, sem limite, desde que esteja vinculada às equipes correspondentes (via `team_registrations`).

### RD4. Participação em jogos
A atleta só pode participar de um jogo se estiver na convocação/lista oficial (o mesmo documento de autorização). Vínculo com equipe (`team_registration`) não implica participação automática.

### RD5. Estatísticas individuais
As estatísticas individuais pertencem exclusivamente à atleta, acumulam ao longo da temporada e da carreira, e não são fragmentadas por equipe ou categoria (agregação disponível, mas não fragmentação).

**V1.2 Complemento:** Agregações disponíveis:
- Total da atleta (soma de todas as equipes).
- Por equipe específica.
- Por temporada/competição.

### RD6. Substituições e tempo de jogo
O sistema registra entrada e saída de atletas; esses registros compõem o tempo de participação no jogo.

### RD7. Critério de participação oficial
Participação disciplinar: presença em súmula (banco + quadra). Participação estatística: tempo efetivo em quadra.

### RD8. Validação de jogos interrompidos
Estatísticas só são válidas se o jogo for oficialmente validado; jogos interrompidos e não validados não geram estatísticas.

### RD9. Empréstimo/cessão temporária
A atleta só pode atuar por outra equipe mediante vínculo explícito (`team_registration`), ainda que temporário.

**V1.2 Complemento:** Atleta pode ter múltiplos `team_registrations` ativos simultâneos **dentro da mesma organização**, permitindo jogar em múltiplas equipes/categorias. Para mudança entre organizações, ver seção de transferências em REGRAS_GERENCIAMENTO_ATLETAS.md.

### RD10. Jogos amistosos
Jogos amistosos geram estatísticas individuais separadas das estatísticas de jogos oficiais (filtro por `seasons.competition_type`).

### RD11. Posições em quadra
As atletas podem exercer múltiplas posições, variáveis por jogo.

### RD12. Mudança de posição durante o jogo
O sistema registra mudanças de posição ao longo do jogo, preservando a sequência temporal.

### RD13. Goleira
**V1.2 Reformulação completa:**

**Regra geral:**
A goleira é exclusiva da posição e não atua como jogadora de linha na temporada nem no jogo; não é contabilizada como atleta de linha para minutagem tática.

**Estatísticas PERMITIDAS para goleira:**
- Defesas totais.
- Arremessos sofridos.
- Percentual geral de defesa.
- Defesas por zona (6m, 9m, ponta esquerda/direita, 7m, contra-ataque).
- Gols sofridos totais.
- Gols sofridos por zona (6m, 9m, ponta, 7m, contra-ataque).
- Defesas de 7 metros (quantidade e aproveitamento).
- Defesas em inferioridade, igualdade e superioridade numérica.
- Defesas em situações especiais (último minuto, fim de período, 7m decisivo; via tags/flags).
- Erros de passe na saída de bola (contra-ataque ou reposição posicional).
- Passes certos de saída rápida / contra-ataque que ligam diretamente a um ataque perigoso.
- **Assistências de goleira** (passe direto que resulta em gol, normalmente de contra-ataque).
- **Gols marcados** (arremesso de gol a gol, ou se ela bater 7m em situação específica).
- Perdas de bola na saída (bola entregue ao adversário, reposição mal executada).
- Recuperações de bola dentro da área (rebotes que ela controla após defesa ou chute na trave).
- Erros de troca (que geram 2 minutos).
- Tempo em quadra como goleira (minutos jogados no gol).
- Exclusões de 2 minutos, cartões amarelos/vermelhos/azuis sofridos (disciplina da goleira).

**Estatísticas BLOQUEADAS para goleira:**
- Arremessos de linha (por posições ofensivas: armadora, ponta, pivô).
- Gols e arremessos de linha com cálculo de aproveitamento (estatísticas de jogadora de linha).
- Assistências em ataque posicional (último passe dentro do sistema ofensivo).
- Bloqueios defensivos de linha (bloqueios defensivos fora da área).
- Fintas 1x1 ofensivas, dribles.
- Roubos de bola/interceptações (na frente da defesa ou em marcação alta).
- Faltas de ataque.
- Tempo em quadra como jogadora de linha (minutos atuando fora do gol).
- Qualquer métrica pensada exclusivamente para funções de armadora central, lateral esquerda, lateral direita, ponta ou pivô (ex: "passes decisivos no ataque posicional", "finalizações em 1x1 na meia distância", "uso de bloqueios ofensivos").

**Validação no backend:**
O sistema bloqueia tentativas de lançamento de estatísticas bloqueadas para atleta com `main_defensive_position_id = 5` (goleira), retornando erro HTTP 400 com mensagem informativa.

### RD14. Capitã
A função de capitã não é registrada no sistema.

### RD15. Convocação
Uma atleta vinculada à equipe (`team_registration` ativo) pode não ser convocada para um jogo, sem impacto automático em vínculo ou estado.

### RD16. Suspensão e punição
**V1.2 Reformulação completa:**
Suspensão/punição gera impedimento esportivo de participação via flag `suspended_until=date`.

**Comportamento:**
- Sistema **bloqueia** automaticamente a inclusão da atleta em súmulas/convocações até a data de término da suspensão.
- Atleta **pode treinar** normalmente (flag não afeta treinos).
- Em telas de escalação/convocação, atleta suspensa aparece como "Indisponível - Suspensa até DD/MM/AAAA".

**Estatísticas:**
- Não há lançamento de estatísticas de jogo enquanto suspensa (bloqueio automático de convocação impede participação).

### RD17. Acúmulo disciplinar
O sistema controla acúmulo de cartões/faltas e aplica impactos automáticos previstos (ex.: alertas de irregularidade), sem suspensão automática.

**V1.2 Complemento:** Suspensão aplicada manualmente por Coordenador/Dirigente após decisão da competição/federação.

### RD18. Limite de atletas por jogo
O sistema valida o limite máximo de 16 atletas relacionadas por jogo; relações acima do limite são bloqueadas.

### RD19. Lesão durante o jogo
Lesão ocorrida em jogo altera imediatamente o estado da atleta (flag `injured=true`) a partir do evento, sem reescrever dados anteriores.

### RD20. Estatísticas coletivas
Estatísticas coletivas da equipe são derivadas automaticamente das estatísticas individuais; não existe lançamento manual independente.

### RD21. Sistemas defensivos
O sistema registra sistemas defensivos e suas variações ao longo do jogo.

### RD22. Goleiro-linha
Qualquer atleta de linha pode assumir a função de goleiro-linha, com estatísticas de goleiro; é uma situação tática distinta de substituição comum. Aplica-se apenas a atletas de linha. Não se aplica a atletas registradas como goleira na temporada.

### RD23. Tiros de 7 metros
Tiros de 7 metros possuem estatística específica separada.

### RD24. Exclusão de 2 minutos
A exclusão de 2 minutos deve registrar o evento, controlar tempo, gerenciar retorno e refletir impacto numérico em quadra.

### RD25. Cartão vermelho
O cartão vermelho encerra a participação apenas no jogo em que ocorreu.

### RD26. Pedidos de tempo (time-out)
Pedidos de tempo registram o momento e a equipe solicitante.

### RD27. Posse de bola
A posse de bola é inferida pelas ações; não é evento explícito independente.

### RD28. Transições ataque-defesa
Transições ataque-defesa são eventos analisáveis separadamente.

### RD29. Erros técnicos
Erros técnicos são registrados como estatística e geram impacto tático/disciplinar conforme regras definidas.

### RD30. Critério de vitória
Em caso de empate, o sistema suporta prorrogação e tiros de 7 metros decisivos, registrando cada fase como parte do mesmo jogo.

### RD31. Duração do jogo
A duração do jogo é configurável por competição.

### RD32. Intervalo
O intervalo influencia o controle de tempo e eventos.

### RD33. Prorrogação
A prorrogação segue regras próprias por categoria e competição.

### RD34. Tiros de 7m decisivos - elegibilidade
Todas as atletas relacionadas podem cobrar tiros de 7 metros decisivos.

### RD35. Tiros de 7m decisivos - registro
O sistema registra quem cobrou e o resultado, sem impor ordem fixa.

### RD36. Substituições durante exclusão
Durante exclusão de 2 minutos, substituições são permitidas normalmente, respeitando o impacto numérico.

### RD37. Retorno da exclusão
O retorno da atleta excluída ocorre apenas ao término do tempo regulamentar da exclusão.

### RD38. Acúmulo de exclusões
O sistema aplica automaticamente cartão vermelho após três exclusões na mesma partida.

### RD39. Faltas ofensivas
Faltas ofensivas geram impacto tático automático, além do registro estatístico.

### RD40. Vantagem
A aplicação de vantagem é ignorada no modelo.

### RD41. Defesas de goleira
Defesas da goleira são registradas como estatística específica (ver RD13).

### RD42. Rebotes
Rebotes não são registrados no modelo estatístico.

**V1.2 Exceção:** Recuperações de bola dentro da área pela goleira (rebotes que ela controla após defesa) são registradas (ver RD13).

### RD43. Contra-ataque
Contra-ataques são registrados manualmente como evento.

### RD44. Assistência
Assistência possui definição rígida e padronizada no sistema.

**V1.2 Complemento:** Assistências de goleira (passe direto que resulta em gol) são permitidas e registradas separadamente (ver RD13).

### RD45. Arremesso bloqueado
Arremesso bloqueado é ação defensiva separada.

### RD46. Bolas perdidas
Bolas perdidas são registradas por tipo.

**V1.2 Complemento:** Perdas de bola na saída pela goleira são registradas (ver RD13).

### RD47. Recuperação de bola
Recuperação de bola é evento próprio, não inferido automaticamente.

**V1.2 Complemento:** Recuperações de bola dentro da área pela goleira são registradas (ver RD13).

### RD48. Faltas defensivas
Faltas defensivas impactam o controle disciplinar automático, além do registro estatístico.

### RD49. Tempo efetivo de jogo
O sistema calcula tempo efetivo em quadra por atleta, além do tempo corrido.

**V1.2 Complemento:** Goleira tem "tempo em quadra como goleira"; não tem "tempo em quadra como jogadora de linha".

### RD50. Encerramento antecipado do jogo
O jogo pode ser encerrado antecipadamente conforme regra da competição.

### RD51. Tipos de jogo
O sistema distingue: jogo oficial, jogo amistoso, treino-jogo. Cada tipo possui tratamento estatístico próprio (vinculado a `seasons.competition_type`).

### RD52. Convivência de jogos
Jogos oficiais e amistosos podem coexistir na mesma competição.

### RD53. Mando de jogo
O mando de jogo não gera impacto estatístico.

### RD54. Local do jogo
O local do jogo é informativo/formativo, sem impacto em regras.

### RD55. Placar por período
O sistema registra placar parcial por período.

### RD56. WO
Vitória por ausência (WO) é suportada.

### RD57. Abandono de jogo
O sistema suporta registro de abandono de jogo.

### RD58. Empate
Empates são permitidos em competições.

### RD59. Controle do relógio
O relógio para automaticamente em exclusões e pedidos de tempo.

### RD60. Tempo efetivo
O tempo efetivo considera apenas paralisações oficiais.

### RD61. Prorrogação e estatísticas
Estatísticas da prorrogação são separadas do tempo normal.

### RD62. Múltiplos jogos no mesmo dia
A atleta pode atuar em múltiplos jogos no mesmo dia (em equipes diferentes ou mesma equipe); o sistema permite, emite alerta e monitora carga total, notificando coordenador e treinador.

**V1.2 Complemento:** Sistema agrega carga semanal total (soma de minutos de todas as equipes via múltiplos `team_registrations`).

### RD63. Limite diário
Não existe limite adicional de jogos por dia além da regra de alerta de carga.

### RD64. Banco de reservas
Atleta pode iniciar no banco e não entrar em quadra sem penalidade.

### RD65. Ausência não justificada
Ausência não justificada gera impacto disciplinar.

### RD66. Participação no banco
Estar no banco conta como participação disciplinar oficial.

### RD67. Advertência verbal
Advertência verbal não é registrada.

### RD68. Cartão amarelo
Cartão amarelo não gera impacto automático futuro.

### RD69. Duplo amarelo
Não existe conceito de duplo amarelo.

### RD70. Suspensão automática
Não existe suspensão automática por acúmulo disciplinar.

**V1.2 Complemento:** Suspensão aplicada manualmente via flag `suspended_until=date` por Coordenador/Dirigente.

### RD71. Defesa com os pés
Defesa com os pés da goleira não é estatística separada (contabilizada em "defesas totais").

### RD72. Saída da goleira
Saída da goleira da área não é registrada como evento.

### RD73. Interceptação defensiva
Interceptação defensiva é estatística própria.

**V1.2 Complemento:** Atletas de linha têm interceptações defensivas; goleira não (ver RD13 - bloqueada).

### RD74. Bloqueio defensivo
Bloqueio defensivo não gera posse automática.

**V1.2 Complemento:** Bloqueios defensivos de linha são bloqueados para goleira (ver RD13).

### RD75. Defesa de 7m
Defesa de tiro de 7m é estatística distinta (permitida para goleira; ver RD13).

### RD76. Arremesso após falta
Arremesso após falta não é tratado como situação especial.

### RD77. Contra-ataque
Arremesso em contra-ataque possui estatística própria.

**V1.2 Complemento:** Goleira pode ter gol em contra-ataque (gol a gol; ver RD13).

### RD78. Gol contra
Gol contra é registrado no sistema.

### RD79. Gol anulado
Não existe registro de gol anulado.

### RD80. Zona de arremesso
O local/zona do arremesso é registrado.

**V1.2 Complemento:** Goleira tem defesas por zona; não tem arremessos de linha por zona (ver RD13).

### RD81. Superioridade/inferioridade numérica
O sistema registra situações ativas de superioridade/inferioridade numérica.

**V1.2 Complemento:** Goleira tem defesas em inferioridade/igualdade/superioridade (ver RD13).

### RD82. Sistema ofensivo
Mudanças de sistema ofensivo são registradas.

### RD83. Jogadas ensaiadas
Jogadas ensaiadas são identificadas como tal.

### RD84. Marcação individual
Marcação individual é registrada como evento tático.

### RD85. Estatísticas em tempo real
Estatísticas são calculadas em tempo real para Live-Scouting e Logs de Atividade. Relatórios, dashboards e rankings usam dados validados (após finalização de jogo).

### RD86. Correções e ranking
Correções estatísticas afetam rankings automaticamente.

### RD87. Estatísticas após troca de equipe
Estatísticas da atleta permanecem preservadas após troca de equipe.

**V1.2 Complemento:** Estatísticas vinculadas ao `team_registration` vigente no momento do jogo; consultas históricas exibem equipe correta por data.

### RD88. Comparação entre temporadas
Estatísticas são comparáveis entre temporadas diferentes (via `seasons.year`).

### RD89. Jogos de referência técnica
Jogos podem ser marcados como referência técnica (flag/tag).

### RD90. Reset disciplinar por temporada
Penalidades disciplinares são resetadas ao final de cada temporada.

**V1.2 Atualização:** Reset ao final de cada competição (`seasons.end_date` passado).

### RD91. Ranking coletivo
O ranking coletivo é definido exclusivamente pelo saldo de gols.

---

## 4. Visibilidade do Perfil Atleta

1. **Dados pessoais (próprios)**
A atleta pode visualizar: nome completo, apelido esportivo, data de nascimento, categoria natural (derivada), equipes vinculadas (via `team_registrations`), posições registradas, foto (se existir). Não pode editar dados estruturais.

2. **Estado esportivo**
A atleta pode visualizar: estado base atual (ativa/dispensada/arquivada), flags de restrição (injured, suspended_until, medical_restriction, load_restricted), histórico de estados. Não pode alterar o próprio estado nem ver justificativas médicas detalhadas.

3. **Dados médicos e sensíveis (LGPD)**
A atleta pode visualizar: status esportivo (apta/inapta), restrições gerais (flags visíveis). Não pode visualizar: CID, diagnóstico detalhado, observações médicas internas, notas confidenciais.

4. **Treinos**
A atleta pode visualizar: calendário de treinos, presença própria, carga individual (quando liberado), observações públicas. Não pode visualizar: carga planejada do grupo, avaliações internas, comparativos com outras atletas.

5. **Jogos**
A atleta pode visualizar: jogos convocados (por equipe), jogos não convocados (agenda), resultado final, tempo em quadra, posição exercida, eventos pessoais. Não pode visualizar: anotações táticas, avaliações de outras atletas, decisões internas de escalação.

6. **Estatísticas individuais**
A atleta pode visualizar: estatísticas individuais completas (por equipe e total), evolução por jogo/temporada, comparativo consigo mesma. Não pode visualizar: ranking completo da equipe, estatísticas de outras atletas (exceto se liberado futuramente).

**V1.2 Complemento:** Se atleta tem múltiplos `team_registrations`, pode ver:
- Estatísticas por equipe (ex: Infantil vs Cadete).
- Estatísticas totais da temporada (soma de todas as equipes).

7. **Convocações e comunicação**
A atleta pode: receber convocações (por equipe), confirmar presença, recusar convocação com justificativa, visualizar comunicados oficiais. Não pode: criar comunicados, responder fora do fluxo previsto.

8. **Disciplina**
A atleta pode visualizar: cartões, exclusões, suspensões vigentes (`suspended_until`), histórico disciplinar pessoal. Não pode visualizar: regras internas de punição, histórico disciplinar de outras atletas.

9. **Histórico esportivo**
A atleta pode visualizar: temporadas passadas, equipes anteriores (`team_registrations` encerrados), estatísticas históricas pessoais, mesmo após troca de equipe, mudança de categoria ou fim de temporada.

10. **O que a atleta nunca vê**
Dados de outras atletas, relatórios técnicos, dados financeiros, dados médicos detalhados, logs de auditoria, pendências administrativas, rankings estratégicos internos.

**Regra-síntese (Atleta):**
A atleta vê tudo que diz respeito a si mesma, nada que exponha outras pessoas e nada que comprometa decisão técnica ou governança.

---

## 5. Regras de Participação da Atleta — V1.2

### RP1. Definição de participação
Participação disciplinar é definida pela presença em súmula (banco + quadra). Participação estatística exige tempo efetivo em quadra.

### RP2. Convocada sem entrada em quadra
Atleta convocada que não entra em quadra é participante disciplinar, mas não é participante estatística.

### RP3. Convocação obrigatória
Participação em jogo exige convocação/lista oficial prévia; participação sem convocação é bloqueada pelo sistema.

**V1.2 Complemento:** Convocação vinculada ao `team_registration` ativo no momento do jogo.

### RP4. Escopo da participação
A participação da atleta é considerada em jogos, treinos e atividades extras (avaliações, testes, captação).

### RP5. Ausência em treino
Ausência em treino gera carga = 0, impacto negativo no percentual de assiduidade e reflexo nas métricas do período.

### RP6. Participação em treino
Toda participação em treino gera métricas esportivas obrigatórias, incluindo dados objetivos e subjetivos.

### RP7. Atleta lesionada
**V1.2 Reformulação completa:**
Atleta lesionada (flag `injured=true`) **NÃO pode** participar de treinos adaptados nem jogos. Sistema **bloqueia** escalação em convocações/súmulas.

Lesão não implica exclusão do sistema; atleta mantém `team_registration` ativo e acesso a dados próprios.

### RP8. Treino adaptado
Treino adaptado é registrado como tipo específico de participação.

**V1.2 Complemento:** Disponível para atletas com flag `medical_restriction=true` (impedimento médico, não lesão).

### RP9. Atleta dispensada
Atleta dispensada (estado `dispensada`) aparece nos relatórios da temporada e no histórico, mas não participa de novos eventos. Todos os `team_registrations` ativos são encerrados automaticamente.

### RP10. Validação da participação
Toda participação registrada deve ser validada pelo Coordenador.

### RP11. Contestação de participação
A atleta pode contestar registros incorretos por solicitação formal ao Coordenador.

### RP12. Participação parcial
Participações parciais exigem registro obrigatório de tempo efetivo.

### RP13. Impacto da participação
A participação impacta estatísticas objetivas, avaliações internas subjetivas e relatórios esportivos/operacionais.

### RP14. Múltiplas equipes no mesmo dia
A atleta pode participar de múltiplas equipes no mesmo dia (via múltiplos `team_registrations` ativos); o sistema permite, emite alerta e monitora carga total, notificando coordenador e treinador.

**V1.2 Complemento:**
Sistema agrega:
- Carga semanal total (soma de minutos de todas as equipes).
- Alerta de sobrecarga quando ultrapassa limite configurável.
- Relatório de carga por equipe + total.

### RP15. Amistoso vs jogo oficial
Participações em jogos amistosos e oficiais são registradas normalmente e contam separadamente para estatísticas e índices (filtro por `seasons.competition_type`).

### RP16. Atleta suspensa
Atleta suspensa (flag `suspended_until=date`) **não pode ser relacionada** em súmulas/convocações; sistema **bloqueia** automaticamente. Pode treinar normalmente.

**V1.2 Atualização:** Bloqueio automático de convocação até data de término da suspensão.

### RP17. Alerta por restrição
A participação é sinalizada como irregular se houver:
- Flag `injured=true`: **bloqueio total** (não pode jogar/treinar).
- Flag `suspended_until=date`: **bloqueio de jogo** (não entra em súmula; pode treinar).
- Flag `medical_restriction=true`: **alerta** (pode jogar com limitações; decisão médica registrada).

### RP18. Atividade sem equipe
**V1.2 Atualização:**
A atleta sem `team_registration` ativo não pode participar de atividades. Opcionalmente, pode ser vinculada a "Equipe Institucional / Grupo de Avaliação" para atividades de captação/avaliação.

### RP19. Dupla natureza do registro
Toda participação gera registro esportivo e registro administrativo.

### RP20. Mudança de equipe
Ao mudar de equipe (encerrar `team_registration` e criar novo), a participação passada permanece vinculada à equipe original, preservando contexto histórico.

**V1.2 Complemento:** Estatísticas consultadas por `team_registration_id` vigente na data do jogo.

**Regra-síntese de participação:**
A atleta participa quando está presente, com controle, validação e rastreabilidade, sem reescrever o passado e sem perder contexto esportivo.

---

## 6. Regras de Configuração do Banco - V1.2

### RDB1. SGBD e extensões
Banco PostgreSQL 17 (Neon) com extensão `pgcrypto` habilitada para uso de `gen_random_uuid()`.

### RDB2. Chaves primárias e nomes
PKs são UUID com default `gen_random_uuid()`. Constraints e índices usam nomes semânticos (pk_, fk_, ux_, ix_, ck_, trg_).

### RDB2.1. Exceção de PK (allowlist fechada)
Tabelas técnicas/lookup/sistema que podem usar integer/smallint como PK:
- `roles` (lookup de papéis - R4)
- `categories` (lookup de categorias - R14) **V1.2: sem min_age**
- `permissions` (lookup de permissões)
- `role_permissions` (junction table)
- `defensive_positions` (lookup de posições defensivas)
- `offensive_positions` (lookup de posições ofensivas)
- `schooling_levels` (lookup de escolaridade)
- `alembic_version` (técnica - migrations)

Qualquer tabela fora desta lista é considerada tabela de domínio e DEVE usar UUID com default `gen_random_uuid()`.

### RDB3. Timezone e colunas temporais
Colunas temporais usam `timestamptz` em UTC; conversão e exibição são responsabilidade da UI.

### RDB4. Exclusão lógica
Tabelas de domínio usam `deleted_at` + `deleted_reason`. `deleted_reason` é obrigatória quando `deleted_at` não é null. DELETE físico é bloqueado por trigger.

### RDB4.1. Exceção de Soft Delete (allowlist fechada)
Tabelas que NÃO requerem `deleted_at`/`deleted_reason`:
- `roles` (lookup imutável)
- `categories` (lookup imutável)
- `permissions` (lookup imutável)
- `role_permissions` (junction table imutável)
- `defensive_positions`, `offensive_positions`, `schooling_levels` (lookups imutáveis)
- `alembic_version` (técnica - migrations)
- `audit_logs` (excluída por RDB5 - append-only, nunca deletada)

Qualquer tabela fora desta lista é tabela de domínio e DEVE implementar soft delete completo.

### RDB5. Auditoria imutável
`audit_logs` é append-only: apenas INSERT. UPDATE/DELETE são bloqueados por trigger. Logs registram: `actor_id`, `timestamp`, `action`, `context`, `old_value`, `new_value`.

### RDB6. Super Administrador único
Existe exatamente um Super Administrador. Unicidade garantida por índice parcial único em `users` (`is_superadmin = true`); seed inicial cria esse usuário.

### RDB7. Papéis e estados
Papéis são definidos em tabela de `roles`. Estado base da atleta é validado por CHECK (`ativa`, `dispensada`, `arquivada`). Flags de restrição são colunas booleanas + date.

**V1.2 Atualização:**
- Estado base: `state VARCHAR(20) CHECK (state IN ('ativa', 'dispensada', 'arquivada'))`
- Flags: `injured BOOLEAN`, `medical_restriction BOOLEAN`, `suspended_until DATE`, `load_restricted BOOLEAN`

### RDB8. Temporadas por equipe
**V1.2 Reformulação completa:**
Temporadas possuem `team_id` (FK obrigatória), `name`, `year` (integer), `competition_type`, `start_date`, `end_date` com CHECK `start_date < end_date`. Campos opcionais: `canceled_at`, `interrupted_at`.

**Status derivado (não armazenado como enum):**
- planejada: `now < start_date AND canceled_at IS NULL`
- ativa: `start_date <= now AND now <= end_date AND interrupted_at IS NULL AND canceled_at IS NULL`
- interrompida: `interrupted_at IS NOT NULL AND canceled_at IS NULL`
- cancelada: `canceled_at IS NOT NULL`
- encerrada: `now > end_date AND canceled_at IS NULL`

### RDB9. Vínculos organizacionais (staff)
**V1.2 Reformulação completa:**
`org_memberships` substitui `memberships` sazonal. Estrutura:
- `id UUID PRIMARY KEY`
- `person_id UUID NOT NULL REFERENCES persons(id)`
- `role_id INTEGER NOT NULL REFERENCES roles(id)`
- `organization_id UUID NOT NULL REFERENCES organizations(id)`
- `start_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `end_at TIMESTAMPTZ`
- Índice parcial: `UNIQUE (person_id, organization_id, role_id) WHERE end_at IS NULL AND deleted_at IS NULL`

Garante 1 vínculo ativo por pessoa+organização+papel (staff).

### RDB10. Múltiplos vínculos de atleta
**V1.2 Atualização:**
`team_registrations` usa uma linha por período ativo (`start_at`, `end_at`) por pessoa+equipe. Reativações criam novas linhas (novo UUID), sem reabrir a anterior.

Estrutura:
- `id UUID PRIMARY KEY`
- `athlete_id UUID NOT NULL REFERENCES athletes(id)`
- `team_id UUID NOT NULL REFERENCES teams(id)`
- `start_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `end_at TIMESTAMPTZ`
- Índice parcial: `UNIQUE (athlete_id, team_id) WHERE end_at IS NULL AND deleted_at IS NULL`

**Backend garante:** Períodos não se sobreponham para mesma pessoa+equipe (validação em serviço). Atleta pode ter múltiplos `team_registrations` ativos simultâneos em equipes diferentes.

Convocações/participações referenciam a linha vigente no momento do evento.

### RDB11. Categorias globais
**V1.2 Reformulação completa:**
Categorias são globais apenas com `max_age` (sem `min_age`).

Estrutura:
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  max_age INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT ck_categories_max_age_positive CHECK (max_age > 0)
);
```

Exemplo de dados:
```sql
INSERT INTO categories (id, name, max_age) VALUES
  (1, 'Mirim', 12),
  (2, 'Infantil', 14),
  (3, 'Cadete', 16),
  (4, 'Juvenil', 18),
  (5, 'Júnior', 21),
  (6, 'Adulto', 36),
  (7, 'Master', 60);
```

### RDB12. Correções de estatística
Correções exigem `admin_note` obrigatório e geram log em `audit_logs` com `old_value`/`new_value`, sem versionamento completo.

### RDB13. Imutabilidade de jogos e treinos
Trigger bloqueia UPDATE em jogo finalizado. Exceção: permitir UPDATE que altere exclusivamente `status` de `finalizado` -> `em_revisao`, quando a ação for do Coordenador ou do Dirigente, com `audit_log` obrigatório (`action=game_reopen`, `actor_id`, `timestamp`, `old/new`).

Após 24h, só é possível editar por ação administrativa auditada com `admin_note` obrigatório. Treinos com mais de 24h exigem `admin_note` para edição.

### RDB14. Seed mínimo
**V1.2 Reformulação completa:**
Banco novo deve conter: `roles`, `superadmin`.

**Não contém:** Organizações, temporadas, equipes (criadas por Dirigentes/Coordenadores após seed).

**Seed obrigatório:**
1. Inserir papéis (`roles`): Dirigente, Coordenador, Treinador, Atleta.
2. Criar Super Administrador (`users.is_superadmin=true`).
3. Inserir categorias padrão (opcional, mas recomendado):
   ```sql
   INSERT INTO categories (id, name, max_age) VALUES
     (1, 'Mirim', 12),
     (2, 'Infantil', 14),
     (3, 'Cadete', 16),
     (4, 'Juvenil', 18),
     (5, 'Júnior', 21),
     (6, 'Adulto', 36),
     (7, 'Master', 60);
   ```
4. Inserir posições defensivas/ofensivas (opcional, mas recomendado).
5. Inserir níveis de escolaridade (opcional).

### RDB15. Organizações
**V1.2 Novo:**
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_reason TEXT,
  CONSTRAINT ck_organizations_deleted_reason
    CHECK ((deleted_at IS NULL AND deleted_reason IS NULL)
           OR (deleted_at IS NOT NULL AND deleted_reason IS NOT NULL))
);
```

### RDB16. Equipes vinculadas a organizações
**V1.2 Novo:**
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(100) NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id), -- Obrigatório
  gender VARCHAR(20) NOT NULL CHECK (gender IN ('masculino', 'feminino',)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_reason TEXT,
  CONSTRAINT ck_teams_deleted_reason
    CHECK ((deleted_at IS NULL AND deleted_reason IS NULL)
           OR (deleted_at IS NOT NULL AND deleted_reason IS NOT NULL))
);
```

### RDB17. Atletas com estado base + flags
**V1.2 Novo:**
```sql
CREATE TABLE athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES persons(id),

  -- Estado base
  state VARCHAR(20) NOT NULL DEFAULT 'ativa'
    CHECK (state IN ('ativa', 'dispensada', 'arquivada')),

  -- Flags de restrição (camadas adicionais)
  injured BOOLEAN NOT NULL DEFAULT false, -- Lesionada: NÃO treina/joga
  medical_restriction BOOLEAN NOT NULL DEFAULT false, -- Impedimento médico: joga com limitações
  suspended_until DATE, -- Suspensa até data: NÃO joga, mas treina
  load_restricted BOOLEAN NOT NULL DEFAULT false, -- Restrita de carga

  -- Dados cadastrais
  athlete_name VARCHAR(100) NOT NULL,
  birth_date DATE NOT NULL,
  athlete_rg VARCHAR(20),
  athlete_cpf VARCHAR(11),
  athlete_phone VARCHAR(20),
  athlete_email VARCHAR(100),
  athlete_nickname VARCHAR(50),
  shirt_number INTEGER CHECK (shirt_number BETWEEN 1 AND 99),
  main_defensive_position_id INTEGER REFERENCES defensive_positions(id),
  secondary_defensive_position_id INTEGER REFERENCES defensive_positions(id),
  main_offensive_position_id INTEGER REFERENCES offensive_positions(id),
  secondary_offensive_position_id INTEGER REFERENCES offensive_positions(id),
  schooling_id INTEGER REFERENCES schooling_levels(id),
  guardian_name VARCHAR(100),
  guardian_phone VARCHAR(20),
  zip_code VARCHAR(10),
  street VARCHAR(200),
  neighborhood VARCHAR(100),
  city VARCHAR(100),
  state CHAR(2),
  address_number VARCHAR(20),
  address_complement VARCHAR(100),
  athlete_photo_path VARCHAR(500),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  athlete_age_at_registration INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_reason TEXT,

  CONSTRAINT ck_athletes_deleted_reason
    CHECK ((deleted_at IS NULL AND deleted_reason IS NULL)
           OR (deleted_at IS NOT NULL AND deleted_reason IS NOT NULL))
);

-- Índices únicos
CREATE UNIQUE INDEX ux_athletes_rg ON athletes(athlete_rg) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX ux_athletes_cpf ON athletes(athlete_cpf) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX ux_athletes_email ON athletes(LOWER(athlete_email))
  WHERE athlete_email IS NOT NULL AND deleted_at IS NULL;
```

### RDB18. Triggers obrigatórios
**V1.2 Atualização:**
1. `updated_at` BEFORE UPDATE em todas as tabelas de domínio.
2. `athlete_age_at_registration` ON INSERT/UPDATE (quando `registered_at`/`birth_date` mudam).
3. Bloqueio de UPDATE em `games` com `status=finalizado` (exceção: mudança para `em_revisao` por Coordenador/Dirigente).
4. Bloqueio de DELETE físico em tabelas com soft delete.
5. Bloqueio de UPDATE/DELETE em `audit_logs`.
6. Encerramento automático de `team_registrations` quando atleta muda para `state=dispensada`.

---

## 6.1. Especificação Detalhada de Tabelas - V1.2

### 6.1.1. Tabela: matches

**Responsabilidade:** Registro oficial de cada jogo no sistema. Ponto de partida para convocação, súmula, eventos, estatísticas e relatórios.

| Campo | Tipo | Validação | Forma de entrada | Obrigatoriedade |
|-------|------|-----------|------------------|-----------------|
| id | UUID | PK gen_random_uuid() | não editável | obrigatório |
| season_id | UUID | FK seasons.id | select de temporadas | obrigatório |
| competition_id | UUID | FK competitions.id | select de competições | opcional/obrigatório |
| match_date | DATE | data válida | datepicker | obrigatório |
| start_time | TIME | horário válido | timepicker | opcional |
| venue | VARCHAR(120) | max 120 chars | campo texto | opcional |
| phase | VARCHAR(32) | enum (group, semifinal, final, friendly) | select opções fixas | obrigatório |
| status | VARCHAR(32) | enum (scheduled, in_progress, finished, cancelled) | select opções fixas | obrigatório |
| home_team_id | UUID | FK teams.id | select de equipes | obrigatório |
| away_team_id | UUID | FK teams.id, != home_team_id | select de equipes | obrigatório |
| our_team_id | UUID | FK teams.id; = home ou away | select limitado | obrigatório |
| final_score_home | SMALLINT | ≥ 0 | editável quando status=finished | opcional |
| final_score_away | SMALLINT | ≥ 0 | editável quando status=finished | opcional |
| notes | TEXT | livre | campo texto | opcional |
| created_at | TIMESTAMPTZ | default now() | somente leitura | obrigatório |
| created_by_user_id | UUID | FK users.id | automático | obrigatório |

**Uso prático:** Coordenador ou treinador cadastra jogo escolhendo temporada, competição, data, horário, local. Define mandante, visitante e indica qual é "nossa equipe" (`our_team_id`). Campo `phase` organiza jogo na competição; `status` controla ciclo (agendado → em andamento → finalizado → cancelado). Quando jogo termina (`status=finished`), placar final é registrado.

**Contexto:** Esta tabela é responsável por dar contexto a tudo: `match_events` aponta para `match_id`, `match_roster` usa `match_id` para montar súmula, relatórios começam buscando jogos aqui.

---

### 6.1.2. Tabela: teams

**Responsabilidade:** Cadastro oficial de todas as equipes (do clube e adversários). Referência central para jogos, treinos, convocação, estatísticas e relatórios.

| Campo | Tipo | Validação | Forma de entrada | Obrigatoriedade |
|-------|------|-----------|------------------|-----------------|
| id | UUID | PK gen_random_uuid() | não editável | obrigatório |
| organization_id | UUID | FK organizations.id | select de clubes | obrigatório |
| name | VARCHAR(120) | único por organization_id | campo texto | obrigatório |
| category_id | INTEGER | FK categories.id | select opções fixas | obrigatório |
| gender | VARCHAR(16) | enum (masculino, feminino) | select opções fixas | obrigatório |
| is_our_team | BOOLEAN | booleano | checkbox "Equipe do clube" | obrigatório |
| active_from | DATE | data válida | datepicker | opcional |
| active_until | DATE | ≥ active_from ou null | datepicker | opcional |
| created_at | TIMESTAMPTZ | default now() | somente leitura | obrigatório |
| created_by_user_id | UUID | FK users.id | automático | obrigatório |
| deleted_at | TIMESTAMPTZ | soft delete | somente leitura | opcional |
| deleted_reason | TEXT | obrigatório quando deleted_at NOT NULL | textarea | opcional |

**Uso prático:** Dirigente ou coordenador cria equipes do clube para cada temporada, definindo clube, nome visível (ex: "Infantil Feminino", "Cadete Feminino"), categoria e gênero. `is_our_team` define se é equipe do clube ou adversário. `active_from` e `active_until` controlam quando equipe existiu, evitando usar times antigos em novos jogos.

**V1.2 Mudança estrutural:** Equipes NÃO têm `season_id`. Equipes existem independentemente de temporadas. `gender` é obrigatório (RDB16).

---

### 6.1.3. Tabela: match_teams

**Responsabilidade:** Ponte entre jogo e equipes participantes. Registra quais times estão ligados a cada partida e com qual papel.

| Campo | Tipo | Validação | Forma de entrada | Obrigatoriedade |
|-------|------|-----------|------------------|-----------------|
| id | UUID | PK gen_random_uuid() | não editável | obrigatório |
| match_id | UUID | FK matches.id | herdado do jogo | obrigatório |
| team_id | UUID | FK teams.id | select de lista | obrigatório |
| is_home | BOOLEAN | booleano | checkbox "Mandante" | obrigatório |
| is_our_team | BOOLEAN | coerente com teams.is_our_team | checkbox (pode ser travado) | obrigatório |

**Uso prático:** Sempre que jogo é criado em `matches`, backend ou usuário alimenta `match_teams` com duas linhas: uma para mandante e outra para visitante, apontando `match_id` e `team_id`, marcando `is_home` e `is_our_team`.

**Finalidade:**
- Identificar rapidamente quais equipes jogaram a partida.
- Suportar cenários futuros (torneios com mais de dois times).
- Simplificar filtragens no painel (ex: "todos os jogos das nossas equipes" filtrando por `is_our_team=true`).

---

### 6.1.4. Tabela: match_roster

**Responsabilidade:** Súmula/convocação oficial do jogo. Define quais atletas estão elegíveis para atuar por cada equipe em cada partida, com número de camisa e função.

| Campo | Tipo | Validação | Forma de entrada | Obrigatoriedade |
|-------|------|-----------|------------------|-----------------|
| id | UUID | PK gen_random_uuid() | não editável | obrigatório |
| match_id | UUID | FK matches.id | herdado do contexto | obrigatório |
| team_id | UUID | FK teams.id; deve existir em match_teams | select/derivado | obrigatório |
| athlete_id | UUID | FK athletes.id | select de atletas da equipe | obrigatório |
| jersey_number | SMALLINT | > 0 | campo numérico | obrigatório |
| is_starting | BOOLEAN | booleano | checkbox "Titular" | opcional |
| is_goalkeeper | BOOLEAN | booleano | checkbox "Goleira" | obrigatório |
| is_available | BOOLEAN | respeita suspensões/DM | checkbox "Apta" | obrigatório |
| notes | TEXT | livre | texto livre | opcional |

**Uso prático:** Depois que jogo está criado em `matches` e equipe definida em `match_teams`, treinador/coordenador abre súmula e preenche `match_roster`. Cada linha liga jogo, equipe e atleta, definindo número de camisa, se começa titular, se é goleira e se está realmente apta (considerando suspensão, lesão, impedimento médico).

**Responsabilidade dupla:**
- **Administrativa:** Garante que só quem está convocada e apta possa aparecer em outros registros (eventos, presença, relatórios).
- **Esportiva:** Base para análise posterior por jogo e por equipe.

**Validação importante:** Comissão deve revisar e confirmar lista antes do jogo, marcando goleiras corretamente. Evitar alterar súmula depois que jogo foi registrado, exceto em correção justificada.

---

### 6.1.5. Tabela: match_possessions

**Responsabilidade:** Transforma jogo em "sequências de posse de bola". Cada linha representa posse completa de um time: quando começou, quando terminou, placar no início/fim e como posse terminou.

| Campo | Tipo | Validação | Forma de entrada | Obrigatoriedade |
|-------|------|-----------|------------------|-----------------|
| id | UUID | PK gen_random_uuid() | não editável | obrigatório |
| match_id | UUID | FK matches.id | herdado do contexto | obrigatório |
| team_id | UUID | FK teams.id | equipe que tem posse | obrigatório |
| start_period_number | SMALLINT | ≥ 1 | select ou numérico | obrigatório |
| start_time_seconds | INTEGER | ≥ 0 | slider ou input mm:ss | obrigatório |
| end_period_number | SMALLINT | ≥ start_period_number | validado contra período | obrigatório |
| end_time_seconds | INTEGER | ≥ start_time_seconds | slider ou input mm:ss | obrigatório |
| start_score_our | SMALLINT | ≥ 0 | calculado ou ajustável | obrigatório |
| start_score_opponent | SMALLINT | ≥ 0 | calculado ou ajustável | obrigatório |
| end_score_our | SMALLINT | ≥ 0 | calculado pela sequência | obrigatório |
| end_score_opponent | SMALLINT | ≥ 0 | calculado pela sequência | obrigatório |
| result | VARCHAR(32) | enum (goal, turnover, seven_meter_won, time_over) | select opções fixas | obrigatório |

**Uso prático:** A partir de eventos lançados em `match_events`, backend identifica quando equipe ganha bola (início da posse) e quando perde (fim da posse). Preenche `match_possessions` calculando período, tempo, placar no início/fim. Campo `result` resume desfecho: gol, perda de bola, 7m, estouro de tempo.

**Responsabilidade:** Base da análise tática de eficiência: gols por posse, turnovers por posse, aproveitamento em ataques posicionais, qualidade de transições, impacto no placar.

**Uso pela comissão:** Quase nunca preenchida manualmente; é consumida. Treinador-chefe e analista acessam relatórios baseados nesta tabela para responder: quantas posses tivemos por jogo, quantas terminaram em gol, quantas foram desperdiçadas, eficiência em vantagem/desvantagem no placar.

**Análise avançada:** Cruzamento com `match_events.phase_of_play`: ver quantas posses de transição ofensiva encerram em gol vs quantas posses de ataque posicional terminam em turnover.

---

### 6.1.6. Tabela: match_events

**Responsabilidade:** Coração analítico do sistema. Cada linha representa um lance do jogo com tempo, contexto tático, atleta, situação numérica, localização e impacto no placar. "Filmagem do jogo em forma de dados". Serve tanto para jogadoras de linha quanto goleiras.

| Campo | Tipo | Validação | Forma de entrada | Obrigatoriedade |
|-------|------|-----------|------------------|-----------------|
| id | UUID | PK gen_random_uuid() | não editável | obrigatório |
| match_id | UUID | FK matches.id | herdado | obrigatório |
| team_id | UUID | FK teams.id | select/derivado | obrigatório |
| opponent_team_id | UUID | FK teams.id | derivado | opcional |
| athlete_id | UUID | FK athletes.id | select de atletas ou null | opcional |
| assisting_athlete_id | UUID | FK athletes.id | select de atletas | opcional |
| secondary_athlete_id | UUID | FK athletes.id | select (pode ser adversário) | opcional |
| period_number | SMALLINT | ≥ 1 | select ou input | obrigatório |
| game_time_seconds | INTEGER | entre 0 e duração do período | input mm:ss | obrigatório |
| phase_of_play | VARCHAR(32) | FK phases_of_play.code (4 fases) | select | obrigatório |
| possession_id | UUID | FK match_possessions.id | select/derivado | opcional |
| advantage_state | VARCHAR(32) | FK advantage_states.code | select (even, superiority, inferiority) | obrigatório |
| score_our | SMALLINT | ≥ 0 | calculado/editável | obrigatório |
| score_opponent | SMALLINT | ≥ 0 | calculado/editável | obrigatório |
| event_type | VARCHAR(64) | FK event_types.code | select lista fixa | obrigatório |
| event_subtype | VARCHAR(64) | FK event_subtypes.code | select filtrado | opcional/obrigatório |
| outcome | VARCHAR(64) | valores válidos conforme tipo | select condicionado | obrigatório |
| is_shot | BOOLEAN | coerente com event_type | checkbox automático | obrigatório |
| is_goal | BOOLEAN | coerente com outcome | checkbox automático | obrigatório |
| x_coord | NUMERIC(5,2) | 0-100 | input em mapa interativo | opcional |
| y_coord | NUMERIC(5,2) | 0-100 | input em mapa interativo | opcional |
| related_event_id | UUID | FK match_events.id | select ao encadear lances | opcional |
| source | VARCHAR(32) | enum (live, video, post_game_correction) | select/setado | obrigatório |
| notes | TEXT | livre | texto opcional | opcional |
| created_at | TIMESTAMPTZ | default now() | somente leitura | obrigatório |
| created_by_user_id | UUID | FK users.id | automático | obrigatório |

**Três papéis centrais:**

1. **Reconstrói jogo lance a lance:** Via `match_id`, `period_number`, `game_time_seconds` tem linha do tempo completa.
2. **Conecta tudo ao contexto tático:** `team_id`, `opponent_team_id`, `phase_of_play`, `possession_id`, `advantage_state` permitem saber em que fase do jogo lance aconteceu, quem tinha bola e se time estava em igualdade/superioridade/inferioridade.
3. **Gera base para todas estatísticas:** `athlete_id`, `event_type`, `event_subtype`, `outcome`, `is_shot`, `is_goal`, somados a `score_our` e `score_opponent`, alimentam relatórios por atleta, goleira, equipe, período e fase.

**Uso prático:** Analista escolhe jogo, equipe e registra cada ação: seleciona atleta, define `event_type` e `event_subtype`, marca fase do jogo (`phase_of_play`), ajusta `advantage_state`, clica no mapa para gravar `x_coord` e `y_coord`. Em lances compostos (falta → 7m → gol), pode encadear usando `related_event_id`. Sistema calcula e atualiza `score_our`/`score_opponent` conforme gols são marcados; marca automaticamente `is_shot` e `is_goal`.

**Goleiras:** Registradas exatamente da mesma forma: entram em `athlete_id` com eventos como `goalkeeper_save`, `shot` com outcome `goal` ou `saved_by_goalkeeper`, erros de saída de bola, assistências de contra-ataque, etc.

**Uso correto pela comissão:**
1. Registrar jogo de forma consistente (sempre com `phase_of_play` e `advantage_state` corretos).
2. Garantir que todos lances relevantes estejam ali (gols, arremessos, defesas de goleira, perdas de bola, faltas importantes).
3. Consumir dados em painéis/relatórios que filtram por fase, atleta, posição e placar.

**V1.2 Complemento:** É essa estrutura que permite dizer, com precisão, como equipe se comporta em defesa, nas duas transições, no ataque posicional e como goleiras impactam resultado.

---

### 6.1.7. Tabela: event_types

**Responsabilidade:** Dicionário oficial dos tipos de evento que podem aparecer em `match_events`. Define "que tipo de lance existe no sistema" e como lance se comporta estatisticamente.

| Campo | Tipo | Validação | Forma de entrada | Obrigatoriedade |
|-------|------|-----------|------------------|-----------------|
| code | VARCHAR(64) | PK único | não editável após uso | obrigatório |
| description | VARCHAR(255) | texto curto | campo texto | obrigatório |
| is_shot | BOOLEAN | booleano | checkbox | obrigatório |
| is_possession_ending | BOOLEAN | booleano | checkbox | obrigatório |

**Campo `code`:** Identificador técnico (ex: `shot`, `goal`, `goalkeeper_save`, `turnover`, `foul`, `seven_meter`, `substitution`, `timeout`). Usado em `match_events.event_type`. Não deve ser alterado depois de uso para não quebrar relatórios.

**Campo `description`:** Explicação legível; texto que aparece no frontend.

**Campo `is_shot`:** Indica se tipo representa finalização. Permite calcular estatísticas de arremessos e aproveitamento. Ex: `shot` e `seven_meter` têm `is_shot=true`; `foul` ou `substitution` têm `is_shot=false`.

**Campo `is_possession_ending`:** Marca se evento encerra posse de bola (gol, turnover, fim de período, 7m convertido). Sistema usa isso para montar posses em `match_possessions` automaticamente e calcular eficiência (gols por posse, turnovers por posse) por fase.

**Uso prático:** Comissão não mexe em `event_types` no dia a dia; apenas escolhe tipos já cadastrados ao lançar eventos. Coordenador ou analista responsável garante lista enxuta, padronizada e estável de tipos para toda temporada.

---

### 6.1.8. Tabela: event_subtypes

**Responsabilidade:** Detalha tipos de evento em nível "cirúrgico". Se `event_types` diz que lance é arremesso, falta ou turnover, `event_subtypes` diz exatamente que tipo.

| Campo | Tipo | Validação | Forma de entrada | Obrigatoriedade |
|-------|------|-----------|------------------|-----------------|
| code | VARCHAR(64) | PK único | não editável após uso | obrigatório |
| event_type_code | VARCHAR(64) | FK event_types.code | select de tipos | obrigatório |
| description | VARCHAR(255) | texto curto | campo texto | obrigatório |

**Código estável:** Ex: `shot_6m`, `shot_9m`, `shot_wing`, `turnover_pass`, `offensive_foul`, `goalkeeper_pass_error` ligados a `event_type_code`.

**Papel da tabela:**
1. Padronizar vocabulário de scout, evitando que cada pessoa invente nome diferente.
2. Permitir análises finas (aproveitamento por zona de arremesso, tipos de perda de bola, tipos de faltas).
3. Servir de base para filtros avançados (ex: ver todos `shot_wing` perdidos em inferioridade numérica).

**Uso prático:** Analista escolhe primeiro `event_type` (ex: "Arremesso"), frontend carrega, a partir de `event_subtypes`, só subtipos compatíveis ("Arremesso 6m", "Arremesso 9m", "Arremesso de Ponta"). Código fica gravado em `match_events.event_subtype`.

**Importante:** Comissão não deve editar essa lista no dia a dia; é definida e congelada antes da temporada para garantir consistência estatística.

---

### 6.1.9. Tabela: phases_of_play

**Responsabilidade:** Mapa oficial das quatro fases do jogo. Define, de forma padronizada, como sistema entende cada momento: defesa, transição ofensiva, ataque posicional, transição defensiva.

| Campo | Tipo | Validação | Forma de entrada | Obrigatoriedade |
|-------|------|-----------|------------------|-----------------|
| code | VARCHAR(32) | PK único (defense, transition_offense, attack_positional, transition_defense) | não editável | obrigatório |
| description | VARCHAR(255) | descrição da fase | texto informativo | obrigatório |

**Campo `code`:** Valor técnico gravado em `match_events.phase_of_play` e usado em filtros, relatórios, dashboards. Fixo: `defense`, `transition_offense`, `attack_positional`, `transition_defense`.

**Campo `description`:** Texto explicativo ajudando comissão a entender quando considerar ação como transição ou já como ataque posicional.

**Uso prático:** Sempre que analista registra lance em `match_events`, escolhe fase do jogo: se time está montado atrás da linha de 9m → `defense`; se recuperou bola e sai rápido → `transition_offense`; se já está organizado construindo jogada → `attack_positional`; se perdeu bola e volta para recompor → `transition_defense`.

**Relatórios:** Dashboards usam esses códigos para mostrar desempenho separado em cada fase: eficiência defensiva, qualidade das transições, produtividade do ataque posicional, consistência na transição defensiva.

**Finalidade:** Garante que todo mundo fale a mesma língua sobre fases do jogo e permite que sistema analise equipe exatamente como staff de alto rendimento enxerga partida.

---

### 6.1.10. Tabela: advantage_states

**Responsabilidade:** Jeito oficial do sistema marcar se, naquele momento, estamos em igualdade numérica, superioridade ou inferioridade. Define "estados de vantagem" usados em `match_events.advantage_state` e em análises táticas.

| Campo | Tipo | Validação | Forma de entrada | Obrigatoriedade |
|-------|------|-----------|------------------|-----------------|
| code | VARCHAR(32) | PK único (even, numerical_superiority, numerical_inferiority) | select em formulários | obrigatório |
| delta_players | SMALLINT | inteiro pequeno (0, +1, -1) | input restrito | obrigatório |
| description | VARCHAR(255) | texto explicativo | opcional | opcional |

**Campo `code`:** Rótulo técnico: `even` (6x6 normal), `numerical_superiority` (jogamos com mais uma), `numerical_inferiority` (jogamos com uma a menos).

**Campo `delta_players`:** Traduz em número: 0, +1, -1 (pode ser expandido se necessário).

**Campo `description`:** Explica em linguagem simples o que significa cada estado.

**Uso prático:** Quando analista lança evento em `match_events`, seleciona `advantage_state` adequado com base em exclusões/suspensões vigentes naquele momento. Relatórios mostram, por exemplo, como equipe defende em inferioridade, ataca em superioridade e mantém padrão em igualdade.

**Finalidade:** Fundamental para treinador-chefe avaliar eficácia de defesa, transição e ataque em diferentes cenários numéricos, sem interpretação manual lance a lance.

---

### 6.1.11. Tabela: match_periods

**Responsabilidade:** Define "estrutura oficial de tempo" dos jogos. Não guarda lances nem placar, mas diz quantos períodos existem, quanto tempo dura cada um e que tipo (tempo normal, prorrogação ou disputa de 7m). Referência para validar tudo que usa tempo.

| Campo | Tipo | Validação | Forma de entrada | Obrigatoriedade |
|-------|------|-----------|------------------|-----------------|
| id | UUID | PK gen_random_uuid() | não editável | obrigatório |
| match_id ou competition_format_id | UUID | FK conforme modelo | select/derivado | obrigatório |
| number | SMALLINT | ≥ 1 | select | obrigatório |
| duration_seconds | INTEGER | > 0 | input (ex: 1800) | obrigatório |
| period_type | VARCHAR(32) | enum (regular, extra_time, shootout_7m) | select | obrigatório |

**Funcionamento:** Cada linha liga formato de jogo a período específico: `number` indica se é 1º tempo, 2º tempo, prorrogação; `duration_seconds` define duração máxima; `period_type` diferencia tempo regular, prorrogação ou série de 7m.

**Validação:** Quando analista registra eventos em `match_events` ou sistema monta posses em `match_possessions`, usa essa tabela para validar `period_number` e `game_time_seconds` (não deixar lançar lance "fora do tempo"), calcular quanto resta no período e separar estatísticas por tempo.

**Uso pela comissão:** Uso indireto; coordenador/administrador define períodos de cada competição uma vez (ex: jogos sub-16 com 2×25 min, finais com eventual prorrogação, shootout em caso de empate) e, a partir daí, tudo no painel respeita essa estrutura.

**Relatórios:** Permite quebrar desempenho por período (1º tempo × 2º tempo × prorrogação) sem treinador precisar configurar manualmente a cada jogo.

---

### 6.1.12. Tabela: training_sessions

**Responsabilidade:** Registro oficial de treinos. Controla data, duração, tipo, objetivo, carga planejada e clima do grupo. Base para carga, assiduidade e análise.

| Campo | Tipo | Validação | Forma de entrada | Obrigatoriedade |
|-------|------|-----------|------------------|-----------------|
| id | UUID | PK gen_random_uuid() | não editável | obrigatório |
| organization_id | UUID | FK organizations.id | herdado do contexto | obrigatório |
| team_id | UUID | FK teams.id | select de equipes; pode ser null | opcional |
| season_id | UUID | FK seasons.id; se informada, deve ser temporada da equipe | select de temporadas | opcional |
| session_at | TIMESTAMPTZ | data/hora válida UTC | date+time picker | obrigatório |
| duration_planned_minutes | SMALLINT | > 0 | campo numérico (minutos previstos) | opcional |
| location | VARCHAR(120) | max 120 chars | texto curto | opcional |
| session_type | VARCHAR(32) | enum (quadra, físico, vídeo, reunião, teste) | select opções fixas | obrigatório |
| main_objective | VARCHAR(255) | texto curto | campo texto | opcional |
| secondary_objective | TEXT | texto livre | textarea | opcional |
| planned_load | SMALLINT | ≥ 0 (carga planejada em AU) | campo numérico + help-text | opcional |
| group_climate | SMALLINT | 1–5 | input de escala (radio/slider) | opcional |
| notes | TEXT | livre | textarea | opcional |
| created_at | TIMESTAMPTZ | default now() | somente leitura | obrigatório |
| created_by_user_id | UUID | FK users.id | automático | obrigatório |
| updated_at | TIMESTAMPTZ | atualizado por trigger | somente leitura | obrigatório |
| deleted_at | TIMESTAMPTZ | soft delete | somente leitura | opcional |
| deleted_reason | TEXT | obrigatório quando deleted_at NOT NULL | textarea | opcional |
| phase_focus_defense | BOOLEAN ou SMALLINT | foco em defesa | checkbox ou escala 0–3 | opcional |
| phase_focus_attack | BOOLEAN ou SMALLINT | foco em ataque posicional | checkbox ou escala 0–3 | opcional |
| phase_focus_transition_offense | BOOLEAN ou SMALLINT | foco em transição ofensiva | checkbox ou escala 0–3 | opcional |
| phase_focus_transition_defense | BOOLEAN ou SMALLINT | foco em transição defensiva | checkbox ou escala 0–3 | opcional |
| intensity_target | SMALLINT | 1–5 | intensidade planejada do treino | opcional |
| session_block | VARCHAR(32) | tag de periodização (base_fisica, pre_competitivo, competitivo, recuperacao) | select | opcional |

**V1.2 Atualização:** `team_id` e `season_id` são opcionais. Treinos podem existir sem equipe (para organização toda, avaliações, captação) - ver R37, RD5 (TABELAS BANCO.txt).

**Uso prático:** Treinador cria treino (`training_sessions`), sistema gera lista de presença via `team_registrations` para comissão marcar (`attendance`), atleta logado vê treinos do dia e responde `wellness_pre` antes e `wellness_post` depois.

---

### 6.1.13. Tabela: attendance

**Responsabilidade:** Presença por treino. Registra quem compareceu, quanto tempo participou e observações. Base para métricas de assiduidade.

| Campo | Tipo | Validação | Forma de entrada | Obrigatoriedade |
|-------|------|-----------|------------------|-----------------|
| id | UUID | PK gen_random_uuid() | não editável | obrigatório |
| training_session_id | UUID | FK training_sessions.id | herdado do contexto | obrigatório |
| team_registration_id | UUID | FK team_registrations.id; deve estar ativo na data | automático da lista | obrigatório |
| athlete_id | UUID | FK athletes.id; deve bater com team_registrations.athlete_id | exibido como nome/foto | obrigatório |
| presence_status | VARCHAR(32) | enum (present, absent) | select/toggle | obrigatório |
| minutes_effective | SMALLINT | ≥ 0 | campo numérico; pode sugerir default=duração prevista | opcional |
| comment | TEXT | livre | textarea para justificativas | opcional |
| source | VARCHAR(32) | enum (manual, import, correction) | setado pelo backend | obrigatório |
| created_at | TIMESTAMPTZ | default now() | somente leitura | obrigatório |
| created_by_user_id | UUID | FK users.id | automático | obrigatório |
| updated_at | TIMESTAMPTZ | atualizado por trigger | somente leitura | obrigatório |
| deleted_at | TIMESTAMPTZ | soft delete | somente leitura | opcional |
| deleted_reason | TEXT | obrigatório quando deleted_at NOT NULL | textarea | opcional |
| participation_type | VARCHAR(32) | enum (full, partial, adapted, did_not_train) | select | opcional |
| reason_absence | VARCHAR(32) | enum (medico, escola, familiar, opcional, outro) | select | opcional |
| is_medical_restriction | BOOLEAN | marca se ausência/adaptação veio de orientação médica | checkbox | opcional |

**Uso prático:** Ao criar treino para equipe, sistema gera automaticamente lista de atletas vinculadas àquela equipe (via `team_registrations` ativos) como "presença a marcar". Após treino, responsável (Dirigente, Coordenador, Treinador) marca presença individual. Ausências impactam assiduidade e podem acionar alertas.

**V1.2 Complemento:** Não existe "convocação formal" para treinos; estar vinculado à equipe garante inclusão automática na lista de presença.

**Métricas DM/lesionadas:** Vêm das flags da atleta cruzadas com essa presença, não de novos estados na tabela.

---

### 6.1.14. Tabela: wellness_pre

**Responsabilidade:** Bem-estar pré-treino. Atleta preenche antes do treino (1 por atleta × sessão). Usado para monitorar estado físico/psicológico antes da atividade.

| Campo | Tipo | Validação | Forma de entrada | Obrigatoriedade |
|-------|------|-----------|------------------|-----------------|
| id | UUID | PK gen_random_uuid() | não editável | obrigatório |
| organization_id | UUID | FK organizations.id | herdado do contexto | obrigatório |
| training_session_id | UUID | FK training_sessions.id | herdado do treino | obrigatório |
| athlete_id | UUID | FK athletes.id; deve ser atleta logado | não aparece como input | obrigatório |
| sleep_hours | NUMERIC(4,1) | 0–24 (ex: 7.5) | input numérico step 0.5 | obrigatório |
| sleep_quality | SMALLINT | 1–5 | radio/slider (muito ruim → muito boa) | obrigatório |
| fatigue_pre | SMALLINT | 0–10 | slider ou select | obrigatório |
| stress_level | SMALLINT | 0–10 | slider ou select | obrigatório |
| muscle_soreness | SMALLINT | 0–10 | slider ou select | obrigatório |
| notes | TEXT | livre (ex: "dor no ombro direito") | textarea curta opcional | opcional |
| filled_at | TIMESTAMPTZ | default now() | somente leitura; quando envia | obrigatório |
| created_at | TIMESTAMPTZ | default now() | somente leitura | obrigatório |
| created_by_user_id | UUID | FK users.id (normalmente próprio atleta) | automático | obrigatório |
| updated_at | TIMESTAMPTZ | atualizado por trigger | somente leitura | obrigatório |
| deleted_at | TIMESTAMPTZ | soft delete | somente leitura | opcional |
| deleted_reason | TEXT | obrigatório quando deleted_at NOT NULL | textarea | opcional |
| menstrual_cycle_phase | VARCHAR(32) | enum (folicular, lutea, menstruacao, nao_informa) | select opcional | opcional |
| readiness_score | SMALLINT | 0–10 | cálculo interno do sistema | opcional |

**Regra de backend:** `UNIQUE (training_session_id, athlete_id)` para evitar múltiplos pré-treinos no mesmo dia.

**V1.2 Atualização:** Atleta loga, vê treinos em que está vinculado e responde `wellness_pre` diretamente no sistema (sem Google Forms externos).

---

### 6.1.15. Tabela: wellness_post

**Responsabilidade:** Bem-estar pós-treino. Atleta preenche depois do treino. Usado para monitorar esforço percebido (PSE), fadiga e humor após atividade.

| Campo | Tipo | Validação | Forma de entrada | Obrigatoriedade |
|-------|------|-----------|------------------|-----------------|
| id | UUID | PK gen_random_uuid() | não editável | obrigatório |
| organization_id | UUID | FK organizations.id | herdado do contexto | obrigatório |
| training_session_id | UUID | FK training_sessions.id | herdado do treino | obrigatório |
| athlete_id | UUID | FK athletes.id; deve ser atleta logado | não editável na UI | obrigatório |
| session_rpe | SMALLINT | 0–10 (PSE geral da sessão) | slider 0–10 com descrições âncora | obrigatório |
| fatigue_after | SMALLINT | 0–10 (fadiga pós-treino) | slider ou select | obrigatório |
| mood_after | SMALLINT | 0–10 (humor pós-treino) | slider ou select | obrigatório |
| muscle_soreness_after | SMALLINT | 0–10 | slider ou select | opcional |
| notes | TEXT | texto livre (dores, tontura, algo diferente) | textarea | opcional |
| filled_at | TIMESTAMPTZ | default now() | somente leitura; momento do envio | obrigatório |
| created_at | TIMESTAMPTZ | default now() | somente leitura | obrigatório |
| created_by_user_id | UUID | FK users.id (normalmente atleta) | automático | obrigatório |
| updated_at | TIMESTAMPTZ | atualizado por trigger | somente leitura | obrigatório |
| deleted_at | TIMESTAMPTZ | soft delete | somente leitura | opcional |
| deleted_reason | TEXT | obrigatório quando deleted_at NOT NULL | textarea | opcional |
| perceived_intensity | SMALLINT | 1–5 (leve, moderado, pesado, muito pesado, exaustivo) | select | opcional |
| flag_medical_followup | BOOLEAN | campo calculado: true quando combinação acende alerta para comissão médica | automático | opcional |

**Regra de backend:** `UNIQUE (training_session_id, athlete_id)` aqui também.

**Fluxo completo:** Treinador cria treino → sistema gera lista de presença → atleta logado vê treinos do dia e responde `wellness_pre` antes e `wellness_post` depois. Tudo alimenta diretamente views de treino/bem-estar, sem precisar de formulários externos.

---

## 7. Organização das Regras por Camada de Configuração

### 7.1 Apenas no DB
- **R:** R4, R19, R28, R34
- **RDB:** RDB1, RDB2, RDB2.1, RDB3, RDB4, RDB4.1, RDB5, RDB6, RDB7, RDB8, RDB9, RDB10, RDB11, RDB12, RDB13, RDB14, RDB15, RDB16, RDB17, RDB18

### 7.2 DB + Backend
- **R:** R1, R2, R3, R5, R6, R7, R8, R8.1, R10, R11, R12, R14, R15, R16, R18, R22, R23, R24, R27, R29, R30, R31, R32, R33, R35, R36, R37
- **RF:** RF2
- **RD:** RD1, RD2, RD2.1, RD13 (validação de bloqueios)

### 7.3 Apenas no Backend
- **R:** R9, R20, R21, R25, R26, R41
- **RF:** RF21, RF31
- **RD:** RD3, RD5, RD7, RD8, RD9, RD10, RD14, RD15, RD18, RD20, RD27, RD30, RD33, RD34, RD38, RD40, RD42, RD49, RD50, RD51, RD52, RD53, RD54, RD58, RD60, RD61, RD63, RD64, RD66, RD67, RD68, RD69, RD70, RD71, RD72, RD74, RD76, RD79, RD86, RD87, RD88, RD90, RD91
- **RP:** RP1, RP2, RP4, RP5, RP6, RP9, RP13, RP15, RP19, RP20

### 7.4 Backend + Frontend
- **R:** R9, R13, R17, R38, R39, R40
- **RF:** RF1, RF1.1, RF3, RF4, RF5, RF6, RF7, RF8, RF9, RF10, RF11, RF12, RF13, RF14, RF15, RF16, RF17, RF18, RF19, RF20, RF22, RF23, RF24, RF25, RF26, RF27, RF28, RF29, RF30
- **RD:** RD4, RD6, RD11, RD12, RD13 (UX bloqueios), RD16, RD17, RD19, RD21, RD22, RD23, RD24, RD25, RD26, RD28, RD29, RD31, RD32, RD35, RD36, RD37, RD39, RD41, RD43, RD44, RD45, RD46, RD47, RD48, RD55, RD56, RD57, RD59, RD62, RD65, RD73, RD75, RD77, RD78, RD80, RD81, RD82, RD83, RD84, RD85, RD89
- **RP:** RP3, RP7, RP8, RP10, RP11, RP12, RP14, RP16, RP17, RP18
- **Visibilidade do Perfil Atleta:** itens 1 a 10 e Regra-síntese (Atleta)

### 7.5 Apenas no Front
- Nenhuma

---

**FIM DO DOCUMENTO V1.2**
