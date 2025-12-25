<script setup lang="ts">
import { useLineStore } from './stores/lineStore';
import FileDropZone from './components/FileDropZone.vue';
import Dashboard from './components/Dashboard.vue';

const store = useLineStore();
</script>

<template>
  <div class="min-h-screen bg-neutral-900 text-white font-sans selection:bg-indigo-500/30">
    <header class="bg-neutral-800 border-b border-neutral-700 py-4 px-6 fixed w-full top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between backdrop-blur-md bg-opacity-80 gap-4">
      <div class="flex items-center gap-3">
        <img src="/favicon.jpg" alt="Logo" class="w-10 h-10 rounded-lg shadow-lg">
        <h1 class="text-xl font-bold tracking-tight">Line 聊天分析器</h1>
      </div>
      <div v-if="store.messages.length" class="flex items-center justify-between sm:justify-end gap-4 text-sm w-full sm:w-auto">
         <span class="text-gray-400">已載入 {{ store.stats.totalMessages }} 則訊息</span>
         <button @click="store.reset()" class="text-red-400 hover:text-red-300 transition-colors">重置</button>
      </div>
    </header>

    <main class="pt-28 sm:pt-24 px-4 sm:px-6 pb-12 max-w-7xl mx-auto">
      <div v-if="!store.messages.length" class="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center py-8">
        <FileDropZone />
      </div>

      <Dashboard v-else />
    </main>
  </div>
</template>
