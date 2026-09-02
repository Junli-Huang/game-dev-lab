# Architecture

The site has three deliberately small layers:

1. The hash router selects the home page or a prototype.
2. The registry exposes metadata for discovery and a render function for execution.
3. Each prototype owns its simulation, controls, explanation and cleanup lifecycle.

Hash routes keep direct links and browser refreshes reliable under the GitHub Pages project path.
