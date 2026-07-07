<template>
  <div class="serverBar">
    <span class="serverBarLabel">Servers</span>
    <div class="serverTabs">
      <div
        v-for="server in servers.servers"
        :key="server.id"
        class="serverTab"
        :class="{ active: server.id === servers.activeServerId }">
        <template v-if="server.id === servers.activeServerId">
          <input
            class="serverName"
            :value="server.name"
            @change="servers.renameServer(server.id, $event.target.value)">
          <button
            v-if="servers.servers.length > 1"
            type="button"
            class="serverDelete"
            title="Delete this server"
            @click="servers.deleteServer(server.id)">✕</button>
        </template>
        <button
          v-else
          type="button"
          class="serverSwitch"
          @click="servers.setActiveServer(server.id)">
          {{ server.name }}
        </button>
      </div>
    </div>
    <button type="button" class="serverAdd" @click="servers.addServer()">+ Add server</button>
  </div>
</template>

<script setup>
import { useServersStore } from '../stores/servers';

const servers = useServersStore();
</script>
