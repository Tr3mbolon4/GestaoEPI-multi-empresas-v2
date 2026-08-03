# GestaoEPI Multi Empresas V2

Versao antiga do sistema GestaoEPI com foco em multiempresa, controle de colaboradores, EPIs, fornecedores, kits, entregas, relatorios e recursos de rastreabilidade operacional.

> Status: repositorio historico em organizacao profissional. A versao principal mais recente parece estar nos repositorios `GestorEPI-multiempresas-v5-9` e `GestaoEPI-V5.1.0-NOVO-01`.

## Tecnologias Identificadas

- Python
- FastAPI
- MongoDB
- React
- Tailwind CSS
- face-api.js
- html5-qrcode

## Configuracao

Use `.env.example` como base e defina segredos reais somente em ambiente seguro.

Nunca versione `.env`, bancos de dados, backups, fotos reais, templates biometricos, CPFs, dados de colaboradores, documentos internos ou relatorios de teste.

## Seguranca

Esta branch remove arquivos sensiveis do conteudo atual e passa segredos de seed/autenticacao para variaveis de ambiente. A remocao nao limpa historico Git antigo.

Veja [SECURITY.md](SECURITY.md) e [docs/security-audit.md](docs/security-audit.md).

## Classificacao

- Tipo: versao antiga / historica de GestaoEPI.
- Repositorio mais recente relacionado: `GestorEPI-multiempresas-v5-9`.
- Recomendacao: preservar historico por enquanto, mas revisar visibilidade antes de manter publico.

## Licenca

Projeto proprietario. Todos os direitos reservados.
