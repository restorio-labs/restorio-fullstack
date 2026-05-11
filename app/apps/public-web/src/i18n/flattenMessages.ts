interface NestedMessages {
  [key: string]: string | NestedMessages;
}
type FlatMessages = Record<string, string>;

export function flattenMessages(
  nestedMessages: NestedMessages,
  prefix = ""
): FlatMessages {
  const flatMessages: FlatMessages = {};

  for (const [key, value] of Object.entries(nestedMessages)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string") {
      flatMessages[fullKey] = value;
    } else if (typeof value === "object" && value !== null) {
      Object.assign(flatMessages, flattenMessages(value as NestedMessages, fullKey));
    }
  }

  return flatMessages;
}
