# Central de painéis

A resposta ao desafio da iPORT: **enxergar a capacidade das equipes de
desenvolvimento a partir do Azure DevOps e decidir uma alocação antes de virar
problema.**

Oito abas: **Home** (atalhos), **Utilização** (heatmap de carga por pessoa e
semana), **Previsão** (quem vai estourar nas próximas 8 semanas, por quê e qual
item passar para quem, com a simulação a um clique), **Planejamento** (timeline
por pessoa e sprint, com arrastar e soltar e simulação do impacto antes de
gravar), **Alertas** (sobrecarga, conflitos,
ausências, feriados e sobreposição), **Calendário** (feriados dos portos
nacionais e internacionais e ausências da equipe, em nove escalas de tempo),
**Projetos** (pastas que se arrastam, cada uma com o seu repositório de
arquivos) e **IPORT AI** (o assistente virtual: "quem tem folga?", alertas,
ausências — e é por ele que se avisa uma falta ou um atraso). O **Perfil** (os
dados do cadastro) não é aba: ele abre ao clicar no nome do funcionário, no
canto inferior esquerdo.

As quatro telas de capacidade leem o modelo do Supabase pela API do n8n — veja
[As telas de capacidade](#as-telas-de-capacidade). Elas tomaram o lugar dos
painéis de Financeiro, Infraestrutura e Marketing do modelo inicial, que estão
em `_paineis-antigos/`, fora do `src/`.

As outras abas e o Perfil: a **Home** só navega,
os **Projetos** guardam o que o funcionário registra (e os arquivos que ele
anexa), o **IPORT AI** responde pelo agente do n8n (veja
[O servidor](#o-servidor-login-cadastro-e-iport-ai)) — ou com o que o app já sabe,
quando o agente não está ligado —, o **Perfil** lê o
cadastro, e o **Calendário** calcula as datas sozinho, para qualquer ano.

Este projeto é o arquivo `Central de painéis (React + TypeScript).html` (um build
único do Vite, com tudo minificado numa só página) separado em arquivos de
verdade: CSS, TypeScript e componentes React.

## Como rodar

```bash
npm install
npm run dev      # abre em http://localhost:5173
```

**Para só ver o app, dê duplo clique no `index.html` da raiz.** Ele é o app
inteiro num arquivo só (JS e CSS embutidos pelo `vite-plugin-singlefile`) e
abre direto do disco. Para entrar, porém, o n8n precisa estar no ar: é ele
que confere a senha (veja [O servidor](#o-servidor-login-cadastro-e-iport-ai)).

Esse `index.html` é **gerado** pelo `npm run build`: não edite ele. Depois de
mexer no código, rode `npm run build` de novo para atualizá-lo. O HTML que
você edita é o `src/index.html`, que carrega o `main.tsx`; como o navegador
não entende TypeScript/JSX, ele só roda pelo Vite (`npm run dev`).

Outros comandos:

| Comando | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento com hot reload |
| `npm run build` | confere os tipos e gera o `index.html` da raiz, que abre com duplo clique |
| `npm run typecheck` | só a checagem de tipos (`tsc --noEmit`) |

## Estrutura

```
central-de-paineis/
├── index.html                  o app pronto num arquivo só: abre com duplo clique (gerado pelo build)
├── vite.config.ts              configuração do build
├── .env.example                endereço e token do IPORT AI (copie para .env.local)
├── tsconfig.json               configuração do TypeScript
│
├── src/
│   ├── index.html              HTML-fonte do Vite (só o <head> e a div #root)
│   ├── main.tsx                ponto de entrada: monta o App na #root
│   ├── App.tsx                 raiz: entrar/cadastrar, ou barra lateral + cabeçalho + painel
│   ├── dashboards.ts           registro dos painéis e leitura da rota (hash)
│   ├── types.ts                todos os tipos compartilhados
│   ├── vite-env.d.ts           tipos de ambiente do Vite
│   │
│   ├── assets/                 imagens
│   │   └── iport-logo.png      logo da iPORT Solutions
│   │
│   ├── styles/                 CSS
│   │   ├── index.css           importa os quatro abaixo
│   │   ├── base.css            a paleta da marca, o tema escuro, a foto de fundo, os cartões brancos, reset, globais
│   │   ├── layout.css          grade da página, barra lateral (fixa), cabeçalho
│   │   ├── components.css      KPIs, painéis, gráficos, tabela, selos, atalhos, pastas, arquivos, modal, calendário, chat, idioma, SMS…
│   │   └── login.css           a logo, a tela de entrada e o cadastro
│   │
│   ├── i18n/                   os idiomas do app (ver "Idiomas", abaixo)
│   │   ├── core.ts             os 7 idiomas, o idioma escolhido (salvo no navegador) e o defineMessages
│   │   ├── index.ts            t(), tn() (plural), formatList, countryName e useLang
│   │   └── messages/           as frases, uma área por arquivo, com os 7 idiomas lado a lado
│   │
│   ├── lib/                    TypeScript puro, sem React
│   │   ├── format.ts           formatadores no idioma escolhido (números, %, datas, tamanho de arquivo)
│   │   ├── math.ts             clamp, somas e contas que viram null sem dado
│   │   ├── validation.ts       máscaras e validação: CPF, CNPJ, nome, telefone, nascimento, endereço e senha
│   │   ├── states.ts           as 27 UFs
│   │   ├── auth.ts             entrada, cadastro e saída pelo servidor; a sessão (com o token) de quem entrou
│   │   ├── employees.ts        a cópia local do cadastro de quem entrou (o Perfil e o Calendário leem dela)
│   │   ├── records.ts          lista genérica no localStorage (projetos, fichas de arquivo, avisos, conversas)
│   │   ├── projects.ts         projetos: fluxo, ordem das pastas, rótulos e validação
│   │   ├── projectFiles.ts     os arquivos dos projetos: a ficha no localStorage, o conteúdo no IndexedDB
│   │   ├── assistant.ts        IPORT AI: as conversas, quem responde cada pergunta e a confirmação do aviso
│   │   ├── assistantServer.ts  IPORT AI: a chamada ao agente do n8n, o token e as mensagens de erro
│   │   ├── capacity.ts         capacidade: tipos, rótulos das faixas, cenário escolhido e as chamadas da API
│   │   ├── noticeRequest.ts    lê um pedido de falta ou atraso escrito em português e monta o aviso
│   │   ├── attendance.ts       faltas e atrasos: os avisos, os rótulos e as regras
│   │   ├── absences.ts         os avisos da equipe, prontos para o calendário
│   │   ├── countries.ts        os países dos portos e os feriados nacionais de cada um
│   │   ├── cities.ts           os portos do calendário e os feriados estaduais (ou regionais) e municipais
│   │   ├── holidays.ts         feriados e pontos facultativos por cidade, calculados (Páscoa, dias da semana, transferências)
│   │   ├── calendar.ts         a grade do mês e as contas de data
│   │   └── calendarViews.ts    as escalas de tempo: o intervalo de cada uma, a navegação e os títulos
│   │
│   ├── components/             componentes React reutilizáveis
│   │   ├── KpiCard.tsx         cartão de indicador
│   │   ├── Sparkline.tsx       minigráfico dentro do KPI
│   │   ├── Panel.tsx           seção do dashboard
│   │   ├── Badge.tsx           selo de situação
│   │   ├── EmptyState.tsx      recipiente sem dados
│   │   ├── FormField.tsx       campo de formulário: rótulo, dica e erro ligados por aria
│   │   ├── useTouched.ts       quando o erro de um campo pode aparecer
│   │   ├── useReorder.ts       arrastar e soltar para reordenar (mouse, toque e teclado)
│   │   ├── Modal.tsx           janela por cima da tela, com o <dialog> do navegador
│   │   ├── DocumentField.tsx   CPF ou CNPJ: a escolha do tipo e o campo com máscara
│   │   ├── PasswordField.tsx   a senha, com o olho e a lista de requisitos
│   │   ├── Icon.tsx            os ícones em SVG (casinha, heatmap, timeline, alerta, pessoa, pasta…)
│   │   ├── Brand.tsx           a logo
│   │   ├── LanguagePicker.tsx  a escolha do idioma (rodapé da barra lateral e topo da entrada e do cadastro)
│   │   └── PhoneVerification.tsx a confirmação do telefone pelo código do SMS simulado
│   │
│   └── pages/                  um arquivo por painel, mais as telas de fora
│       ├── LoginPage.tsx       documento (CPF ou CNPJ) e senha, conferidos pelo servidor
│       ├── SignupPage.tsx      cadastro: nomes, documento, nascimento, telefone, endereço e senha (grava no servidor)
│       ├── HomePage.tsx        aba Home: os atalhos
│       ├── UtilizacaoPage.tsx  aba Utilização: o heatmap de carga por pessoa e semana
│       ├── PrevisaoPage.tsx    aba Previsão: quem vai estourar, quando, por quê e o que mover antes
│       ├── PlanejamentoPage.tsx aba Planejamento: timeline por pessoa e sprint, arrastar e simular
│       ├── AlertasPage.tsx     aba Alertas: sobrecarga, conflitos, ausências, feriados, sobreposição
│       ├── capacity/
│       │   └── shared.tsx          o que as três telas dividem: cenário, legenda, selo, avisos
│       ├── CalendarPage.tsx    aba Calendário: porto, visualização, visão e barra lateral
│       ├── calendar/           as partes da aba Calendário
│       │   ├── ViewPicker.tsx      a visualização: "Hoje" e a seta que abre a lista das escalas
│       │   ├── MonthGrid.tsx       a grade de um mês (grande ou pequena)
│       │   ├── WeekView.tsx        a semana, de domingo a sábado
│       │   ├── DayAgenda.tsx       o dia completo e o período (manhã, tarde, noite)
│       │   ├── CalendarSidebar.tsx feriados nacionais e locais, e quem vai faltar ou atrasar
│       │   ├── lists.tsx           as listas de datas e de ausências
│       │   └── labels.ts           cores, rótulos e legenda
│       ├── ProjectsPage.tsx    aba Projetos: as pastas ou a pasta aberta, e os modais
│       ├── projects/           as partes da aba Projetos
│       │   ├── ProjectFolders.tsx  as pastas: filtros, "Criar projeto" e o arrastar
│       │   ├── ProjectDetail.tsx   a pasta aberta: o projeto e o repositório de arquivos
│       │   ├── ProjectForm.tsx     o formulário de "Criar projeto" (no modal)
│       │   ├── FileForm.tsx        o formulário de "Adicionar arquivo" (no modal)
│       │   └── labels.ts           cores dos selos e textos
│       ├── AssistantPage.tsx   aba IPORT AI: o chat, o histórico e a confirmação dos avisos
│       └── ProfilePage.tsx     o Perfil (abre pelo nome no rodapé da barra): os dados do cadastro
│
└── versao-javascript/          o mesmo app em JavaScript puro (ver abaixo)
```

## As duas versões

**`src/` — React + TypeScript (a principal).** É onde mexer. Usa JSX, tipos e o
Vite; precisa de `npm install`.

**`versao-javascript/` — JavaScript puro.** O mesmo app sem TypeScript, sem JSX e
sem build: o React vem de um CDN e os arquivos de `js/` são módulos ES que o
próprio navegador carrega. No lugar do JSX há o helper `h` (que é
`React.createElement`): leia `h("div", { className: "kpi" }, filho)` como
`<div className="kpi">{filho}</div>`.

Serve para entender o que o JSX e o TypeScript fazem por baixo, e para rodar o
app em qualquer lugar sem instalar nada. As duas versões compartilham o CSS de
`src/styles/` e a logo de `src/assets/`.

> **A versão JavaScript ficou para trás.** Ela não tem as abas Projetos e IPORT
> AI nem os ícones em SVG, e ainda tem a entrada só por CPF, o cadastro sem
> endereço e nascimento, o seletor de tema de três posições, a barra lateral
> que recolhe e o calendário só de Santos, com a barra de escalas antiga; o
> Perfil ainda é item do menu e os cartões da Home ainda têm a descrição
> embaixo do nome. Como o CSS é o mesmo, ela já pega as cores novas (a paleta
> da marca, a foto do mar no fundo e os cartões brancos com a faixa azul).
> O CSS guarda as regras que só ela usa
> (`.theme-toggle`, `.today`, `.sidebar-user`, `.shortcut-text`, `.shortcuts-panel`
> sem `.panel--frame`, e o `.is-collapsed` com o `.sidebar-collapse`), marcadas
> como tal.

Os arquivos se correspondem um a um, com dois agrupamentos: cada `src/lib/*.ts`
vira o `js/*.js` do mesmo nome, e os seis painéis de `src/pages/` moram juntos no
`js/pages.js` (as telas de fora ficam em `js/login.js` e `js/signup.js`). **Mexeu
numa versão, mexa na outra** — é o preço de manter as duas.

Módulos ES exigem `http` (por causa do CORS), então abrir o arquivo com duplo
clique não funciona. Suba um servidor na raiz do projeto:

```bash
npx serve .          # depois acesse /versao-javascript/
# ou
python -m http.server 8000
```

## As telas de capacidade

Os dados vêm do modelo de capacidade no Supabase (schema `public`: projetos,
sprints, work items, capacidade, ausências, feriados e a carga diária), pela API
do n8n (workflow "API Central - Capacidade"). O cálculo mora em funções do schema
`central`, que só **leem** o modelo — a única escrita é a da realocação, na
tabela `alteracao_plano`, e nunca no cenário baseline.

| Rota | O que devolve |
| --- | --- |
| `GET /capacidade?rota=contexto` | cenários, projetos, equipes e o estado da sincronização |
| `GET /capacidade?rota=heatmap&cenario=&inicio=&semanas=` | pessoas × semanas, com % e faixa |
| `GET /capacidade?rota=timeline&cenario=&projeto=` | sprints × pessoas, com os itens e as ausências |
| `GET /capacidade?rota=alertas&cenario=` | alertas registrados e calculados, do mais grave ao mais leve |
| `GET /capacidade?rota=previsao&cenario=` | a previsão das próximas 8 semanas: por pessoa, quando piora, pico, acúmulo, causas e sugestão |
| `POST /capacidade/acao` `{ rota: "simular" \| "mover" \| "desfazer", ... }` | o impacto de uma realocação; gravar; desfazer |

- **Cenários.** O cenário 1 (baseline) é o estado real e não muda. Os outros são
  simulações: a carga deles é a do baseline mais o efeito dos itens movidos
  neles — o esforço do item sai da pessoa e da sprint de antes e entra nas de
  depois, espalhado pelos dias úteis da sprint. O cenário escolhido vale em todas
  as telas de capacidade.
- **Faixas.** As mesmas da `vw_utilizacao_semanal` do time: Ocioso (< 70%),
  Saudável (até 100%), Em risco (até 120%), Sobrecarregado (acima), Conflito
  (trabalho em dia sem hora disponível) — mais Ausente (sem hora e sem trabalho).
- **Quem vê o quê.** Coordenação, gerência e diretoria veem as telas de capacidade; só
  gerência e diretoria gravam realocações. O colaborador vê um aviso no lugar.
- **Realocar.** Arraste um item no Planejamento (ou use o botão "Mover", que
  funciona no teclado e no toque e já sugere quem tem menos carga na sprint). A
  janela mostra o antes e o depois de quem perde e de quem ganha o item, mais
  os avisos (férias, feriado, pessoa fora da equipe). Só o "Confirmar" grava.
- **Prever.** A Previsão simula as próximas 8 semanas dia a dia: o trabalho que
  não cabe num dia (acima de 120% das horas disponíveis, ou num dia de ausência)
  passa para os dias seguintes da mesma pessoa. Daí saem a semana em que cada
  um piora, o pico, as horas acumuladas e quando normaliza, a tendência, as
  causas (ausência, plano acima de 100%, acúmulo, feriado) e uma sugestão: o
  item em aberto que mais pesa e quem da equipe tem a menor carga na sprint. O
  botão "Simular no Planejamento" abre a janela de simulação com esse destino
  (`#planejamento/simular/<projeto>/<item>/<sprint>/<pessoa>`). O cálculo é do
  banco: `central.api_previsao` (`atlas-n8n-ferramentas\sql\18-previsao.sql`).
- **Ausências na carga.** Desde 2026-10-09 a carga diária do baseline desconta
  as ausências (`sql\17-dados-exemplo-ausencias.sql`): no tempo fora, a rotina
  some e os itens em aberto continuam pendurados na pessoa — por isso férias com
  item em aberto aparecem como conflito. A carga original do time está guardada
  em `central.carga_diaria_original`.

Os arquivos: [capacity.ts](src/lib/capacity.ts) (tipos e chamadas),
[capacity/shared.tsx](src/pages/capacity/shared.tsx) (cenário, legenda, avisos) e
uma página por tela.

## O servidor: login, cadastro e IPORT AI

O app fala com o n8n, que guarda as contas no Supabase (schema `central`). Copie
o `.env.example` para `.env.local` e reinicie o `npm run dev`:

```bash
VITE_API_URL=http://localhost:5678/webhook
VITE_ASSISTENTE_URL=http://localhost:5678/webhook/agente
```

Só endereços: nenhuma senha, chave ou token vai no `.env`. Tudo que começa com
`VITE_` fica embutido no app, à vista de quem o abrir.

**Login e cadastro** (workflow "API Central - Autenticacao" no n8n):

| Rota | Corpo | Resposta |
| --- | --- | --- |
| `POST /auth/cadastro` | o cadastro + `password` | `202 { verificar, … }` (manda o SMS) · `409` documento já cadastrado · `400` dado inválido |
| `POST /auth/login` | `{ document, password }` | `200 { token, usuario }` · `202 { verificar, … }` telefone ainda não confirmado · `401` documento ou senha incorretos · `429` muitas tentativas |
| `POST /auth/verificar` | `{ document, code }` | `200 { token, usuario }` · `400` código errado, vencido ou bloqueado · `409` já confirmado |
| `POST /auth/reenviar` | `{ document }` | `202 { verificar, … }` (código novo) · `429` espere o prazo entre envios |
| `POST /auth/sair` | `Authorization: Bearer <token>` | `204` |

As recusas vêm como `{ erro, codigo }`; o app traduz pelo `codigo`
(`CREDENCIAIS_INVALIDAS`, `CODIGO_INCORRETO`, `AGUARDE`…), não pelo texto.

- **A senha não fica em lugar nenhum em texto puro.** O banco guarda só o hash
  bcrypt, e o token da sessão só como SHA-256. O workflow de autenticação não
  grava as execuções, porque o corpo delas traz a senha.
- **O telefone é confirmado por SMS — simulado.** Depois do cadastro, a conta só
  abre com o código de 6 dígitos mandado ao telefone. Nenhum SMS de verdade sai:
  o servidor devolve o código na resposta (`sms: { para, codigo }`, com
  `simulado: true`) e o app o mostra num aviso na tela, com o botão "Usar este
  código". O banco guarda só o hash SHA-256 do código, que vale 10 minutos,
  aceita 5 tentativas e pode ser reenviado a cada 60 s. Quem entra sem ter
  confirmado cai na mesma tela. Para um provedor real (Twilio, Zenvia…), troque
  o envio no workflow e desligue `SIMULAR_SMS` nos nós de resposta: o app deixa
  de mostrar o aviso sozinho. As contas de antes do SMS já entram confirmadas.
- **Quem se cadastra entra como `COLABORADOR`.** O cargo nunca vem do app: só
  muda no banco (`update central.usuarios set cargo = 'GERENTE' where …`).
- **O servidor confere tudo de novo**, com as mesmas regras do
  [validation.ts](src/lib/validation.ts) (dígitos do CPF/CNPJ, senha, endereço).
- **A sessão vence em 12 horas.** Vencida, o IPORT AI pede para entrar de novo.
- **O login admin** é a conta `111.111.111-11` (cargo `DIRETOR`, `admin = true`).
  CPF com todos os dígitos iguais não passa na validação, então a tela de entrada
  abre uma exceção só para ele (`ADMIN_CPF`, no
  [LoginPage.tsx](src/pages/LoginPage.tsx)); o cadastro continua recusando.

**O IPORT AI** conversa com um agente no n8n: um modelo de linguagem que consulta
o sistema da empresa com o token de quem pergunta. Com `VITE_ASSISTENTE_URL`
vazio, ele responde só localmente, como antes.

- **Quem decide o acesso é o servidor.** O cargo vem do token da sessão, e cada
  consulta do agente vai com esse token: o que o cargo não pode ver, o servidor
  nega.
- **Cada conversa tem a sua memória.** O app manda só a pergunta, o id da
  conversa e o idioma escolhido (`idioma`); o agente guarda o histórico e
  responde no idioma da tela. Uma "Nova conversa" começa do zero.
- **Avisos de falta e atraso continuam locais.** O agente só consulta; montar,
  confirmar e listar os avisos é feito no próprio app, que os grava neste
  navegador. O pedido de aviso só é lido em **português** ("vou me atrasar
  amanhã, chego às 10h") em qualquer idioma da tela — a tela avisa isso. O "sim"
  e o "não" da confirmação valem nos sete idiomas.
- **Os dados ainda não são os mesmos.** O agente lê o sistema (hoje, o mock do
  n8n), e as abas Projetos e Calendário leem o que está neste navegador. Até
  o backend de verdade existir, as respostas sobre projetos podem não bater
  com a aba.
- **A pergunta tem até 500 caracteres**, o mesmo teto do agente
  (`MESSAGE_MAX_LENGTH`, no `lib/assistant.ts`).

## Detalhes que valem saber

- **Roteamento sem biblioteca.** O painel atual vem do hash da URL
  (`#inicio`, `#utilizacao`, `#previsao`, `#planejamento`, `#alertas`, `#calendario`, `#tarefas`,
  `#iport-ai`, `#perfil`) e um listener de `hashchange` troca a tela. Os ids não
  mudaram quando os nomes mudaram (a Home ainda é `#inicio`; os Projetos,
  `#tarefas`), e os endereços antigos continuam valendo: `#funcionario` cai no
  Perfil, os dos painéis antigos (`#financas`, `#infra`, `#marketing`) caem na
  Utilização, e os das sub-abas que existiram
  (`#tarefas/avisos`, `#perfil/tarefas`…) caem na aba Projetos. Uma pasta de
  projeto aberta tem endereço próprio, `#tarefas/<id>`: o "voltar" do navegador
  fecha a pasta. Para somar um
  painel novo, basta acrescentar um item
  em [dashboards.ts](src/dashboards.ts) — ele aparece sozinho no menu lateral
  **e** na aba Home, que desenha um atalho por painel registrado. Um painel com
  `hideFromMenu` fica fora dos dois, mas continua no seu endereço: é o caso do
  Perfil (`#perfil`), que abre pelo nome do funcionário.

  Cada painel recebe do App a lista de painéis, o id do painel ativo e a sessão
  (o `DashboardPageProps` do [types.ts](src/types.ts)). Quem usa é a Home, que
  monta os atalhos; as telas de capacidade, que chamam a API com o token da
  sessão; os Projetos e o IPORT AI, que listam as
  coisas de quem está logado; o Perfil, que mostra o cadastro dele; e o
  Calendário, que abre na cidade do cadastro. Passar por prop em vez de importar
  o `dashboards.ts` evita um ciclo de imports — é ele que importa as telas, não
  o contrário.

- **Ícones em SVG.** Os ícones do menu e dos atalhos da Home são
  desenhados em [Icon.tsx](src/components/Icon.tsx), todos no mesmo traço e na
  cor do texto: a casinha da Home, a grade do heatmap da Utilização, as barras
  em degrau do Planejamento, a linha subindo da Previsão, o triângulo dos
  Alertas, a pessoa do Perfil, e os de Calendário, Projetos e IPORT AI —
  mais a pasta, o arquivo, o
  clipe, a alça de arrastar e o relógio do histórico. Em SVG eles saem iguais
  em qualquer máquina, o que um caractere Unicode não garante. Na barra lateral
  eles são azul vivo; nos quadrados de ícone (atalhos, pastas, arquivos, IPORT
  AI), azul vivo sobre um quadrado claro.

- **Entrar só com cadastro.** Sem sessão salva, o [App.tsx](src/App.tsx) mostra
  só as duas telas de fora: a [LoginPage](src/pages/LoginPage.tsx) e a
  [SignupPage](src/pages/SignupPage.tsx), e qual delas aparece é um estado do
  App, porque uma leva à outra nos dois sentidos.

  A entrada pede o documento e, **logo abaixo do campo**, o tipo dele (CPF ou
  CNPJ) — o campo abre no CPF, e quem é pessoa jurídica troca ali; o cadastro
  segue a mesma ordem. Depois do formato, quem confere a senha é o servidor —
  e documento sem cadastro e senha errada recebem a mesma frase, para a tela
  não contar quem tem cadastro. O "Criar cadastro" leva o documento já
  digitado. Quem acaba de se cadastrar entra direto, sem redigitar nada.

  O cadastro pede o tipo de documento, o documento, nome completo, nome social
  (opcional), **data de nascimento** (14 anos ou mais), telefone, o **endereço
  completo** (CEP, logradouro, número, complemento opcional, bairro, cidade e
  UF) e a senha. Os campos ganham máscara enquanto se digita — CPF em
  `000.000.000-00`, CNPJ em `00.000.000/0000-00`, CEP em `00000-000` e telefone
  em `(00) 00000-0000` — e a senha pede 8 caracteres, uma maiúscula e um
  especial, com a lista de requisitos marcando cada regra ao vivo. CPF e CNPJ
  passam pela conta dos dígitos verificadores, e o CNPJ aceita também o formato
  **alfanumérico** que a Receita emite desde julho de 2026. Todas as regras
  estão em [validation.ts](src/lib/validation.ts), separadas da tela.

  Cadastros, sessões e registros gravados antes do CNPJ (com o campo `cpf`)
  continuam valendo: eles são atualizados na leitura, e o perfil mostra "—" no
  que o cadastro antigo não tinha (endereço e nascimento).

  **O cadastro mora no servidor** (veja
  [O servidor](#o-servidor-login-cadastro-e-iport-ai)). O
  [auth.ts](src/lib/auth.ts) faz as chamadas e guarda quem entrou, com o token,
  para o F5 não derrubar a sessão; o [employees.ts](src/lib/employees.ts) guarda
  uma cópia do cadastro de quem entrou neste navegador, que é de onde o Perfil,
  o Calendário e as ausências leem. A senha não fica no navegador.

- **O nome, não o documento.** Depois de entrar, o canto inferior esquerdo
  mostra o nome do funcionário — e clicar nele abre o Perfil. Quem tem **nome
  social** cadastrado aparece pelo
  nome social; na falta dele, pelo nome completo. A escolha está num lugar só, o
  `sessionDisplayName()` do [auth.ts](src/lib/auth.ts), então nenhuma tela decide
  isso por conta própria.

  Os nomes são copiados do cadastro no momento da entrada, porque a barra lateral
  precisa deles em toda tela. A aba Perfil, ao contrário, lê o cadastro direto:
  ele é a fonte, e assim ela mostra o dado atual mesmo que o cadastro tenha
  mudado depois do login.

- **O Perfil.** Só os dados do cadastro
  ([ProfilePage.tsx](src/pages/ProfilePage.tsx)): nomes, documento, nascimento
  (com a idade), telefone, endereço e as datas de cadastro e de entrada. Ele
  não tem item no menu nem atalho na Home: abre pelo **nome do funcionário**, no
  rodapé da barra lateral (um link com o ícone de pessoa, que fica marcado como
  o item ativo do menu enquanto o Perfil está aberto). O atalho de perfil do
  canto superior direito saiu com o design novo (o componente está em
  `_paineis-antigos/componentes-removidos/`).

- **A aba Projetos.** Os projetos são **pastas**
  ([ProjectsPage.tsx](src/pages/ProjectsPage.tsx) e a pasta
  [projects/](src/pages/projects/)). Em cima ficam os filtros por situação (com
  a contagem de cada uma) e, bem à vista, o botão **Criar projeto**, que abre
  um modal ([Modal.tsx](src/components/Modal.tsx), o `<dialog>` do navegador:
  prende o foco, fecha no Esc e no clique fora). Não há mais formulário fixo ao
  lado. Cada pasta mostra o nome, a situação, a prioridade, o prazo e quantos
  arquivos guarda; o projeto novo nasce como a primeira pasta.

  As pastas se **arrastam para mudar de ordem**
  ([useReorder.ts](src/components/useReorder.ts)), e a ordem fica gravada. É
  Pointer Events, e não o arrastar nativo do HTML, para valer igual no mouse
  (a pasta inteira, a partir de alguns pixels de movimento — antes disso é um
  clique, que abre a pasta), no toque (pela alça de pontinhos, para o resto da
  pasta continuar rolando a página) e no teclado (setas, Home e End na alça,
  com aviso ao leitor de tela). Com um filtro ligado, as pastas visíveis trocam
  de lugar entre si e as escondidas ficam onde estavam. Os projetos de antes do
  arrastar vão depois dos ordenados, pelo prazo, até a primeira arrastada.

  Clicar abre a pasta (`#tarefas/<id>`): de um lado o projeto — situação,
  prioridade, prazo, descrição, o botão do próximo passo e o de excluir —; do
  outro, o **repositório de arquivos** dela. Todo arquivo anexado leva um
  **nome** e uma **descrição**, os dois obrigatórios (o nome vem preenchido a
  partir do arquivo, para começar), e aparece com eles, o nome original, o
  tamanho e a data; dali ele se baixa ou se exclui. O limite é 25 MB por
  arquivo. Excluir o projeto exclui os arquivos junto.

  Cada projeto anda em três passos — pendente → em andamento → concluído —,
  com nome de 3 a 120 caracteres e prazo opcional, nunca no passado. A aba já
  se chamou Tarefas e teve também Justificativas e Aviso prévio; as duas
  saíram, e faltas e atrasos agora se avisam pelo IPORT AI (abaixo). A chave
  do armazenamento continua `tarefas`, então o que já estava salvo aparece
  como projeto.

  Os projetos e as **fichas** dos arquivos ficam no `localStorage`, separados
  por documento, pela loja genérica do [records.ts](src/lib/records.ts). O
  **conteúdo** dos arquivos vai no IndexedDB
  ([projectFiles.ts](src/lib/projectFiles.ts)): o `localStorage` só guarda
  texto e cabe uns 5 MB no total. Com backend, troque o corpo de
  `listFor`/`listAll`/`save`/`saveMany`/`remove`/`removeMany` pelas chamadas
  da API, e o do projectFiles.ts por um armazenamento de arquivos.

- **O IPORT AI.** A aba é só o chat e, ao lado, o histórico de conversas
  ([AssistantPage.tsx](src/pages/AssistantPage.tsx)), separado em Hoje, Ontem,
  Últimos 7 dias e Mais antigas. O histórico é **discreto**: uma coluna solta
  sobre o fundo da página, sem cartão nem botão cheio, com os títulos em tom
  apagado — só a conversa aberta ganha a cor cheia do texto —, e a "Nova
  conversa" é a primeira linha da lista. A conversa nova abre com uma saudação e
  sugestões de pergunta; Enter envia e Shift+Enter quebra a linha; enquanto a
  resposta não chega, aparece o "escrevendo…". Uma conversa só é gravada na
  primeira pergunta — é ela que vira o título no histórico —, e cada uma pode
  ser excluída. No celular o histórico vira um painel por cima da conversa,
  aberto pelo ícone de relógio no alto da conversa.

  **Faltas e atrasos se avisam pelo IPORT AI.** A pessoa escreve o pedido como
  falaria — "vou me atrasar amanhã, chego às 10h", "vou faltar de 12/10 a 14/10
  por consulta", "não vou poder ir na sexta" — e o
  [noticeRequest.ts](src/lib/noticeRequest.ts) monta o aviso: o tipo (falta ou
  atraso), o dia ou o período ("hoje", "amanhã", "sexta", "dia 15", "15/10"), a
  chegada prevista e, se ela disser, o horário de entrada ("das 8h às 10h"), e
  o motivo, pelas palavras do texto. Faltando o dia ou o horário, o IPORT AI
  pergunta, e a resposta seguinte completa o pedido. Com tudo em mãos, ele
  mostra o aviso montado com **Confirmar aviso** e **Cancelar** (um "sim" ou um
  "não" escrito vale o mesmo) — só a confirmação grava. As regras são as do
  antigo Aviso prévio: data de hoje em diante, falta de até 30 dias, e o aviso
  nasce "em análise" (aprovar e recusar é papel do RH). Confirmado, ele aparece
  no Calendário da equipe. "Meus avisos" lista os da pessoa.

  **Ainda não há modelo de linguagem ligado.** Quem responde é o
  `askAssistant()` do [assistant.ts](src/lib/assistant.ts), com o que o app já
  sabe: os projetos em aberto de quem pergunta (e os atrasados), os próximos
  feriados da cidade dele, os avisos de falta e atraso, onde fica o cadastro. O
  topo do arquivo traz o `fetch` que entra no lugar: ele vai para o
  **servidor** da empresa, que chama o modelo — a chave da API nunca pode ficar
  no navegador; lá, quem monta o aviso é uma ferramenta do modelo, no lugar do
  `noticeRequest.ts`. As conversas ficam no `localStorage`, separadas por
  documento, pela mesma loja dos projetos.

- **Calendário por porto.** O seletor **Porto** lista as cidades portuárias em
  dois grupos — os **portos nacionais** e os **internacionais** — e troca as
  três camadas de datas: as do país, as do estado (ou da região) e as do
  município, com os pontos facultativos de cada uma. O calendário abre na
  última cidade escolhida; sem escolha, na cidade do endereço do cadastro, se
  ela for um dos portos; e, por fim, em Santos.

  Os nacionais são 15: Santos, Rio de Janeiro, Paranaguá, Itajaí, Rio Grande,
  Porto Alegre, Vitória, Salvador, Recife, Maceió, Natal, Fortaleza, São Luís,
  Belém e Manaus. Os internacionais são 15, em 13 países: Roterdã, Antuérpia,
  Hamburgo, Le Havre, Valência, Lisboa, Gênova e Felixstowe, na Europa; Nova
  York, Houston, Los Angeles, Manzanillo, Cartagena, Buenos Aires e Montevidéu,
  nas Américas. (As cidades que não são porto — São Paulo, São Vicente, Belo
  Horizonte, Curitiba e Brasília — saíram da lista.) Somar um porto é
  acrescentar um item em [cities.ts](src/lib/cities.ts); um país novo vai em
  [countries.ts](src/lib/countries.ts). Nenhuma tela muda.

  Feriado é coisa de cada país, e as regras de fora são de três formatos: datas
  fixas, datas da Páscoa e datas de **dia da semana** (o Dia de Ação de Graças
  é a quarta quinta-feira de novembro; o Memorial Day, a última segunda de
  maio). Várias **andam** quando caem num dia ruim, pela lei de cada lugar: nos
  EUA o feriado do sábado é folgado na sexta; no Reino Unido o do fim de
  semana ganha um dia substituto; na Colômbia quase todos vão para a segunda
  (Lei Emiliani); na Argentina e no Uruguai os "trasladables" vão para a
  segunda mais próxima. A data aparece no dia da folga, com a original na
  observação ("Transferido de 04/07 (sábado)"). O Uruguai separa os feriados
  com folga paga dos "laborables", que aparecem como ponto facultativo.

  Os portos da Ásia e do Oriente Médio (Xangai, Singapura, Busan, Jebel Ali)
  ficaram de fora de propósito: lá os feriados seguem o calendário lunar ou o
  islâmico, e as datas exatas saem de decreto anual — não cabem numa regra. O
  caminho para somá-los é uma tabela de datas por ano.

  O calendário abre direto nas datas, sem faixa de números em cima. Na barra de
  cima, ao lado da cidade, fica a **visualização**
  ([ViewPicker.tsx](src/pages/calendar/ViewPicker.tsx)): recolhida, ela mostra só
  o botão **Hoje** (que traz o calendário de volta para hoje) e uma seta. A seta
  abre a lista das escalas de tempo — Período (manhã, tarde ou noite), Dia
  completo, Semana (de domingo a sábado, com o fim de semana), Mês, Bimestre,
  Trimestre, Semestre, Ano ou um intervalo Personalizado (até 366 dias) —, com a
  atual marcada; escolher uma, clicar na seta de novo, apertar Esc ou clicar fora
  recolhe a lista. Os botões ‹ e › andam uma unidade da escala, e bimestres,
  trimestres e semestres são os do calendário (o 1º trimestre é sempre
  janeiro–março). O que cada escala cobre está em
  [calendarViews.ts](src/lib/calendarViews.ts).

  A barra lateral mostra os **feriados**, separados em nacionais e locais, e
  **quem vai faltar ou atrasar** no intervalo na tela — no atraso, com o período
  exato ("das 08:00 às 10:30 (2h30)"). As ausências vêm dos avisos que cada um
  da equipe fez pelo IPORT AI ([absences.ts](src/lib/absences.ts)); entram só os em análise ou
  aprovados, e sem o motivo nem a descrição, que não são assunto da equipe.

- **Calendário que não vence.** As datas do painel de
  [Calendário](src/pages/CalendarPage.tsx) não são cadastradas: elas são
  calculadas em [holidays.ts](src/lib/holidays.ts), para qualquer ano entre 1583
  e 9999, em três camadas — nacional, estadual e municipal. As fixas saem de
  tabelas; as móveis saem da **Páscoa**, pelo algoritmo de Meeus/Jones/Butcher, e
  é de lá que vêm o Carnaval, a Sexta-feira Santa e o Corpus Christi, que andam
  todo ano. Quando duas camadas trazem a mesma data (o Corpus Christi é ponto
  facultativo nacional e feriado municipal em São Paulo), fica uma só: o feriado
  vence o facultativo, e a camada mais local vence.

  O painel separa **feriado** de **ponto facultativo**: um fecha o dia por lei, o
  outro é dispensa opcional, e confundi-los é o erro caro de quem monta escala.
  A tabela também conhece data de início de lei: o Dia Nacional de Zumbi e da
  Consciência Negra só aparece como feriado nacional de 2024 em diante, e Nossa
  Senhora Aparecida, de 1980 — então 2019 não aparece com um feriado que 2019 não
  teve.

  **Confira o decreto do ano.** As datas municipais e os pontos facultativos
  locais saem de decreto anual de cada prefeitura, que pode somar datas ou mudar
  o horário de expediente — e lá fora há pontes, feriados de ocasião e leis
  novas que nenhuma regra prevê. O [cities.ts](src/lib/cities.ts) e o
  [countries.ts](src/lib/countries.ts) dizem, no topo, o que confirmar e onde
  mexer.

  Duas decisões de implementação valem a leitura: **toda data é um texto ISO**
  (`AAAA-MM-DD`), comparado com `===` e ordenado em ordem alfabética — que para
  esse formato é a ordem cronológica —, e as contas de somar dias vão em **UTC**.
  Juntas, as duas tiram do caminho o fuso horário e o horário de verão, que são a
  origem do clássico "o feriado aparece um dia antes". (A exceção é a borda: um
  dia depois de 9999-12-31 tem ano de cinco dígitos, que como texto se compara
  errado — por isso os laços de [calendarViews.ts](src/lib/calendarViews.ts)
  contam passos em vez de comparar datas.) A grade tem sempre 42 células (6
  semanas), para o painel não mudar de altura ao trocar de mês, e é uma `<table>`
  de verdade: um calendário é uma tabela, e com a marcação certa o leitor de tela
  anuncia o dia da semana junto do número, sem precisar de `aria` nenhum.

- **A barra lateral é fixa.** No computador ela fica sempre aberta, com os
  nomes à vista e a mesma largura, presa no topo enquanto a página rola — não
  há botão de recolher. No celular e no tablet, onde uma coluna de 236 px
  tomaria a tela quase toda, ela vira uma gaveta sobre o conteúdo, que abre no
  ☰, e fecha ao escolher um painel, no Esc ou clicando fora. Quem decide qual
  dos dois vale é o CSS, em [layout.css](src/styles/layout.css), pelo
  `@media (max-width: 900px)` da gaveta. No JavaScript não há `innerWidth`
  nenhum — ele descolaria do CSS assim que alguém mudasse o ponto de quebra.

- **A logo e os dois temas.** A logo ([iport-logo.png](src/assets/iport-logo.png))
  é redonda, num quadrado de fundo branco, então precisa de fundo branco em
  volta, e quem dá esse fundo é o CSS, pela variação do
  [Brand.tsx](src/components/Brand.tsx): uma placa redonda e branca. Na barra
  lateral — azul nos dois temas — a logo é grande (96 px, para o "iPORT
  Solutions" de dentro dela ser lido), é um link para a **Home** de qualquer
  tela, e a placa está sempre lá, ganhando uma borda clara no tema escuro. Na
  tela de entrada a logo é o cabeçalho do cartão, grande (168 px) e no centro,
  também sobre a placa branca. O build embute a imagem no `index.html` como
  data URI.

- **Contas que não mentem.** As funções de [math.ts](src/lib/math.ts) devolvem
  `null` quando falta dado, em vez de `NaN` ou `Infinity`: um `null` é fácil de
  testar e a interface troca por "—", enquanto um `NaN` se espalha em silêncio
  até aparecer na tela.
- **Gráficos em SVG, na mão.** Nenhuma dependência de charts. A rosca usa um
  truque: cada fatia é um círculo completo com `stroke-dasharray` do tamanho do
  arco e `stroke-dashoffset` acumulado.
- **Tempo real no painel de infra.** Um `setInterval` de 2 s chama
  `fetchInfraSnapshot()` e redesenha com o que vier; o `useEffect` devolve a
  função de limpeza que cancela o intervalo (por isso o botão de pausar funciona
  sem vazar timers) e marca a resposta como cancelada, para um retorno atrasado
  não sobrescrever a tela depois da hora.
- **Só o tema escuro.** O tema claro e o interruptor de tema saíram. O `<html>`
  do [src/index.html](src/index.html) já nasce com `data-theme="dark"` e
  `color-scheme: dark`, então não há script de tema nem piscada branca. A paleta
  clara de [base.css](src/styles/base.css) continua lá como base das variáveis
  (o bloco escuro só sobrescreve as que mudam). O cabeçalho não mostra a data:
  datas ficam no Calendário.

  **O design (2026-10-09, do front do time).** A paleta da marca tem o azul
  Regal `#1C244B` (barra lateral e títulos), o azul `#4A6FA5` (a faixa dos
  cartões) e o azul vivo `#1877F2` (botão principal, item ativo do menu e
  ícones). O fundo é um azul-noite (`#09203E`) com uma **foto do mar**
  ([fundo-mar.jpg](src/assets/fundo-mar.jpg)) por cima, fixa e
  semitransparente (o `body::before` do [base.css](src/styles/base.css)), que
  aparece mais na tela de entrada. A barra lateral é um degradê do Regal até
  transparente, então ela se mistura com a foto.

  **Os cartões são brancos (um branco azulado, `#F5F9FF`) com uma faixa azul
  de 4 px à esquerda e sombra leve**: os painéis, os KPIs, os atalhos da Home,
  as pastas, a conversa do IPORT AI e os modais. Dentro deles vale uma paleta
  clara própria (as mesmas variáveis redefinidas), então tabelas, heatmap,
  formulários e o calendário acompanham sem regra nova. A tela de entrada tem
  um cartão em degradê (verde-petróleo até azul-noite) com a logo grande no
  centro, e a escolha CPF/CNPJ virou uma pílula pequena embaixo do campo.

  As faixas do heatmap usam as cores de significado (verde, âmbar, vermelho),
  o azul para "Ocioso" e um **roxo fixo** (`#6A1B9A`) para "Conflito": com a
  paleta nova o azul vivo ficaria igual ao do Ocioso. Cada célula mostra o
  número, então a cor nunca é a única pista.
- **Idiomas.** Sete: português do Brasil (o padrão), inglês, espanhol, chinês
  simplificado, japonês, alemão e francês. A escolha fica no rodapé da barra
  lateral (embaixo do "Sair") e no topo das telas de entrada e cadastro; ela é
  salva no navegador (`central-de-paineis:idioma`) e vale no próximo acesso.
  Trocar o idioma remonta o app (`key={lang}` no [main.tsx](src/main.tsx)), então
  nenhum texto velho fica preso. As frases moram em
  [src/i18n/messages/](src/i18n/messages/), uma área por arquivo, com os sete
  idiomas lado a lado; o `defineMessages` obriga os sete a terem as mesmas
  chaves, então uma tradução esquecida é erro de compilação. Plural pelo
  `Intl.PluralRules` (`tn("cal.days", n)`), e datas, números, listas e nomes de
  países pelo `Intl` do navegador, no idioma escolhido.

  **O que não se traduz são os dados**: nomes de pessoas, portos, cidades,
  feriados, os títulos dos itens do Azure DevOps e os textos que vêm prontos do
  banco (os alertas cadastrados à mão, os nomes e descrições dos cenários). Os
  alertas calculados, os avisos da simulação e os erros da API vêm com um
  `codigo` e os dados soltos, e o app monta a frase no idioma da tela.
- **Acessibilidade.** `aria-current` no menu, `aria-sort` nas colunas ordenáveis,
  `role="meter"` nas barras de uso, `aria-label` nos gráficos, `aria-pressed` nos
  dias do calendário e nos botões de escolha, `aria-expanded` na seta da
  visualização do calendário, `<html lang>` no idioma escolhido,
  `aria-invalid` com `role="alert"` nos campos com erro, `role="log"` na conversa
  do IPORT AI, `<fieldset>` com `<legend>` no endereço, `<abbr>` nos dias da
  semana, `<dl>`/`<dt>`/`<dd>` nos dados do perfil e da pasta, `<dialog>` com
  `showModal()` nos modais (foco preso e devolvido), reordenar as pastas pelo
  teclado com aviso `aria-live` da posição nova, e respeito a
  `prefers-reduced-motion`.
