export interface CheckAuthSessionOptions {
  requireSessionHintCookie?: string;
  documentRef?: Document;
}

const hasCookie = (cookieName: string, documentRef?: Document): boolean => {
  if (typeof document === "undefined" && documentRef === undefined) {
    return false;
  }

  const doc = documentRef ?? document;

  return doc.cookie.split(";").some((entry) => entry.trim().startsWith(`${cookieName}=`));
};

export const checkAuthSession = async (
  getCurrentSession: () => Promise<unknown>,
  options?: CheckAuthSessionOptions,
): Promise<boolean> => {
  if (options?.requireSessionHintCookie && !hasCookie(options.requireSessionHintCookie, options.documentRef)) {
    return false;
  }

  try {
    await getCurrentSession();

    return true;
  } catch {
    return false;
  }
};
