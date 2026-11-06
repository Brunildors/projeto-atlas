/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_ASSISTENTE_URL?: string;
  /** "true" liga o modo demonstração: dados fictícios, sem servidor (ver src/demo). */
  readonly VITE_DEMO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
