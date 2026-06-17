declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GOOGLE_GENERATIVE_AI_API_KEY: string;
      ADMIN_USERNAME: string;
      ADMIN_PASSWORD: string;
    }
  }
}

export {};
