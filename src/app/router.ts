import { findPrototype } from "./prototype-registry";
import { refreshTranslations } from "../i18n";

export function createRouter(container: HTMLElement, renderHome: () => void) {
  let cleanup: (() => void) | undefined;
  const route = () => {
    cleanup?.(); cleanup = undefined;
    const match = location.hash.match(/^#\/prototype\/([^/]+)$/);
    if (!match) { renderHome(); refreshTranslations(container); document.title = "Game Dev Lab"; return; }
    const prototype = findPrototype(match[1]);
    if (!prototype) { location.hash = "#/"; return; }
    cleanup = prototype.render(container);
    refreshTranslations(container);
    document.title = `${container.querySelector("h1")?.textContent ?? "Game Dev Lab"} · Game Dev Lab`;
    window.scrollTo({ top: 0 });
  };
  window.addEventListener("hashchange", route);
  route();
}
