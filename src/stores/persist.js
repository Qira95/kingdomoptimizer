// Minimal localStorage persistence for Pinia stores (replaces vuex-persist).
export function persistPlugin({ store }) {
  const key = 'kingdomoptimizer:' + store.$id;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      store.$patch(JSON.parse(saved));
    } catch (e) {
      console.warn(`ignoring corrupt persisted state for ${key}`, e);
    }
  }
  store.$subscribe((_mutation, state) => {
    localStorage.setItem(key, JSON.stringify(state));
  });
}
