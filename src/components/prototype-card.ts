import type { PrototypeMetadata } from "../app/types";
import { localizeMetadata, t } from "../i18n";

export function prototypeCard(item: PrototypeMetadata) {
  item = localizeMetadata(item);
  const stars = "★".repeat(item.difficulty) + "☆".repeat(5 - item.difficulty);
  const status = item.status === "polished" ? t("status.polished") : t("status.prototype");
  return `<a class="prototype-card" href="#/prototype/${item.id}"><div class="card-top"><span class="category-pill">${item.category}</span><span class="status">${status}</span></div><h3>${item.title}</h3><p>${item.description}</p><div class="tags">${item.tags.map((tag) => `<span>${tag}</span>`).join("")}</div><div class="difficulty">${t("home.difficulty")} ${stars}</div></a>`;
}
