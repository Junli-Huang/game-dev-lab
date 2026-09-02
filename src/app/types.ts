export type PrototypeCategory =
  | "World & Simulation" | "Rendering" | "Physics" | "AI"
  | "Gameplay" | "Procedural Generation" | "Networking" | "Audio" | "Tools" | "Other";

export type PrototypeStatus = "idea" | "explained" | "prototype" | "polished";

export interface PrototypeMetadata {
  id: string;
  title: string;
  description: string;
  category: PrototypeCategory;
  tags: string[];
  difficulty: number;
  status: PrototypeStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface PrototypeDefinition {
  metadata: PrototypeMetadata;
  render(container: HTMLElement): () => void;
}
