export default {
  "*.{js,jsx,ts,tsx,mjs}": ["biome check --write --no-errors-on-unmatched"],
  "*.json": ["biome format --write"],
};

