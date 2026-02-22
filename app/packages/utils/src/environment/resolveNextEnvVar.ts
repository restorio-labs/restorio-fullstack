export const resolveNextEnvVar = (source: Record<string, unknown>, ...keys: string[]): string | undefined => {
  for (const key of keys) {
    const v = source[key];

    if (typeof v === "string") {
      return v;
    }
  }

  return undefined;
};
