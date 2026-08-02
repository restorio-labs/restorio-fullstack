/* eslint-disable no-console */
interface ViteEnv {
  readonly DEV?: boolean;
}

const isDevelopment = (): boolean => {
  if (typeof process !== "undefined") {
    const mode = process.env.ENV ?? process.env.NODE_ENV;

    if (mode === "development") {
      return true;
    }
  }

  if (typeof import.meta !== "undefined" && "env" in import.meta) {
    const env = import.meta.env as ViteEnv;

    if (env.DEV === true) {
      return true;
    }
  }

  return false;
};

const debug = (...args: unknown[]): void => {
  if (isDevelopment()) {
    console.debug(...args);
  }
};

const info = (...args: unknown[]): void => {
  console.info(...args);
};

const warn = (...args: unknown[]): void => {
  console.warn(...args);
};

const error = (...args: unknown[]): void => {
  console.error(...args);
};

export const logger = {
  debug,
  info,
  warn,
  error,
};
