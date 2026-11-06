import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { instalarDemo } from "./demo";
import { useLang } from "./i18n";
import "./styles/index.css";

function Root() {
  const lang = useLang();
  return <App key={lang} />; // trocou o idioma, remonta tudo e nenhum texto fica no idioma velho
}

instalarDemo(); // só faz algo com VITE_DEMO=true

const container = document.getElementById("root");

if (!container) {
  throw new Error("Elemento #root não encontrado no index.html");
}

createRoot(container).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
