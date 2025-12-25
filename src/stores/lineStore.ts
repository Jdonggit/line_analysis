import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { type Message, type ParseResult, parseLineChat } from '../utils/lineParser';

export const useLineStore = defineStore('line', () => {
    const messages = ref<Message[]>([]);
    const loading = ref(false);

    // 解析結果統計
    const parseStats = ref<ParseResult['stats'] | null>(null);
    const parseErrors = ref<string[]>([]);
    const hasParseWarnings = computed(() => parseErrors.value.length > 0 || (parseStats.value?.skippedLines ?? 0) > 0);

    // Filters
    const dateRange = ref<{ start: string | null; end: string | null }>({ start: null, end: null });
    const timeFilter = ref<{ start: number; end: number }>({ start: 0, end: 24 });

    const participants = computed(() => {
        const set = new Set<string>();
        messages.value.forEach(m => set.add(m.sender));
        return Array.from(set);
    });

    const filteredMessages = computed(() => {
        let result = messages.value;

        // Date Filter
        if (dateRange.value.start && dateRange.value.end) {
            const start = new Date(dateRange.value.start).getTime();
            const end = new Date(dateRange.value.end).getTime();
            result = result.filter(m => {
                const t = m.date.getTime();
                return t >= start && t <= end;
            });
        }

        // Time Filter (Daily)
        if (timeFilter.value.start !== 0 || timeFilter.value.end !== 24) {
            result = result.filter(m => {
                const h = m.date.getHours();
                return h >= timeFilter.value.start && h < timeFilter.value.end;
            });
        }

        return result;
    });

    const stats = computed(() => {
        const counts: Record<string, number> = {};
        const stickerCounts: Record<string, number> = {};
        const imageCounts: Record<string, number> = {};
        const videoCounts: Record<string, number> = {};
        const fileCounts: Record<string, number> = {};
        const hourlyActivity = new Array(24).fill(0);
        const dayOfWeekActivity = new Array(7).fill(0);

        filteredMessages.value.forEach(msg => {
            // Skip system messages for statistics
            if (msg.type === 'system') return;

            // Total count per user
            counts[msg.sender] = (counts[msg.sender] || 0) + 1;

            // Type counts
            if (msg.type === 'sticker') {
                stickerCounts[msg.sender] = (stickerCounts[msg.sender] || 0) + 1;
            } else if (msg.type === 'image') {
                imageCounts[msg.sender] = (imageCounts[msg.sender] || 0) + 1;
            } else if (msg.type === 'video') {
                videoCounts[msg.sender] = (videoCounts[msg.sender] || 0) + 1;
            } else if (msg.type === 'file') {
                fileCounts[msg.sender] = (fileCounts[msg.sender] || 0) + 1;
            }

            // Hourly
            const h = msg.date.getHours();
            hourlyActivity[h]++;

            // Day of Week
            const d = msg.date.getDay();
            dayOfWeekActivity[d]++;
        });

        // Sort rankings
        const ranking = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));

        const stickerRanking = Object.entries(stickerCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));

        const mediaRanking = Object.entries(counts).map(([name]) => {
            const img = imageCounts[name] || 0;
            const vid = videoCounts[name] || 0;
            const file = fileCounts[name] || 0;
            return { name, count: img + vid + file, img, vid, file };
        }).sort((a, b) => b.count - a.count).filter(i => i.count > 0);

        const validMessages = filteredMessages.value.filter(m => m.type !== 'system');

        return {
            ranking,
            stickerCounts,
            stickerRanking,
            mediaRanking,
            hourlyActivity,
            dayOfWeekActivity,
            totalMessages: validMessages.length,
            daysCount: new Set(validMessages.map(m => m.date.toDateString())).size
        };
    });

    function loadFile(fileContent: string): ParseResult {
        loading.value = true;
        try {
            const result = parseLineChat(fileContent);
            messages.value = result.messages;
            parseStats.value = result.stats;
            parseErrors.value = result.errors;

            // 在 console 輸出詳細的解析報告
            console.group('📊 LINE 聊天記錄解析報告');
            console.log(`總行數: ${result.stats.totalLines}`);
            console.log(`日期標頭: ${result.stats.dateHeaders}`);
            console.log(`成功解析: ${result.stats.parsedMessages} 則訊息`);
            console.log(`空白行: ${result.stats.emptyLines}`);
            console.log(`跳過/失敗: ${result.stats.skippedLines}`);

            if (result.stats.failedLines.length > 0) {
                console.group('❌ 無法解析的行:');
                result.stats.failedLines.forEach(line => console.warn(line));
                console.groupEnd();
            }

            if (result.errors.length > 0) {
                console.group('⚠️ 錯誤訊息:');
                result.errors.forEach(err => console.error(err));
                console.groupEnd();
            }
            console.groupEnd();

            // Auto-set date range to full range
            if (result.messages.length > 0) {
                const dates = result.messages.map(m => m.date.getTime());
                const minDate = new Date(Math.min(...dates));
                const maxDate = new Date(Math.max(...dates));

                // 設定預設日期範圍（確保型別為 string | null）
                dateRange.value.start = minDate.toISOString().split('T')[0] ?? null;
                dateRange.value.end = maxDate.toISOString().split('T')[0] ?? null;
            }

            return result;
        } finally {
            loading.value = false;
        }
    }

    function reset() {
        messages.value = [];
        parseStats.value = null;
        parseErrors.value = [];
        dateRange.value = { start: null, end: null };
        timeFilter.value = { start: 0, end: 24 };
    }

    function clearParseWarnings() {
        parseErrors.value = [];
    }

    return {
        messages,
        loading,
        dateRange,
        timeFilter,
        filteredMessages,
        stats,
        participants,
        parseStats,
        parseErrors,
        hasParseWarnings,
        loadFile,
        reset,
        clearParseWarnings
    };
});
