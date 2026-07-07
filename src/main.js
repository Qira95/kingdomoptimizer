import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { persistPlugin } from './stores/persist';
import { migrateLegacyState } from './stores/migrate';
import './style.css';

migrateLegacyState();

const pinia = createPinia();
pinia.use(persistPlugin);

createApp(App).use(pinia).mount('#app');
