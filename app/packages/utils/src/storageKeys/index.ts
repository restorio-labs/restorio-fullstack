interface EnvSource {
  env?: Record<string, string | undefined>;
}

const getEnvVar = (key: string): string | undefined => {
  const processEnv = (globalThis as { process?: EnvSource }).process?.env;
  const viteEnv = (import.meta as EnvSource).env;

  return processEnv?.[key] ?? viteEnv?.[key];
};

export const THEME_STORAGE_KEY = getEnvVar("THEME_STORAGE_KEY") ?? "rtm";

export const LAST_VISITED_APP_STORAGE_KEY = getEnvVar("LAST_VISITED_APP_STORAGE_KEY") ?? "rlvp";

export const ACCESS_TOKEN_KEY = getEnvVar("ACCESS_TOKEN_KEY") ?? "rat";
export const REFRESH_TOKEN_KEY = getEnvVar("REFRESH_TOKEN_KEY") ?? "rfr";
