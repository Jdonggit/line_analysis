<script setup lang="ts">
import { ref, watch } from 'vue';
import { useLineStore } from '../stores/lineStore';

const store = useLineStore();

// Local state for smooth dragging
const localStart = ref(store.timeFilter.start);
const localEnd = ref(store.timeFilter.end);

// Sync from store if store changes externally (e.g. reset)
watch(() => store.timeFilter, (newVal) => {
    localStart.value = newVal.start;
    localEnd.value = newVal.end;
}, { deep: true });

function updateStore() {
    // Only verify valid range before committing
    if (localStart.value >= localEnd.value) {
        // Simple auto-correction logic
        if (localStart.value < 24) localEnd.value = localStart.value + 1;
        else localStart.value = localEnd.value - 1;
    }
    store.timeFilter.start = localStart.value;
    store.timeFilter.end = localEnd.value;
}
</script>

<template>
  <div class="space-y-6">
      <!-- Date Range -->
      <div>
        <label class="block text-sm font-medium text-gray-400 mb-2">日期區間</label>
        <div class="flex flex-col sm:flex-row sm:items-center gap-2">
            <input 
                type="date" 
                v-model="store.dateRange.start"
                class="bg-neutral-900 border border-neutral-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-auto"
            >
            <span class="text-gray-500 text-center sm:text-left">to</span>
             <input 
                type="date" 
                v-model="store.dateRange.end"
                class="bg-neutral-900 border border-neutral-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-auto"
            >
        </div>
      </div>

      <!-- Time Slot -->
      <div>
        <!-- Display local values for responsiveness -->
        <label class="block text-sm font-medium text-gray-400 mb-2">每日時段 ({{ localStart }}:00 - {{ localEnd }}:00)</label>
        <div class="flex flex-col sm:flex-row gap-4">
             <div class="flex-1">
                 <label class="text-xs text-gray-500 mb-1 block">開始時間</label>
                 <input 
                    type="range" min="0" max="23" 
                    v-model.number="localStart"
                    @change="updateStore"
                    class="w-full accent-indigo-500 cursor-pointer"
                 >
             </div>
             <div class="flex-1">
                 <label class="text-xs text-gray-500 mb-1 block">結束時間</label>
                 <input 
                    type="range" min="1" max="24" 
                    v-model.number="localEnd"
                    @change="updateStore"
                    class="w-full accent-indigo-500 cursor-pointer"
                 >
             </div>
        </div>
        <p class="text-xs text-gray-500 mt-2">
            拖曳滑桿以過濾時段
        </p>
      </div>
  </div>
</template>
