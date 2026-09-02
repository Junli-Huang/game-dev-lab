import type { PrototypeMetadata } from "../app/types";

export function prototypeCard(item: PrototypeMetadata) {
  const stars = "★".repeat(item.difficulty) + "☆".repeat(5 - item.difficulty);
  return `<a class="prototype-card" href="#/prototype/${item.id}"><div class="card-top"><span class="category-pill">${item.category}</span><span class="status">${item.status}</span></div><h3>${item.title}</h3><p>${item.description}</p><div class="tags">${item.tags.map((tag) => `<span>${tag}</span>`).join("")}</div><div class="difficulty" aria-label="Difficulty ${item.difficulty} out of 5">Difficulty ${stars}</div></a>`;
}
