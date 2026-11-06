import react from "@vitejs/plugin-react";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const PROJETO = __dirname;

const AVISO = "<!-- gerado pelo npm run build, não edite aqui. o código fica em src/ -->";

// tira o html do dist/ e põe na raiz, assim abre com duplo clique sem servidor
function moverParaRaiz(destino: string): Plugin {
  return {
    name: "mover-para-raiz",
    apply: "build",
    closeBundle() {
      const dist = resolve(PROJETO, "dist");
      const html = readFileSync(resolve(dist, "index.html"), "utf-8").replace(/^<!doctype html>/i, `<!doctype html>\n${AVISO}`);
      mkdirSync(dirname(destino), { recursive: true });
      writeFileSync(destino, html);
      // no windows o antivírus às vezes segura a pasta um pouco, por isso as tentativas
      rmSync(dist, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
      console.log("\n  Pronto! Abra o index.html com duplo clique.\n");
    },
  };
}

export default defineConfig(({ mode }) => ({
  root: "src",
  envDir: PROJETO, // o .env.local fica na raiz, não dentro do src

  // modo demo: o arquivo vai para docs/, de onde o GitHub Pages publica
  plugins: [
    react(),
    viteSingleFile(),
    moverParaRaiz(mode === "demo" ? resolve(PROJETO, "..", "docs", "index.html") : resolve(PROJETO, "index.html")),
  ],

  server: {
    port: 5173,
    open: true,
  },

  build: {
    outDir: "../dist",
    emptyOutDir: true,
    sourcemap: false,
  },
}));
