<script setup lang="ts">
import { ref, computed } from 'vue';
import { useLineStore } from '../stores/lineStore';
import { UploadCloud, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-vue-next';

const store = useLineStore();
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const showDetails = ref(false);

// 解析結果狀態
const parseResult = ref<'idle' | 'success' | 'warning' | 'error'>('idle');
const fileName = ref('');

const statusMessage = computed(() => {
  if (!store.parseStats) return '';
  
  const stats = store.parseStats;
  if (stats.parsedMessages === 0) {
    return '無法解析任何訊息';
  }
  
  if (stats.skippedLines > 0) {
    return `成功解析 ${stats.parsedMessages} 則訊息，${stats.skippedLines} 行無法解析`;
  }
  
  return `成功解析 ${stats.parsedMessages} 則訊息`;
});

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
  fileName.value = file.name;
  parseResult.value = 'idle';
  showDetails.value = false;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result as string;
    const result = store.loadFile(text);
    
    // 判斷解析結果狀態
    if (result.messages.length === 0) {
      parseResult.value = 'error';
    } else if (result.stats.skippedLines > 0 || result.errors.length > 0) {
      parseResult.value = 'warning';
    } else {
      parseResult.value = 'success';
    }
  };
  reader.readAsText(file);
}

function triggerFileInput() {
  fileInput.value?.click();
}

function dismissWarning() {
  store.clearParseWarnings();
  parseResult.value = store.parseStats?.parsedMessages ? 'success' : 'idle';
}
</script>

<template>
  <div class="w-full max-w-2xl mx-auto">
    <!-- Drop Zone -->
    <div 
      class="p-10 border-2 border-dashed rounded-xl transition-colors cursor-pointer flex flex-col items-center justify-center gap-4"
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

    <p class="mt-8 text-gray-500 max-w-md text-center text-sm">
      您的資料僅會在瀏覽器中處理，<span class="text-indigo-400 font-medium whitespace-nowrap">絕不會上傳</span> 到任何伺服器。
    </p>

    <!-- Parse Result Banner -->
    <div v-if="parseResult !== 'idle' && store.parseStats" class="mt-4">
      <!-- Success -->
      <div 
        v-if="parseResult === 'success'"
        class="p-4 rounded-lg bg-emerald-900/30 border border-emerald-700 flex items-center gap-3"
      >
        <CheckCircle class="w-6 h-6 text-emerald-400 flex-shrink-0" />
        <div class="flex-1">
          <p class="text-emerald-300 font-medium">{{ statusMessage }}</p>
          <p class="text-emerald-400/70 text-sm">{{ fileName }}</p>
        </div>
      </div>

      <!-- Warning -->
      <div 
        v-else-if="parseResult === 'warning'"
        class="rounded-lg bg-amber-900/30 border border-amber-700 overflow-hidden"
      >
        <div class="p-4 flex items-center gap-3">
          <AlertTriangle class="w-6 h-6 text-amber-400 flex-shrink-0" />
          <div class="flex-1">
            <p class="text-amber-300 font-medium">{{ statusMessage }}</p>
            <p class="text-amber-400/70 text-sm">{{ fileName }}</p>
          </div>
          <button 
            @click.stop="showDetails = !showDetails"
            class="p-2 hover:bg-amber-800/30 rounded-lg transition-colors"
          >
            <ChevronDown v-if="!showDetails" class="w-5 h-5 text-amber-400" />
            <ChevronUp v-else class="w-5 h-5 text-amber-400" />
          </button>
          <button 
            @click.stop="dismissWarning"
            class="p-2 hover:bg-amber-800/30 rounded-lg transition-colors"
            title="關閉警告"
          >
            <XCircle class="w-5 h-5 text-amber-400" />
          </button>
        </div>

        <!-- Details -->
        <div v-if="showDetails" class="px-4 pb-4 border-t border-amber-700/50">
          <div class="mt-3 space-y-2">
            <h4 class="text-amber-300 font-medium text-sm">解析統計：</h4>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="text-gray-400">總行數：</div>
              <div class="text-gray-300">{{ store.parseStats.totalLines }}</div>
              <div class="text-gray-400">日期標頭：</div>
              <div class="text-gray-300">{{ store.parseStats.dateHeaders }}</div>
              <div class="text-gray-400">成功解析：</div>
              <div class="text-emerald-400">{{ store.parseStats.parsedMessages }} 則</div>
              <div class="text-gray-400">空白行：</div>
              <div class="text-gray-300">{{ store.parseStats.emptyLines }}</div>
              <div class="text-gray-400">無法解析：</div>
              <div class="text-amber-400">{{ store.parseStats.skippedLines }} 行</div>
            </div>

            <!-- Failed Lines -->
            <div v-if="store.parseStats.failedLines.length > 0" class="mt-3">
              <h4 class="text-amber-300 font-medium text-sm mb-2">無法解析的行範例：</h4>
              <div class="bg-black/30 rounded-lg p-3 max-h-40 overflow-y-auto">
                <div 
                  v-for="(line, index) in store.parseStats.failedLines" 
                  :key="index"
                  class="text-xs text-gray-400 font-mono break-all py-1 border-b border-gray-800 last:border-0"
                >
                  {{ line }}
                </div>
              </div>
            </div>

            <!-- Errors -->
            <div v-if="store.parseErrors.length > 0" class="mt-3">
              <h4 class="text-amber-300 font-medium text-sm mb-2">錯誤訊息：</h4>
              <ul class="space-y-1">
                <li 
                  v-for="(error, index) in store.parseErrors" 
                  :key="index"
                  class="text-sm text-amber-400/80"
                >
                  • {{ error }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div 
        v-else-if="parseResult === 'error'"
        class="rounded-lg bg-red-900/30 border border-red-700 overflow-hidden"
      >
        <div class="p-4 flex items-center gap-3">
          <XCircle class="w-6 h-6 text-red-400 flex-shrink-0" />
          <div class="flex-1">
            <p class="text-red-300 font-medium">無法解析聊天記錄</p>
            <p class="text-red-400/70 text-sm">{{ fileName }}</p>
          </div>
          <button 
            @click.stop="showDetails = !showDetails"
            class="p-2 hover:bg-red-800/30 rounded-lg transition-colors"
          >
            <ChevronDown v-if="!showDetails" class="w-5 h-5 text-red-400" />
            <ChevronUp v-else class="w-5 h-5 text-red-400" />
          </button>
        </div>

        <!-- Error Details -->
        <div v-if="showDetails" class="px-4 pb-4 border-t border-red-700/50">
          <div class="mt-3 space-y-3">
            <div v-if="store.parseErrors.length > 0">
              <h4 class="text-red-300 font-medium text-sm mb-2">可能的原因：</h4>
              <ul class="space-y-1">
                <li 
                  v-for="(error, index) in store.parseErrors" 
                  :key="index"
                  class="text-sm text-red-400/80"
                >
                  • {{ error }}
                </li>
              </ul>
            </div>

            <div class="mt-3 p-3 bg-black/30 rounded-lg">
              <h4 class="text-gray-300 font-medium text-sm mb-2">支援的格式：</h4>
              <ul class="text-xs text-gray-400 space-y-1">
                <li>• 日期格式：2024/05/20、2024-05-20、2024.05.20</li>
                <li>• 訊息格式：時間[Tab]發送者[Tab]內容</li>
                <li>• 請使用 LINE 官方的「匯出聊天記錄」功能</li>
              </ul>
            </div>

            <!-- Show raw stats if available -->
            <div v-if="store.parseStats" class="grid grid-cols-2 gap-2 text-sm">
              <div class="text-gray-400">總行數：</div>
              <div class="text-gray-300">{{ store.parseStats.totalLines }}</div>
              <div class="text-gray-400">日期標頭：</div>
              <div :class="store.parseStats.dateHeaders > 0 ? 'text-emerald-400' : 'text-red-400'">
                {{ store.parseStats.dateHeaders }}
              </div>
            </div>

            <!-- Failed Lines -->
            <div v-if="store.parseStats?.failedLines.length > 0" class="mt-3">
              <h4 class="text-red-300 font-medium text-sm mb-2">無法解析的內容範例：</h4>
              <div class="bg-black/30 rounded-lg p-3 max-h-40 overflow-y-auto">
                <div 
                  v-for="(line, index) in store.parseStats.failedLines" 
                  :key="index"
                  class="text-xs text-gray-400 font-mono break-all py-1 border-b border-gray-800 last:border-0"
                >
                  {{ line }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Instructions -->
    <div class="mt-8 sm:mt-12 border-t border-zinc-800 pt-6 sm:pt-8">
      <h3 class="text-base sm:text-lg font-semibold text-gray-200 mb-4 sm:mb-6 flex items-center gap-2">
        <UploadCloud class="w-5 h-5 text-indigo-400" />
        如何匯出 LINE 聊天記錄？
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div class="bg-zinc-800/30 p-4 rounded-xl border border-zinc-700/50">
          <div class="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center font-bold mb-3 text-sm sm:text-base">1</div>
          <p class="text-gray-300 text-xs sm:text-sm leading-relaxed">
            進入 LINE <br/>
            點選該聊天室的右上角「<span class="text-indigo-400 font-medium">≡</span>」選單
          </p>
        </div>

        <div class="bg-zinc-800/30 p-4 rounded-xl border border-zinc-700/50">
          <div class="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center font-bold mb-3 text-sm sm:text-base">2</div>
          <p class="text-gray-300 text-xs sm:text-sm leading-relaxed">
            點擊「<span class="text-indigo-400 font-medium">設定</span>」<br/>
            並選擇「<span class="text-indigo-400 font-medium">傳送聊天記錄</span>」
          </p>
        </div>

        <div class="bg-zinc-800/30 p-4 rounded-xl border border-zinc-700/50">
          <div class="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center font-bold mb-3 text-sm sm:text-base">3</div>
          <p class="text-gray-300 text-xs sm:text-sm leading-relaxed">
            將生成的 <span class="text-indigo-400 font-medium">.txt 檔案</span> <br/>
            傳送到電腦或手機內並拖放至此
          </p>
        </div>
      </div>

      <div class="mt-6 p-4 bg-amber-900/10 border border-amber-900/30 rounded-lg text-[10px] sm:text-xs text-amber-200/70">
        <p>💡 提示：匯出的檔案必須為點擊「傳送聊天記錄」後生成的文字檔 (.txt)，直接複製貼上文字將無法解析。</p>
      </div>
    </div>
  </div>
</template>
