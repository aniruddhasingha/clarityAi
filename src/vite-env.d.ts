/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_DEMO_MODE: string
  readonly VITE_GITHUB_CLIENT_ID: string
  readonly VITE_BITBUCKET_CLIENT_ID: string
  readonly VITE_JIRA_CLIENT_ID: string
  readonly VITE_APP_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
