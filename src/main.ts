import "./style.css";
import { createRouter } from "./app/router";
import { prototypes, searchPrototypes } from "./app/prototype-registry";
import { prototypeCard } from "./components/prototype-card";
import type { PrototypeCategory } from "./app/types";

const app = document.querySelector<HTMLElement>("#app")!;
const categories: (PrototypeCategory | "All")[] = ["All", "World & Simulation", "Rendering", "Physics", "AI", "Gameplay", "Procedural Generation", "Networking", "Audio", "Tools", "Other"];

function renderHome() {
  app.innerHTML = `<main><section class="hero"><div class="shell"><p class="eyebrow">Game Development Playground / Technology Atlas</p><h1>Game Dev <span>Lab</span></h1><p class="hero-copy">Explore how games actually work — from visible phenomena to algorithms, readable code and interactive prototypes.</p><div class="search-row"><input id="search" type="search" placeholder="Search water, shader, pathfinding, noise…" aria-label="Search prototypes"><button id="surprise">Surprise Me</button></div></div></section><section class="catalog shell"><div class="section-heading"><div><p class="eyebrow">Explore the atlas</p><h2>Prototypes</h2></div><span id="count"></span></div><div id="categories" class="categories">${categories.map((category) => `<button data-category="${category}" class="${category === "All" ? "active" : ""}">${category}</button>`).join("")}</div><div id="cards" class="card-grid"></div><p id="empty" class="empty" hidden>No prototype matches that search yet.</p></section></main><footer><div class="shell">Built for experiments that are minimal, real and easy to inspect.</div></footer>`;
  const input = app.querySelector<HTMLInputElement>("#search")!;
  const cards = app.querySelector<HTMLElement>("#cards")!;
  const empty = app.querySelector<HTMLElement>("#empty")!;
  let category = "All";
  const update = () => {
    const results = searchPrototypes(input.value, category);
    cards.innerHTML = results.map(prototypeCard).join("");
    empty.hidden = results.length > 0;
    app.querySelector("#count")!.textContent = `${results.length} experiment${results.length === 1 ? "" : "s"}`;
  };
  input.addEventListener("input", update);
  app.querySelector("#categories")!.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
    if (!button) return;
    category = button.dataset.category!;
    app.querySelectorAll(".categories button").forEach((item) => item.classList.toggle("active", item === button));
    update();
  });
  app.querySelector<HTMLButtonElement>("#surprise")!.onclick = () => {
    const item = prototypes[Math.floor(Math.random() * prototypes.length)];
    location.hash = `#/prototype/${item.metadata.id}`;
  };
  update();
}

createRouter(app, renderHome);
