-- =====================================================
-- CORREÇÃO COMPLETA: Sistema de Autenticação e Autorização
-- Data: 30/12/2025
-- Ambiente: DEV
-- Conformidade: REGRAS.md V1.2
-- =====================================================

BEGIN;

-- =====================================================
-- PARTE 1: CORRIGIR TABELA ROLES
-- =====================================================

-- 1. Adicionar trigger de updated_at (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trg_roles_updated_at' 
        AND event_object_table = 'roles'
    ) THEN
        CREATE TRIGGER trg_roles_updated_at 
            BEFORE UPDATE ON roles 
            FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
        RAISE NOTICE 'Trigger trg_roles_updated_at criado com sucesso';
    ELSE
        RAISE NOTICE 'Trigger trg_roles_updated_at já existe';
    END IF;
END $$;

-- 2. Preencher descrições dos papéis (conforme REGRAS.md)
UPDATE roles SET description = 'R4: Gestor máximo da organização. Gerencia clubes, equipes, temporadas, dirigentes e coordenadores. Não tem hierarquia sobre treinadores técnicos.' WHERE code = 'dirigente';
UPDATE roles SET description = 'R4: Gestor de equipes específicas. Intermedia dirigente e treinadores. Não tem autoridade sobre aspectos técnicos de treino e jogo.' WHERE code = 'coordenador';
UPDATE roles SET description = 'R4: Responsável técnico de equipe(s). Gerencia treinos, jogos, convocações e análises táticas. Não gerencia atletas de outras equipes.' WHERE code = 'treinador';
UPDATE roles SET description = 'R4: Praticante do esporte. Pode ter vínculos com múltiplas equipes simultaneamente (V1.2). Acesso opcional ao sistema para consulta de wellness e estatísticas.' WHERE code = 'atleta';

-- 3. Adicionar comentários
COMMENT ON TABLE roles IS 'R4: Papéis do sistema. Lookup table técnica (sem soft delete). Papéis fixos: Dirigente, Coordenador, Treinador, Atleta.';
COMMENT ON COLUMN roles.code IS 'Código único do papel (dirigente, coordenador, treinador, atleta).';
COMMENT ON COLUMN roles.description IS 'Descrição detalhada das responsabilidades do papel conforme REGRAS.md.';


-- =====================================================
-- PARTE 2: POPULAR TABELA PERMISSIONS (65 permissões)
-- =====================================================

-- Limpar tabela (em DEV, seguro fazer isso)
TRUNCATE TABLE role_permissions CASCADE;
TRUNCATE TABLE permissions CASCADE;

-- Inserir todas as 65 permissões
INSERT INTO permissions (id, code, description) VALUES
-- Gestão de Pessoas (R1, R2)
(1, 'persons.create', 'Criar pessoas no sistema'),
(2, 'persons.read', 'Visualizar pessoas'),
(3, 'persons.update', 'Atualizar dados de pessoas'),
(4, 'persons.delete', 'Soft delete de pessoas'),

-- Gestão de Atletas (R11, R12, R13)
(5, 'athletes.create', 'Cadastrar atletas'),
(6, 'athletes.read', 'Visualizar atletas'),
(7, 'athletes.update', 'Atualizar dados de atletas'),
(8, 'athletes.delete', 'Soft delete de atletas'),
(9, 'athletes.state_change', 'Mudar estado de atleta (ativa/dispensada/arquivada)'),

-- Gestão de Equipes (RF6, RF8)
(10, 'teams.create', 'Criar equipes'),
(11, 'teams.read', 'Visualizar equipes'),
(12, 'teams.update', 'Atualizar equipes'),
(13, 'teams.delete', 'Soft delete de equipes'),

-- Gestão de Organizações (R33, RF1)
(14, 'organizations.create', 'Criar organizações (clubes)'),
(15, 'organizations.read', 'Visualizar organizações'),
(16, 'organizations.update', 'Atualizar organizações'),
(17, 'organizations.delete', 'Soft delete de organizações'),

-- Gestão de Temporadas (RF4, RF5)
(18, 'seasons.create', 'Criar temporadas'),
(19, 'seasons.read', 'Visualizar temporadas'),
(20, 'seasons.update', 'Atualizar temporadas'),
(21, 'seasons.delete', 'Soft delete de temporadas'),
(22, 'seasons.cancel', 'Cancelar temporada (pré-início)'),
(23, 'seasons.interrupt', 'Interromper temporada (força maior)'),

-- Gestão de Treinos (R17, RF9, RF12)
(24, 'training_sessions.create', 'Criar treinos'),
(25, 'training_sessions.read', 'Visualizar treinos'),
(26, 'training_sessions.update', 'Atualizar treinos'),
(27, 'training_sessions.delete', 'Soft delete de treinos'),

-- Presença/Frequência (RF10, RP5, RP6)
(28, 'attendance.create', 'Registrar presença'),
(29, 'attendance.read', 'Visualizar presença'),
(30, 'attendance.update', 'Atualizar presença'),
(31, 'attendance.delete', 'Soft delete de presença'),

-- Wellness (Bem-estar) (Seção 4 - Visibilidade Atleta)
(32, 'wellness.read', 'Visualizar wellness de atletas'),
(33, 'wellness.read_own', 'Atleta visualizar próprio wellness'),
(34, 'wellness.create_pre', 'Registrar wellness pré-treino'),
(35, 'wellness.create_post', 'Registrar wellness pós-treino'),

-- Jogos (R18, RF14, RF15)
(36, 'matches.create', 'Criar jogos'),
(37, 'matches.read', 'Visualizar jogos'),
(38, 'matches.update', 'Atualizar jogos'),
(39, 'matches.delete', 'Soft delete de jogos'),
(40, 'matches.reopen', 'Reabrir jogo finalizado'),

-- Eventos de Jogo (RD6, RD11, RD12)
(41, 'match_events.create', 'Registrar eventos de jogo'),
(42, 'match_events.read', 'Visualizar eventos'),
(43, 'match_events.update', 'Atualizar eventos'),

-- Súmula/Convocação (RD4, RF11, RP3)
(44, 'match_roster.create', 'Criar súmula/convocação'),
(45, 'match_roster.read', 'Visualizar súmula'),
(46, 'match_roster.update', 'Atualizar súmula'),

-- Usuários e Acessos (R2, R3, RF1)
(47, 'users.create', 'Criar usuários'),
(48, 'users.read', 'Visualizar usuários'),
(49, 'users.update', 'Atualizar usuários'),
(50, 'users.delete', 'Soft delete de usuários'),
(51, 'users.lock', 'Bloquear/desbloquear usuários'),

-- Vínculos Organizacionais (R6, RF1.1, RF17)
(52, 'org_memberships.create', 'Criar vínculos organizacionais (staff)'),
(53, 'org_memberships.read', 'Visualizar vínculos'),
(54, 'org_memberships.update', 'Atualizar vínculos'),
(55, 'org_memberships.delete', 'Soft delete de vínculos'),

-- Vínculos de Atletas em Equipes (R7, R16, RD9)
(56, 'team_registrations.create', 'Registrar atleta em equipe'),
(57, 'team_registrations.read', 'Visualizar registros de atletas'),
(58, 'team_registrations.update', 'Atualizar registros'),
(59, 'team_registrations.delete', 'Soft delete de registros'),

-- Relatórios e Análises (RD85, RD86)
(60, 'reports.training', 'Visualizar relatórios de treino'),
(61, 'reports.matches', 'Visualizar relatórios de jogos'),
(62, 'reports.wellness', 'Visualizar relatórios de wellness'),
(63, 'reports.athletes', 'Visualizar relatórios de atletas'),

-- Auditoria (R30, R31, R34)
(64, 'audit_logs.read', 'Visualizar logs de auditoria'),

-- Super Admin (R3)
(65, 'admin.full_access', 'Acesso total ao sistema (Super Admin)');

-- Adicionar trigger de updated_at em permissions (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trg_permissions_updated_at' 
        AND event_object_table = 'permissions'
    ) THEN
        CREATE TRIGGER trg_permissions_updated_at 
            BEFORE UPDATE ON permissions 
            FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
        RAISE NOTICE 'Trigger trg_permissions_updated_at criado com sucesso';
    ELSE
        RAISE NOTICE 'Trigger trg_permissions_updated_at já existe';
    END IF;
END $$;

-- Comentário na tabela
COMMENT ON TABLE permissions IS 'R24: Permissões do sistema. Aplicadas via papéis através de role_permissions.';


-- =====================================================
-- PARTE 3: CONFIGURAR ROLE_PERMISSIONS
-- =====================================================

-- ---------------------
-- PAPEL: DIRIGENTE (ID=1)
-- ---------------------
-- Gestão completa da organização (R4, R41)
INSERT INTO role_permissions (role_id, permission_id) VALUES
-- Organizações
(1, 14), (1, 15), (1, 16), (1, 17),
-- Equipes
(1, 10), (1, 11), (1, 12), (1, 13),
-- Temporadas
(1, 18), (1, 19), (1, 20), (1, 21), (1, 22), (1, 23),
-- Pessoas e Atletas
(1, 1), (1, 2), (1, 3), (1, 4),
(1, 5), (1, 6), (1, 7), (1, 8), (1, 9),
-- Vínculos Organizacionais (Staff)
(1, 52), (1, 53), (1, 54), (1, 55),
-- Vínculos de Atletas
(1, 56), (1, 57), (1, 58), (1, 59),
-- Usuários
(1, 47), (1, 48), (1, 49), (1, 50), (1, 51),
-- Treinos e Presença
(1, 24), (1, 25), (1, 26), (1, 27),
(1, 28), (1, 29), (1, 30), (1, 31),
-- Wellness
(1, 32),
-- Jogos
(1, 36), (1, 37), (1, 38), (1, 39), (1, 40),
-- Eventos de Jogo
(1, 41), (1, 42), (1, 43),
-- Súmula
(1, 44), (1, 45), (1, 46),
-- Relatórios
(1, 60), (1, 61), (1, 62), (1, 63),
-- Auditoria
(1, 64);

-- ---------------------
-- PAPEL: COORDENADOR (ID=2)
-- ---------------------
-- Gestão de equipes e temporadas (R4, R41)
INSERT INTO role_permissions (role_id, permission_id) VALUES
-- Visualizar organizações e equipes
(2, 15), (2, 11),
-- Gestão de temporadas (sem cancelar/interromper)
(2, 18), (2, 19), (2, 20), (2, 21),
-- Gestão de atletas
(2, 5), (2, 6), (2, 7), (2, 8), (2, 9),
-- Pessoas (read/create)
(2, 1), (2, 2), (2, 3),
-- Vínculos de atletas
(2, 56), (2, 57), (2, 58), (2, 59),
-- Visualizar vínculos organizacionais
(2, 53),
-- Treinos e Presença
(2, 24), (2, 25), (2, 26), (2, 27),
(2, 28), (2, 29), (2, 30), (2, 31),
-- Wellness
(2, 32),
-- Jogos
(2, 36), (2, 37), (2, 38), (2, 39), (2, 40),
-- Eventos de Jogo
(2, 41), (2, 42), (2, 43),
-- Súmula
(2, 44), (2, 45), (2, 46),
-- Relatórios
(2, 60), (2, 61), (2, 62), (2, 63);

-- ---------------------
-- PAPEL: TREINADOR (ID=3)
-- ---------------------
-- Gestão técnica de equipe(s) específica(s) (R4, R25)
INSERT INTO role_permissions (role_id, permission_id) VALUES
-- Visualizar equipes e temporadas
(3, 11), (3, 19),
-- Visualizar atletas e pessoas
(3, 6), (3, 2),
-- Criar atletas e pessoas
(3, 5), (3, 1),
-- Treinos e Presença (gestão completa)
(3, 24), (3, 25), (3, 26), (3, 27),
(3, 28), (3, 29), (3, 30), (3, 31),
-- Wellness (visualizar)
(3, 32),
-- Jogos (gestão completa)
(3, 36), (3, 37), (3, 38), (3, 39),
-- Eventos de Jogo
(3, 41), (3, 42), (3, 43),
-- Súmula
(3, 44), (3, 45), (3, 46),
-- Visualizar registros de atletas
(3, 57),
-- Relatórios
(3, 60), (3, 61), (3, 62), (3, 63);

-- ---------------------
-- PAPEL: ATLETA (ID=4)
-- ---------------------
-- Acesso restrito aos próprios dados (Seção 4 - Visibilidade)
INSERT INTO role_permissions (role_id, permission_id) VALUES
-- Visualizar próprio perfil
(4, 2),
-- Wellness próprio
(4, 33), (4, 34), (4, 35),
-- Visualizar treinos e jogos
(4, 25), (4, 37),
-- Visualizar própria presença
(4, 29),
-- Visualizar súmula
(4, 45);

-- Comentário na tabela
COMMENT ON TABLE role_permissions IS 'R24: Junction table papel ↔ permissão. Define o que cada papel pode fazer no sistema conforme REGRAS.md V1.2.';


-- =====================================================
-- PARTE 4: REGISTRAR AUDITORIA
-- =====================================================

INSERT INTO audit_logs (
    entity,
    action,
    actor_id,
    context,
    justification,
    created_at
) VALUES (
    'system',
    'auth_system_fix',
    (SELECT id FROM users WHERE is_superadmin = true LIMIT 1),
    jsonb_build_object(
        'migration', 'fix_auth_system_dev',
        'date', '2025-12-30',
        'environment', 'DEV',
        'changes', jsonb_build_array(
            'roles: trigger updated_at + descrições',
            'permissions: 65 registros criados',
            'role_permissions: 4 papéis configurados'
        )
    ),
    'Correção completa do sistema de autenticação e autorização conforme REGRAS.md V1.2. Adicionadas 65 permissões e configurados 4 papéis.',
    now()
);

COMMIT;

-- =====================================================
-- PARTE 5: VALIDAÇÃO
-- =====================================================

-- Verificar roles
SELECT id, code, name, LEFT(description, 50) as desc FROM roles ORDER BY id;

-- Verificar permissões criadas
SELECT COUNT(*) as total_permissions FROM permissions;

-- Verificar permissões por papel
SELECT 
    r.code as papel,
    r.name,
    COUNT(rp.permission_id) as total_permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.code, r.name
ORDER BY r.id;

-- Verificar triggers
SELECT 
    trigger_name, 
    event_object_table
FROM information_schema.triggers 
WHERE event_object_table IN ('roles', 'permissions')
ORDER BY event_object_table, trigger_name;
