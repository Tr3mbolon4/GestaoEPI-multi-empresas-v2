# Auditoria de seguranca preliminar

Data: 2026-08-03

| Item | Severidade | Acao nesta branch |
|---|---:|---|
| `SECRET_KEY` com fallback hardcoded | Alta | Removido; variavel de ambiente obrigatoria |
| Senhas padrao no seed | Alta | Movidas para variaveis de ambiente |
| Backup JSON com hashes e dados de demonstracao | Alta | Removido do conteudo atual |
| Uploads/fotos de colaboradores e entregas | Alta | Removidos do conteudo atual |
| PRD interno e relatorios de teste | Media | Removidos do conteudo atual |
| Testes gerados com credenciais hardcoded | Media | Removidos do conteudo atual |
| Arquivos `.backup` | Media | Removidos do conteudo atual |

## Pendencias

- Limpar historico Git antigo.
- Confirmar se a versao antiga deve permanecer publica.
- Rotacionar credenciais antigas se usadas fora de ambiente demonstrativo.
- Comparar com versoes mais recentes antes de promover no portfolio.
