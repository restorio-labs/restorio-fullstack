export const PUBLIC_WEB_THEME_STORAGE_KEY = "restorio-public-web-theme-mode";

export const getThemeBootScript = (): string => `
(() => {
  try {
    const root = document.documentElement;
    const key = ${JSON.stringify(PUBLIC_WEB_THEME_STORAGE_KEY)};
    const storedMode = window.localStorage.getItem(key);
    const mode = storedMode === "light" || storedMode === "dark"
      ? storedMode
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    root.setAttribute("data-theme", mode);
    window.localStorage.setItem(key, mode);
    root.classList.toggle("dark", mode === "dark");
  } catch {
    // Ignore initialization failures and fall back to CSS defaults.
  }
})();
`;
