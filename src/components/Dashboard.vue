
<script setup lang="ts">
import { ref, computed } from 'vue';
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
import { Bar, Line } from 'vue-chartjs';
import FilterControl from './FilterControl.vue';
import AIAnalysis from './AIAnalysis.vue';
import { LayoutDashboard, Sticker, FileVideo } from 'lucide-vue-next';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const store = useLineStore();
const stats = computed(() => store.stats);

type TabType = 'overview' | 'stickers' | 'media';
const currentTab = ref<TabType>('overview');

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

const stickerRankingData = computed(() => {
  const top10 = stats.value.stickerRanking.slice(0, 10);
  return {
    labels: top10.map(i => i.name),
    datasets: [{
      label: '貼圖數量',
      backgroundColor: '#f59e0b',
      data: top10.map(i => i.count)
    }]
  };
});

const mediaRankingData = computed(() => {
  const top10 = stats.value.mediaRanking.slice(0, 10);
  return {
    labels: top10.map(i => i.name),
    datasets: [
        {
            label: '圖片',
            backgroundColor: '#10b981',
            data: top10.map(i => i.img)
        },
        {
            label: '影片',
            backgroundColor: '#3b82f6',
            data: top10.map(i => i.vid)
        },
        {
            label: '檔案',
            backgroundColor: '#6366f1',
            data: top10.map(i => i.file)
        }
    ]
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

const mediaChartOptions = {
    ...chartOptions,
    plugins: {
        ...chartOptions.plugins,
        legend: { display: true, labels: { color: '#9ca3af' } }
    },
    scales: {
        ...chartOptions.scales,
        x: { ...chartOptions.scales.x, stacked: true },
        y: { ...chartOptions.scales.y, stacked: true }
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
  <div class="space-y-6">
    <!-- Filter Bar -->
    <div class="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-sm">
        <FilterControl />
    </div>

    <!-- Tab Navigation -->
    <div class="flex gap-2 p-1 bg-neutral-800 rounded-xl border border-neutral-700 w-fit">
        <button 
            @click="currentTab = 'overview'"
            :class="[
                'flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all',
                currentTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white hover:bg-neutral-700'
            ]"
        >
            <LayoutDashboard class="w-4 h-4" />
            總覽
        </button>
        <button 
            @click="currentTab = 'stickers'"
            :class="[
                'flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all',
                currentTab === 'stickers' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white hover:bg-neutral-700'
            ]"
        >
            <Sticker class="w-4 h-4" />
            貼圖
        </button>
        <button 
            @click="currentTab = 'media'"
            :class="[
                'flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all',
                currentTab === 'media' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-neutral-700'
            ]"
        >
            <FileVideo class="w-4 h-4" />
            影音檔案
        </button>
    </div>

    <!-- Dashboard Content -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      
      <!-- Summary Cards (Show in all tabs or different ones?) -->
      <template v-if="currentTab === 'overview'">
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

        <!-- Main Ranking Chart -->
        <div class="md:col-span-4 bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-sm min-h-[400px] flex flex-col">
            <h3 class="text-lg font-semibold mb-4 text-white">訊息排行 (Top 10)</h3>
            <div class="flex-1 relative">
                <Bar :data="rankingData" :options="chartOptions" />
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
      </template>

      <!-- Stickers Tab -->
      <template v-else-if="currentTab === 'stickers'">
        <div class="md:col-span-4 bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-sm min-h-[500px] flex flex-col">
            <div class="flex items-center gap-2 mb-6">
                <Sticker class="text-amber-500 w-6 h-6" />
                <h3 class="text-xl font-bold text-white">貼圖排行 (誰最愛傳貼圖)</h3>
            </div>
            <div class="flex-1 relative">
                <Bar :data="stickerRankingData" :options="{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }" />
            </div>
        </div>
        
        <div class="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div v-for="(item, index) in stats.stickerRanking.slice(0, 8)" :key="item.name" 
                 class="bg-neutral-900/50 p-4 rounded-xl border border-neutral-700 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="text-lg font-bold text-gray-500 w-6">#{{ index + 1 }}</span>
                    <span class="text-white font-medium truncate max-w-[120px]">{{ item.name }}</span>
                </div>
                <span class="text-amber-500 font-bold">{{ item.count }}</span>
            </div>
        </div>
      </template>

      <!-- Media & Files Tab -->
      <template v-else-if="currentTab === 'media'">
        <div class="md:col-span-4 bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-sm min-h-[500px] flex flex-col">
            <div class="flex items-center gap-2 mb-6">
                <FileVideo class="text-emerald-500 w-6 h-6" />
                <h3 class="text-xl font-bold text-white">影音檔案排行</h3>
            </div>
            <div class="flex-1 relative">
                <Bar :data="mediaRankingData" :options="mediaChartOptions" />
            </div>
        </div>

        <div class="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
             <div v-for="item in stats.mediaRanking.slice(0, 6)" :key="item.name" 
                  class="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-sm">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold">
                        {{ item.name.charAt(0) }}
                    </div>
                    <div>
                        <h4 class="text-white font-bold truncate max-w-[150px]">{{ item.name }}</h4>
                        <p class="text-xs text-gray-400">總計 {{ item.count }} 個檔案</p>
                    </div>
                </div>
                <div class="space-y-3">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-400 flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-emerald-500"></div> 圖片</span>
                        <span class="text-white">{{ item.img }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-400 flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-blue-500"></div> 影片</span>
                        <span class="text-white">{{ item.vid }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-400 flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-indigo-500"></div> 檔案</span>
                        <span class="text-white">{{ item.file }}</span>
                    </div>
                </div>
             </div>
        </div>
      </template>

    </div>
  </div>
</template>
