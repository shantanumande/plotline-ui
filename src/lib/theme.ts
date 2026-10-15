export type Theme = "light" | "dark";

export const THEME_KEY = "plotline.theme";

export function getTheme(): Theme {
  try {
    return window.localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function setTheme(t: Theme) {
  try {
    window.localStorage.setItem(THEME_KEY, t);
  } catch {
    /* ignore */
  }
  const root = document.documentElement;
  const apply = () => {
    root.classList.toggle("dark", t === "dark");
    root.style.colorScheme = t;
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return apply();
  // Cross-fade the whole page where supported; otherwise briefly transition colours.
  if (typeof document.startViewTransition === "function") {
    document.startViewTransition(apply);
    return;
  }
  root.classList.add("theme-fading");
  apply();
  window.setTimeout(() => root.classList.remove("theme-fading"), 400);
}

// Runs in <head> before first paint so a saved dark choice doesn't flash light.
export const THEME_BOOT_SCRIPT = `(function(){try{if(localStorage.getItem(${JSON.stringify(THEME_KEY)})==="dark"){var e=document.documentElement;e.classList.add("dark");e.style.colorScheme="dark"}}catch(_){}})()`;
