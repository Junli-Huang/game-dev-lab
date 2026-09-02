import { findPrototype } from "./prototype-registry";

export function createRouter(container: HTMLElement, renderHome: () => void) {
  let cleanup: (() => void) | undefined;
  const route = () => {
    cleanup?.(); cleanup = undefined;
    const match = location.hash.match(/^#\/prototype\/([^/]+)$/);
    if (!match) { renderHome(); return; }
    const prototype = findPrototype(match[1]);
    if (!prototype) { location.hash = "#/"; return; }
    cleanup = prototype.render(container);
    window.scrollTo({ top: 0 });
  };
  window.addEventListener("hashchange", route);
  route();
}
