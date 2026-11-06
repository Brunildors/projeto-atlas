/**
 * Modo demonstração (VITE_DEMO=true).
 *
 * Em vez de falar com o servidor do time (n8n + Supabase + Gemini), o app responde com dados
 * fictícios, calculados no próprio navegador. A troca é feita aqui, interceptando o `fetch`
 * dos endereços de demonstração, então o resto do app não precisa saber que está em demo.
 */
import { getLang } from "../i18n";
import type { Employee } from "../types";
import { acao, alertas, contexto, heatmap, previsao, timeline } from "./rotas";

export const DEMO = import.meta.env.VITE_DEMO === "true";

/** Endereço de mentira usado em VITE_API_URL no modo demonstração. */
export const DEMO_API = "https://demo.atlas.local/webhook";

const CPF_DEMO = "529.982.247-25";
const SENHA_DEMO = "Demo@2026";

const json = (corpo: unknown, status = 200): Response =>
  new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });

const somenteDigitos = (texto: unknown): string => String(texto ?? "").replace(/\D/g, "");

function usuario(dados: Partial<Employee>): Employee {
  return {
    docType: "cpf",
    document: somenteDigitos(dados.document),
    fullName: dados.fullName || "Pessoa de Demonstração",
    socialName: dados.socialName ?? "",
    birthDate: dados.birthDate || "1995-04-12",
    phone: dados.phone || "13999990000",
    address: dados.address ?? { cep: "11700000", street: "Rua Exemplo", number: "100", complement: "", district: "Centro", city: "Praia Grande", state: "SP" },
    registeredAt: dados.registeredAt || new Date().toISOString(),
  };
}

function lerCorpo(init?: RequestInit): Record<string, unknown> {
  try {
    return typeof init?.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function responder(url: string, init?: RequestInit): Response {
  const endereco = new URL(url);
  const rota = endereco.pathname.replace(/^\/webhook\//, "").replace(/\/+$/, "");
  const parametros = endereco.searchParams;

  switch (rota) {
    case "auth/login":
    case "auth/cadastro":
    case "auth/verificar": {
      const corpo = lerCorpo(init);
      return json({ token: "token-de-demonstracao", usuario: usuario(corpo as Partial<Employee>) });
    }
    case "auth/sair":
      return json({ ok: true });
    case "capacidade": {
      const cenario = Number(parametros.get("cenario") ?? 1);
      switch (parametros.get("rota")) {
        case "contexto":
          return json(contexto());
        case "heatmap":
          return json(heatmap(cenario, parametros.get("inicio") ?? undefined, Number(parametros.get("semanas") ?? 10)));
        case "timeline":
          return json(timeline(cenario, parametros.get("projeto") ?? ""));
        case "alertas":
          return json(alertas(cenario));
        case "previsao":
          return json(previsao(cenario));
        default:
          return json({ codigo: "ROTA_DESCONHECIDA" }, 404);
      }
    }
    case "capacidade/acao": {
      const resultado = acao(lerCorpo(init));
      return json(resultado.corpo, resultado.status);
    }
    default:
      return json({ codigo: "ROTA_DESCONHECIDA" }, 404);
  }
}

/**
 * Aviso de demonstração. Na tela de login mostra o CPF e a senha de teste;
 * depois de entrar vira uma etiqueta pequena, que não intercepta cliques (não cobre o botão "Sair").
 */
function mostrarAviso(): void {
  const ingles = getLang() !== "pt-BR";
  const caixa = document.createElement("aside");
  caixa.setAttribute("role", "note");
  caixa.setAttribute("aria-label", ingles ? "Demo mode" : "Modo demonstração");
  const base =
    "position:fixed;right:12px;bottom:12px;z-index:9999;border-radius:12px;background:#1b2230;color:#e8ecf4;" +
    "border:1px solid #3a4560;font:13px/1.45 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.35);";

  const completo = (): void => {
    caixa.style.cssText = `${base}max-width:min(22rem,calc(100vw - 24px));padding:10px 14px;`;
    caixa.innerHTML = ingles
      ? `<strong>Demo with fictional data.</strong> It does not use the team's server.<br>Sign in with CPF <b>${CPF_DEMO}</b> and password <b>${SENHA_DEMO}</b>.`
      : `<strong>Demonstração com dados fictícios.</strong> Não usa o servidor do time.<br>Entre com o CPF <b>${CPF_DEMO}</b> e a senha <b>${SENHA_DEMO}</b>.`;
  };
  const compacto = (): void => {
    caixa.style.cssText = `${base}padding:4px 12px;font-size:12px;opacity:.92;pointer-events:none;`;
    caixa.textContent = ingles ? "Demo · fictional data" : "Demonstração · dados fictícios";
  };

  let modo = "";
  const atualizar = (): void => {
    const naTelaDeLogin = document.getElementById("login-documento") !== null || document.getElementById("signup-documento") !== null;
    const novo = naTelaDeLogin ? "completo" : "compacto";
    if (novo === modo) return;
    modo = novo;
    if (novo === "completo") completo();
    else compacto();
  };

  document.body.append(caixa);
  atualizar();
  new MutationObserver(atualizar).observe(document.body, { childList: true, subtree: true });
}

export function instalarDemo(): void {
  if (!DEMO) return;

  const original = window.fetch.bind(window);
  window.fetch = async (entrada: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof entrada === "string" ? entrada : entrada instanceof URL ? entrada.href : entrada.url;
    if (!url.startsWith(DEMO_API)) return original(entrada, init);
    await new Promise((ok) => window.setTimeout(ok, 140)); // um respiro, como numa rede de verdade
    return responder(url, init);
  };

  mostrarAviso();
}
