# PRD - Sistema GestãoEPI Multi-Empresas

## Problema Original
Sistema de Gestão de EPIs Multi-Empresas com:
1. Atualização visual do logo e cores do painel
2. Correção de regras de isolamento multi-empresa

## Arquitetura do Sistema
- **Frontend**: React 19 + Tailwind CSS + Radix UI
- **Backend**: FastAPI + Motor (MongoDB async)
- **Database**: MongoDB
- **Autenticação**: JWT com bcrypt

## Funcionalidades Existentes
- Multi-tenant (múltiplas empresas)
- Gestão de colaboradores, EPIs, Kits, Fornecedores
- Entregas com reconhecimento facial (face-api.js)
- Relatórios PDF/Excel
- Controle de estoque e alertas
- Dashboard com estatísticas
- Painel Master para super_admin
- Conformidade LGPD

---

## Implementações Realizadas

### 1. Atualização Visual (24/03/2026)

**Logo e Cores:**
- Logo adicionado em `/frontend/public/logo-gestao-epi.jpg`
- Favicon atualizado
- Paleta de cores: cinza escuro (#1a1a1a), prata (#c0c0c0), azul marinho (#2d3a4f)
- Sidebar com fundo escuro
- Páginas atualizadas: Login, ChangePassword, Dashboard, DashboardLayout

### 2. Correção de Isolamento Multi-Empresa (24/03/2026)

**Problema:**
- Fornecedores com mesmo CNPJ eram bloqueados globalmente (deveria ser por empresa)
- Algumas rotas não filtravam dados por empresa

**Solução - Índices MongoDB:**
- Removidos índices únicos globais: `cnpj_1`, `cpf_1`, `internal_code_1`, `qr_code_1`
- Criados índices compostos:
  - `suppliers: cnpj + empresa_id (unique)`
  - `employees: cpf + empresa_id (unique)`
  - `epis: internal_code + empresa_id (unique)`
  - `epis: qr_code + empresa_id (unique)`

**Solução - Backend:**
- Adicionada validação de CNPJ duplicado por empresa em `create_supplier`
- Corrigidas rotas de EPIs (update, delete) com filtro `empresa_id`
- Corrigidas rotas de Kits (get, update, delete) com filtro `empresa_id`
- Corrigidas rotas de Employees (update, delete, photo) com filtro `empresa_id`
- Corrigidas rotas de Deliveries com validação de colaborador/EPI/Kit por empresa
- Adicionado `empresa_id` nos movimentos de estoque

**Regras Implementadas:**
- ✅ Isolamento total entre empresas
- ✅ Mesmo CNPJ permitido em empresas diferentes
- ✅ Duplicidade bloqueada apenas dentro da mesma empresa
- ✅ Cada empresa vê apenas seus próprios dados

---

## Credenciais de Acesso
- **Super Admin**: superadmin / Super@2026!
- **Admin Demo**: admin / Admin@2026! (requer troca de senha)
- **Admin Cipolatti**: admin_cipo / Admin2@2026!

## URLs
- Preview: https://976ff7db-46af-469d-b365-669a756eb774.preview.emergentagent.com

---

## Backlog

### P0 (Crítico)
- Nenhum

### P1 (Importante)
- Aplicar consistência visual em todas as páginas
- Adicionar logs de auditoria para operações multi-tenant

### P2 (Nice to Have)
- Tema escuro completo
- Relatórios comparativos entre filiais (para super_admin)
