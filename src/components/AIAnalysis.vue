<script setup lang="ts">
import { ref } from 'vue';
import { useLineStore } from '../stores/lineStore';
import { Sparkles, Key, X } from 'lucide-vue-next';

const store = useLineStore();
const apiKey = ref(localStorage.getItem('openai_api_key') || '');
const model = ref(localStorage.getItem('openai_model') || 'gpt-4o-mini');
const result = ref('');
const analyzing = ref(false);
const showKeyModal = ref(false);

const verificationStatus = ref<'idle' | 'checking' | 'success' | string>('idle');
const verificationMsg = ref('');

function saveKey() {
    localStorage.setItem('openai_api_key', apiKey.value);
    localStorage.setItem('openai_model', model.value);
    showKeyModal.value = false;
    verificationStatus.value = 'idle';
}

function clearKey() {
    apiKey.value = '';
    localStorage.removeItem('openai_api_key');
    verificationStatus.value = 'idle';
    verificationMsg.value = '';
}

async function verifyAndSave() {
    verificationStatus.value = 'checking';
    verificationMsg.value = '連線至 OpenAI...';

    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${apiKey.value}` }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error?.message || 'Invalid API Key');
        }

        verificationStatus.value = 'success';
        verificationMsg.value = '驗證成功！';
        
        setTimeout(() => {
            saveKey();
        }, 800);

    } catch (e: any) {
        verificationStatus.value = 'error';
        verificationMsg.value = '驗證失敗：' + e.message;
    }
}


function openKeySettings() {
    apiKey.value = localStorage.getItem('openai_api_key') || '';
    model.value = localStorage.getItem('openai_model') || 'gpt-4o-mini';
    showKeyModal.value = true;
}

const customPrompt = ref('');

async function analyze() {
    const storedKey = localStorage.getItem('openai_api_key');
    const storedModel = localStorage.getItem('openai_model') || 'gpt-4o-mini';
    
    if (!storedKey) {
        showKeyModal.value = true;
        return;
    }

    analyzing.value = true;
    result.value = '';

    try {
        // Prepare data: limit to last 200 messages
        const messagesToAnalyze = store.filteredMessages.slice(-200).map(m => `${m.sender}: ${m.content}`).join('\n');
        
        const userQuestion = customPrompt.value.trim() || '分析對話中的語氣，指出誰比較不耐煩？還有什麼有趣的習慣用語？';

        const prompt = `
        你是一個 Line 對話分析師。請「嚴格依據」以下對話紀錄 (約最後 200 則) 來回答使用者的問題。
        
        使用者問題：
        ${userQuestion}
        
        重要規則：
        1. 如果問題無法從對話紀錄中得到答案，請直接回答「對話紀錄中沒有相關資訊」，不要使用你的外部知識回答 (例如不要回答食譜、數學題等一般知識)。
        2. 請用繁體中文回答。
        3. 使用 Markdown 格式。
        
        對話紀錄：
        ${messagesToAnalyze}
        `;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${storedKey}`
            },
            body: JSON.stringify({
                model: storedModel,
                messages: [
                    { role: 'system', content: 'You are a helpful assistant analyzing chat logs.' },
                    { role: 'user', content: prompt }
                ]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        result.value = data.choices[0].message.content;

    } catch (e: any) {
        result.value = `Error: ${e.message}`;
        // If 401, prompt for key again
        if (e.message.includes('401') || e.message.includes('key')) {
             showKeyModal.value = true;
        }
    } finally {
        analyzing.value = false;
    }
}
</script>

<template>
  <div class="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-sm relative overflow-hidden">
      <!-- Background Decor -->
      <div class="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>

      <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles class="text-amber-400" />
              AI 語意分析
          </h3>
          <button @click="openKeySettings" class="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-700 hover:border-indigo-500">
              <Key class="w-4 h-4" />
              {{ apiKey ? '變更 API Key' : '設定 API Key' }}
          </button>
      </div>

      <!-- Action Area -->
      <div>
          <div v-if="!result && !analyzing" class="py-4">
              <label class="block text-sm text-gray-400 mb-2">你想問 AI 什麼？</label>
              <div class="flex gap-2">
                  <input 
                    v-model="customPrompt"
                    type="text" 
                    placeholder="例：誰最不耐煩？這週主要在聊什麼？" 
                    class="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    @keydown.enter="analyze"
                  >
                  <button 
                    @click="analyze"
                    class="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 whitespace-nowrap"
                  >
                      ✨ 分析
                  </button>
              </div>
          </div>

          <!-- Loading -->
          <div v-if="analyzing" class="text-center py-12">
              <div class="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p class="text-gray-300 animate-pulse">AI 正在閱讀對話...</p>
          </div>

          <!-- Result -->
          <div v-if="result" class="prose prose-invert max-w-none bg-neutral-900/50 p-6 rounded-lg border border-neutral-700 mt-4">
              <div class="whitespace-pre-wrap leading-relaxed text-gray-200">{{ result }}</div>
              <div class="flex justify-end mt-4">
                  <button @click="result = ''" class="text-sm text-gray-400 hover:text-white underline">
                      清除結果
                  </button>
              </div>
          </div>
      </div>

      <!-- API Key Modal -->
      <div v-if="showKeyModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div class="bg-neutral-800 border border-neutral-700 rounded-xl w-full max-w-md p-6 shadow-2xl transform transition-all scale-100">
              <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-bold text-white flex items-center gap-2">
                      <Key class="w-5 h-5 text-indigo-400" />
                      設定 OpenAI API Key
                  </h3>
                  <button @click="showKeyModal = false" class="text-gray-400 hover:text-white">
                      <X class="w-5 h-5" />
                  </button>
              </div>
              
              <p class="text-sm text-gray-400 mb-4">
                  本功能需要 OpenAI API Key 才能運作。您的 Key 僅會儲存在您的瀏覽器中，不會上傳至我們的伺服器。
              </p>

              <div class="space-y-4">
                  <div>
                      <label class="block text-xs font-medium text-gray-300 mb-1">API Key (sk-...)</label>
                      <input 
                        v-model="apiKey" 
                        type="password" 
                        autocomplete="off"
                        placeholder="sk-..." 
                        class="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      >
                  </div>

                  <div>
                      <label class="block text-xs font-medium text-gray-300 mb-1">AI 模型</label>
                      <select 
                        v-model="model" 
                        class="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
                      >
                          <option value="gpt-4o-mini">GPT-4o Mini (Default)</option>
                          <option value="gpt-4o">GPT-4o (Smartest)</option>
                          <option value="gpt-4-turbo">GPT-4 Turbo</option>
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Standard)</option>
                      </select>
                      <p class="text-[10px] text-gray-500 mt-1">
                          若出現 "no access to model" 錯誤，請切換至 GPT-3.5 Turbo 試試。
                      </p>
                  </div>
                  
                  <!-- Validation Message -->
                  <div v-if="verificationStatus" :class="{
                      'text-emerald-400': verificationStatus === 'success',
                      'text-red-400': verificationStatus.startsWith('error'),
                      'text-yellow-400': verificationStatus === 'checking'
                  }" class="text-xs flex items-center gap-1">
                      <div v-if="verificationStatus === 'checking'" class="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      <span>{{ verificationMsg }}</span>
                  </div>

                  <div class="flex justify-between mt-6">
                      <button 
                        v-if="apiKey"
                        @click="clearKey"
                        class="px-4 py-2 text-red-400 hover:text-red-300 text-sm hover:bg-red-400/10 rounded-lg transition-colors"
                      >
                          清除 Key
                      </button>
                      <div v-else></div> <!-- Spacer -->

                      <div class="flex gap-3">
                          <button @click="showKeyModal = false" class="px-4 py-2 text-gray-400 hover:text-white text-sm">取消</button>
                      <button 
                        @click="verifyAndSave" 
                        class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                        :disabled="!apiKey || verificationStatus === 'checking'"
                        :class="{'opacity-50 cursor-not-allowed': !apiKey || verificationStatus === 'checking'}"
                      >
                          {{ verificationStatus === 'checking' ? '驗證中...' : '驗證並儲存' }}
                      </button>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  </div>
</template>
