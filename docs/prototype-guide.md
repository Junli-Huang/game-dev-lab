# Adding a Prototype

1. Create `src/prototypes/<id>/`.
2. Add `metadata.ts`, `prototype.ts`, `index.ts`, and `README.md`.
3. Export a `PrototypeDefinition` whose `render` method returns a cleanup function.
4. Register that definition in `src/app/prototype-registry.ts`.
5. Run `npm run build` before committing.

Keep one prototype focused on one real technique. Lead with the interactive result, then explain the mental model, implementation and code-reading path.
