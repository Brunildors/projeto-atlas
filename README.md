<img width="711" height="604" alt="image" src="https://github.com/user-attachments/assets/fb702dcd-ac04-4820-805c-b1f46d34f006" /># Projeto Atlas

Hackathon iPORT 2026: gestão de capacidade das equipes de desenvolvimento a partir do Azure DevOps.

## O que tem aqui

- `central-de-paineis/`: o front (React + TypeScript + Vite, em 7 idiomas). O `index.html` da raiz dele já é o app pronto e abre com duplo clique, mas o login e os dados dependem do n8n rodando.
- `backend/n8n/`: os workflows do n8n (agente IPORT AI, API de capacidade, autenticação e a API mock).
- `backend/sql/`: as tabelas e funções do schema `central` no Supabase, na ordem de rodar.
- `PITCH - Projeto Atlas.md`: o roteiro da apresentação.

## Como rodar

**Front**

```bash
cd central-de-paineis
npm install
cp .env.example .env.local
npm run dev
```

Ele abre em http://localhost:5173. Para gerar o arquivo único de novo, use `npm run build`.

**Backend**

1. Suba o n8n em http://localhost:5678.
2. Crie as credenciais "Postgres account" (o Supabase) e a do Gemini.
3. Importe os 4 JSON de `backend/n8n` e ative os workflows.
4. No Supabase, o banco do time já está montado. Os `.sql` servem para conferência ou para montar de novo: rode em ordem, pelo número.

O schema `public`, com os dados de exemplo, é o do time.

## Demonstração online

**https://brunildors.github.io/projeto-atlas/**

É o mesmo front-end (`central-de-paineis/`), publicado com **dados fictícios** e sem o servidor do time (n8n, Supabase e Gemini).
Na tela de login, entre com o CPF `529.982.247-25` e a senha `Demo@2026`.

O modo demonstração fica em `central-de-paineis/src/demo/` e é ligado por `VITE_DEMO=true`: ele intercepta as chamadas do app ao servidor e responde com pessoas, projetos, sprints e itens de exemplo, sempre relativos ao dia de hoje. As simulações de remanejamento ficam guardadas só no navegador.

Para gerar de novo a página publicada:

```bash
cd central-de-paineis
npm install
npm run build:demo   # grava docs/index.html
```

Este repositório é um fork do projeto do time (https://github.com/vinnicius707/Projeto-hackaton), criado para publicar a demonstração.
