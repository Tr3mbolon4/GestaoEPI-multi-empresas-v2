# PRD - Sistema GestãoEPI Multi-Empresas

## Problema Original
Usuário solicitou alteração visual do sistema GestãoEPI:
1. Usar uma imagem específica como ícone/logo (sem alterar o design da imagem)
2. Atualizar as cores do painel/site para combinar com o logo

## Características do Logo
- Fundo cinza escuro (#1a1a1a)
- Letra "G" em prata/branco (#c0c0c0)
- Letra "E" em azul marinho (#2d3a4f)
- Texto "GESTÃO EPI" na parte inferior

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

## O Que Foi Implementado (24/03/2026)

### Visual/UI
- [x] Logo adicionado em /frontend/public/logo-gestao-epi.jpg
- [x] Favicon atualizado para usar o novo logo
- [x] Paleta de cores CSS atualizada em index.css
- [x] Sidebar atualizada com fundo escuro (#1a1a1a)
- [x] Botões e elementos com azul marinho (#2d3a4f)
- [x] Página de Login com novo visual
- [x] Página de Alteração de Senha com novo visual
- [x] Dashboard com cards atualizados
- [x] Header mobile com novo logo

### Arquivos Modificados
- /frontend/public/index.html (favicon, theme-color)
- /frontend/src/index.css (variáveis CSS, paleta)
- /frontend/src/pages/Login.js
- /frontend/src/pages/ChangePassword.js
- /frontend/src/pages/Dashboard.js
- /frontend/src/components/layout/Sidebar.js
- /frontend/src/components/layout/DashboardLayout.js
- /frontend/src/App.js

## Credenciais de Acesso
- **Super Admin**: superadmin / Super@2026!
- **Admin Demo**: admin / Admin@2026! (requer troca de senha)

## Próximas Tarefas (Backlog)

### P0 (Crítico)
- Nenhum

### P1 (Importante)
- Atualizar outras páginas para consistência visual completa
- Criar tema escuro opcional

### P2 (Nice to Have)
- Exportar tema como variáveis customizáveis
- Adicionar animações de transição

## URLs
- Preview: https://976ff7db-46af-469d-b365-669a756eb774.preview.emergentagent.com
