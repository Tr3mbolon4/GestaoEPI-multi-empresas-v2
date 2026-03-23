# PRD - GestorEPI v5.2.0

## Sistema de Gestão de Equipamentos de Proteção Individual - Multi-Tenant

### Original Problem Statement
Sistema de gestão de EPIs com arquitetura multiempresa (SaaS):
1. Renomear de "Cipolatti" para "GestorEPI"
2. Arquitetura Multi-Tenant com isolamento de dados
3. Painel Master para SUPER_ADMIN
4. Controle de planos e limites
5. Kits por setor + Alertas + Periodicidade + NBR

### User Personas
- **SUPER_ADMIN**: Dono do sistema - gerencia todas as empresas
- **Admin**: Administrador de uma empresa específica
- **Gestor**: Gestão de EPIs e entregas na empresa
- **RH**: Cadastro de colaboradores e empresas
- **Segurança do Trabalho**: Monitoramento de conformidade
- **Almoxarifado**: Operação de entregas

### What's Been Implemented (2026-03-23)

#### Fase 1: Renomear para GestorEPI
- ✅ Removido todas as referências a "Cipolatti"
- ✅ Atualizado título, logos e textos para "GestorEPI"
- ✅ Removido badge "Made with Emergent"

#### Fase 2: Arquitetura Multi-Tenant
- ✅ Criado perfil SUPER_ADMIN (dono do sistema)
- ✅ Criada coleção `empresas` com: nome, CNPJ, status, plano, limite
- ✅ Adicionado `empresa_id` em: users, employees, epis, kits, deliveries
- ✅ Filtros de isolamento em todos os endpoints
- ✅ Verificação de limite de colaboradores por plano
- ✅ Bloqueio de empresas (status = bloqueado)

#### Painel Master (SUPER_ADMIN)
- ✅ Página `/painel-master` com gestão de empresas
- ✅ Criar/Editar/Bloquear/Ativar empresas
- ✅ Definir planos: Starter(50), Basic(150), Professional(250), Enterprise(350), Unlimited
- ✅ Criar administrador para cada empresa
- ✅ Visualizar estatísticas de uso por empresa

### Credenciais de Acesso

**SUPER_ADMIN (Painel Master):**
- Usuário: `superadmin`
- Senha: `Super@2026!`

**Admin Empresa Demo:**
- Usuário: `admin`
- Senha: `Admin@2026!`

### Tech Stack
- **Frontend**: React 18, TailwindCSS, shadcn/ui
- **Backend**: FastAPI, Python 3.11
- **Database**: MongoDB (Multi-Tenant)
- **Biometria**: face-api.js

### API Endpoints Novos
```
# Empresas (SUPER_ADMIN)
GET  /api/empresas
POST /api/empresas
GET  /api/empresas/{id}
PATCH /api/empresas/{id}
POST /api/empresas/{id}/bloquear
POST /api/empresas/{id}/ativar
POST /api/empresas/{id}/criar-admin
GET  /api/empresas/{id}/stats
```

### Prioritized Backlog

#### P0 - Concluído
- [x] Fase 1: Renomear para GestorEPI
- [x] Fase 2: Multi-Tenant básico

#### P1 - Próximas Fases
- [ ] Fase 3: Painel Master completo (relatórios por empresa)
- [ ] Fase 4: Controle de planos avançado
- [ ] Fase 5: Notificações por email

#### P2 - Backlog
- [ ] Backup automático diário
- [ ] Dashboard de conformidade LGPD
- [ ] Exportação de dados por empresa
