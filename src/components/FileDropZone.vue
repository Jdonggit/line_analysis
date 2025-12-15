<script setup lang="ts">
import { ref } from 'vue';
import { useLineStore } from '../stores/lineStore';
import { UploadCloud } from 'lucide-vue-next';

const store = useLineStore();
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

function handleDrop(e: DragEvent) {
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files[0];
    if (file) processFile(file);
  }
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    if (file) processFile(file);
  }
}

function processFile(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result as string;
    store.loadFile(text);
  };
  reader.readAsText(file);
}

function triggerFileInput() {
    fileInput.value?.click();
}
</script>

<template>
  <div 
    class="w-full max-w-2xl mx-auto p-10 border-2 border-dashed rounded-xl transition-colors cursor-pointer flex flex-col items-center justify-center gap-4"
    :class="isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-600 hover:border-indigo-400 bg-zinc-800/50'"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
    @click="triggerFileInput"
  >
    <UploadCloud class="w-16 h-16 text-indigo-400" />
    <div class="text-center">
      <h3 class="text-xl font-semibold mb-2">拖曳 Line 聊天記錄檔到這裡</h3>
      <p class="text-gray-400">或點擊選取檔案 (.txt)</p>
    </div>
    <input 
      ref="fileInput"
      type="file" 
      accept=".txt" 
      class="hidden" 
      @change="handleFileSelect"
    >
  </div>
</template>
