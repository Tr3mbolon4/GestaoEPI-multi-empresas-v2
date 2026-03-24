# PRD - GestorEPI v5.3.0

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

### What's Been Implemented

#### Fase 1: Renomear para GestorEPI ✅
- ✅ Removido todas as referências a "Cipolatti"
- ✅ Atualizado título, logos e textos para "GestorEPI"
- ✅ Removido badge "Made with Emergent"

#### Fase 2: Arquitetura Multi-Tenant ✅
- ✅ Criado perfil SUPER_ADMIN (dono do sistema)
- ✅ Criada coleção `empresas` com: nome, CNPJ, status, plano, limite
- ✅ Adicionado `empresa_id` em: users, employees, epis, kits, deliveries
- ✅ Filtros de isolamento em todos os endpoints
- ✅ Verificação de limite de colaboradores por plano
- ✅ Bloqueio de empresas (status = bloqueado)

#### Fase 3: Painel Master Completo (2026-03-24) ✅
- ✅ Dashboard Master com métricas gerais do sistema
- ✅ Relatórios detalhados por empresa (entregas, EPIs, colaboradores)
- ✅ Top EPIs mais entregues por empresa
- ✅ Top colaboradores com mais entregas
- ✅ Exportação de relatórios em PDF
- ✅ Exportação de relatórios em Excel
- ✅ Interface com abas: Empresas, Alertas, Backup, Relatórios

#### Fase 4: Controle de Planos Avançado (2026-03-24) ✅
- ✅ Alertas de limite (warning 80%, critical 90%, blocked 100%)
- ✅ Histórico de mudanças de plano com registro automático
- ✅ Controle de vigência (data início/fim do plano)
- ✅ Atualização de plano com motivo obrigatório
- ✅ Visualização de uso percentual do plano

#### Backup do Sistema (2026-03-24) ✅
- ✅ Criação de backup manual (JSON com todas coleções)
- ✅ Listagem de backups disponíveis
- ✅ Download de backups
- ✅ Exclusão de backups
- ✅ Limpeza automática de backups > 7 dias

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

### API Endpoints

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

# Painel Master (SUPER_ADMIN) - NOVOS
GET  /api/master/dashboard                      # Dashboard geral
GET  /api/master/alertas-limite                 # Alertas de limite
GET  /api/master/empresas/{id}/relatorio        # Relatório detalhado
GET  /api/master/empresas/{id}/export/pdf       # Exportar PDF
GET  /api/master/empresas/{id}/export/excel     # Exportar Excel
GET  /api/master/empresas/{id}/historico-planos # Histórico de planos
PATCH /api/master/empresas/{id}/plano           # Atualizar plano
GET  /api/master/empresas/{id}/vigencia         # Vigência do plano

# Backup (SUPER_ADMIN)
POST /api/master/backup                         # Criar backup
GET  /api/master/backups                        # Listar backups
GET  /api/master/backups/{id}/download          # Download backup
DELETE /api/master/backups/{id}                 # Excluir backup
```

### Prioritized Backlog

#### P0 - Concluído ✅
- [x] Fase 1: Renomear para GestorEPI
- [x] Fase 2: Multi-Tenant básico
- [x] Fase 3: Painel Master completo (relatórios por empresa)
- [x] Fase 4: Controle de planos avançado
- [x] Backup automático diário

#### P1 - Próximas Fases
- [ ] Fase 5: Notificações por email
- [ ] Dashboard de conformidade LGPD

#### P2 - Backlog
- [ ] Relatórios avançados com gráficos
- [ ] Integração com sistemas externos
- [ ] App mobile
