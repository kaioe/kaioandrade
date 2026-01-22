/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EMAIL_API_ENDPOINT: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
