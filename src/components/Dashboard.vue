

<script setup lang="ts">
import { computed } from 'vue';
import { useLineStore } from '../stores/lineStore';
import { 
  Chart as ChartJS, 
  Title, 
  Tooltip, 
  Legend, 
  BarElement, 
  CategoryScale, 
  LinearScale,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'vue-chartjs';
import FilterControl from './FilterControl.vue';
import AIAnalysis from './AIAnalysis.vue';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const store = useLineStore();
const stats = computed(() => store.stats);

// Logic for charts
const rankingData = computed(() => {
  const top10 = stats.value.ranking.slice(0, 10);
  return {
    labels: top10.map(i => i.name),
    datasets: [{
      label: '訊息數量',
      backgroundColor: '#6366f1',
      data: top10.map(i => i.count)
    }]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { 
        backgroundColor: '#1f2937', 
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 14 }
    }
  },
  scales: {
    x: { grid: { color: '#374151' }, ticks: { color: '#9ca3af' } },
    y: { grid: { color: '#374151' }, ticks: { color: '#9ca3af' } }
  }
};

// Sticker Data
const stickerData = computed(() => {
  const counts = stats.value.stickerCounts;
  const labels = Object.keys(counts);
  // Sort by count
  if (labels.length === 0) return { labels: [], datasets: [] };
  const sorted = labels.sort((a,b) => (counts[b] || 0) - (counts[a] || 0)).slice(0, 5);
  
  return {
    labels: sorted,
    datasets: [{
      backgroundColor: ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#22d3ee'],
      data: sorted.map(k => counts[k] || 0)
    }]
  };
});

const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'bottom' as const, labels: { color: '#9ca3af' } }
    }
};

// Hourly Data
const hourlyData = computed(() => {
    return {
        labels: Array.from({length: 24}, (_, i) => `${i}:00`),
        datasets: [{
            label: '訊息活躍度',
            borderColor: '#818cf8',
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            fill: true,
            tension: 0.4,
            data: stats.value.hourlyActivity
        }]
    };
});
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
    <!-- Filter Bar (Full width) -->
    <div class="md:col-span-4 bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-sm">
        <FilterControl />
    </div>

    <!-- Summary Cards -->
    <div class="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-sm">
      <h3 class="text-gray-400 text-sm font-medium">總訊息量</h3>
      <p class="text-4xl font-bold mt-2 text-white">{{ stats.totalMessages.toLocaleString() }}</p>
    </div>
    <div class="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-sm">
      <h3 class="text-gray-400 text-sm font-medium">參與人數</h3>
      <p class="text-4xl font-bold mt-2 text-indigo-400">{{ store.participants.length }}</p>
    </div>
     <div class="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-sm">
      <h3 class="text-gray-400 text-sm font-medium">天數</h3>
      <p class="text-4xl font-bold mt-2 text-emerald-400">{{ stats.daysCount }}</p>
    </div>
    <div class="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-sm">
      <h3 class="text-gray-400 text-sm font-medium">話最多</h3>
      <p class="text-xl font-bold mt-3 text-amber-400 truncate">{{ stats.ranking[0]?.name || '-' }}</p>
       <p class="text-xs text-gray-500">{{ stats.ranking[0]?.count }} msgs</p>
    </div>

    <!-- Main Chart -->
    <div class="md:col-span-3 bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-sm min-h-[400px] flex flex-col">
      <h3 class="text-lg font-semibold mb-4 text-white">訊息排行 (Top 10)</h3>
      <div class="flex-1 relative">
         <Bar :data="rankingData" :options="chartOptions" />
      </div>
    </div>

    <!-- Right Column Charts -->
    <div class="md:col-span-1 flex flex-col gap-6">
        <div class="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-sm flex-1 min-h-[300px] flex flex-col">
             <h3 class="text-lg font-semibold mb-4 text-white">貼圖王</h3>
             <div class="flex-1 relative" v-if="stickerData.labels.length">
                <Pie :data="stickerData" :options="pieOptions" />
             </div>
             <div v-else class="flex flex-1 items-center justify-center text-gray-500">
                無貼圖數據
             </div>
        </div>
    </div>

    <!-- Hourly Chart -->
    <div class="md:col-span-4 bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-sm min-h-[300px] flex flex-col">
      <h3 class="text-lg font-semibold mb-4 text-white">每日時段活躍度</h3>
      <div class="flex-1 relative">
         <Line :data="hourlyData" :options="chartOptions" />
      </div>
    </div>

    <!-- AI Analysis -->
    <div class="md:col-span-4">
        <AIAnalysis />
    </div>
  </div>
</template>
