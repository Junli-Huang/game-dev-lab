import { en, type MessageKey } from "./en";
import { zhCN } from "./zh-CN";
import type { PrototypeMetadata } from "../app/types";
import { contentMessages } from "./content";

export type Language = "zh-CN" | "en";
const storageKey = "game-dev-lab.language";
const listeners = new Set<() => void>();
type AnyMessageKey = MessageKey | keyof typeof contentMessages;
const textBindings = new WeakMap<Text, AnyMessageKey>();
const attributeBindings = new WeakMap<Element, Map<string, AnyMessageKey>>();
const localizedKey = new Map<string, AnyMessageKey>();
for (const [key, value] of Object.entries(en)) localizedKey.set(value, key as MessageKey);
for (const [key, value] of Object.entries(zhCN)) localizedKey.set(value, key as MessageKey);
for (const [key, value] of Object.entries(contentMessages)) { localizedKey.set(value.en, key as keyof typeof contentMessages); localizedKey.set(value.zh, key as keyof typeof contentMessages); }
let language = detectLanguage();

export function getLanguage() { return language; }
export function t(key: MessageKey, values?: Record<string, string | number>) {
  let value = (language === "zh-CN" ? zhCN[key] : en[key]) ?? en[key] ?? key;
  if (!value) {
    console.warn(`Missing translation: ${key}`);
    return key;
  }
  for (const [name, replacement] of Object.entries(values ?? {})) value = value.replaceAll(`{${name}}`, String(replacement));
  return value;
}
export function setLanguage(next: Language) {
  if (next === language) return;
  language = next;
  localStorage.setItem(storageKey, next);
  document.documentElement.lang = next;
  refreshTranslations(document);
  listeners.forEach((listener) => listener());
}
export function subscribeLanguageChange(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); }
export function localizeMetadata(item: PrototypeMetadata): PrototypeMetadata {
  const prefixById: Record<string, string> = { "bouncing-ball": "bouncing", "verlet-rope": "rope", "flow-field": "flow", "sdf-playground": "sdf", "crowd-steering": "crowd", "constraint-generation": "constraint" };
  const prefix = prefixById[item.id];
  const categoryName = item.category === "World & Simulation" ? "world" : item.category === "Procedural Generation" ? "procedural" : item.category.toLowerCase();
  return { ...item, title: prefix ? t(`metadata.${prefix}.title` as MessageKey) : item.title, description: prefix ? t(`metadata.${prefix}.description` as MessageKey) : item.description, category: t(`category.${categoryName}` as MessageKey) as PrototypeMetadata["category"] };
}
export function refreshTranslations(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode() as Text | null;
  while (node) {
    const parent = node.parentElement;
    if (parent && !parent.closest("code, pre, script, style")) {
      let key = textBindings.get(node);
      if (!key) {
        key = localizedKey.get(node.data.trim());
        if (key) textBindings.set(node, key);
      }
      if (key) {
        const leading = node.data.match(/^\s*/)?.[0] ?? "";
        const trailing = node.data.match(/\s*$/)?.[0] ?? "";
        node.data = leading + translateAny(key) + trailing;
      }
    }
    node = walker.nextNode() as Text | null;
  }
  const elements = root instanceof Element ? [root, ...root.querySelectorAll("*")] : [...root.querySelectorAll("*")];
  for (const element of elements) {
    for (const attribute of ["title", "placeholder", "aria-label"]) {
      let bindings = attributeBindings.get(element);
      let key = bindings?.get(attribute);
      if (!key) {
        key = localizedKey.get(element.getAttribute(attribute) ?? "");
        if (key) { bindings ??= new Map(); bindings.set(attribute, key); attributeBindings.set(element, bindings); }
      }
      if (key) element.setAttribute(attribute, translateAny(key));
    }
  }
}
function translateAny(key: AnyMessageKey) {
  if (key in contentMessages) return contentMessages[key as keyof typeof contentMessages][language === "zh-CN" ? "zh" : "en"];
  return t(key as MessageKey);
}
export function mountLanguageSwitcher() {
  document.documentElement.lang = language;
  const switcher = document.createElement("nav");
  switcher.className = "language-switcher";
  switcher.setAttribute("aria-label", t("common.language"));
  switcher.innerHTML = `<button data-language="zh-CN">中文</button><button data-language="en">EN</button>`;
  const sync = () => switcher.querySelectorAll<HTMLButtonElement>("button").forEach((button) => { const active = button.dataset.language === language; button.classList.toggle("active", active); button.setAttribute("aria-pressed", String(active)); });
  switcher.onclick = (event) => { const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button"); if (button?.dataset.language) setLanguage(button.dataset.language as Language); };
  subscribeLanguageChange(sync); sync(); document.body.append(switcher);
}
function detectLanguage(): Language {
  const saved = localStorage.getItem(storageKey);
  if (saved === "zh-CN" || saved === "en") return saved;
  return /^zh(?:-|$)/i.test(navigator.language) ? "zh-CN" : "en";
}
