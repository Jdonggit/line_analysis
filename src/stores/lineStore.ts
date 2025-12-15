import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { type Message, parseLineChat } from '../utils/lineParser';

export const useLineStore = defineStore('line', () => {
    const messages = ref<Message[]>([]);
    const loading = ref(false);

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
        const hourlyActivity = new Array(24).fill(0);
        const dayOfWeekActivity = new Array(7).fill(0);

        filteredMessages.value.forEach(msg => {
            // Total count per user
            counts[msg.sender] = (counts[msg.sender] || 0) + 1;

            // Sticker count
            if (msg.type === 'sticker') {
                stickerCounts[msg.sender] = (stickerCounts[msg.sender] || 0) + 1;
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

        return {
            ranking,
            stickerCounts,
            hourlyActivity,
            dayOfWeekActivity,
            totalMessages: filteredMessages.value.length,
            daysCount: new Set(filteredMessages.value.map(m => m.date.toDateString())).size
        };
    });

    function loadFile(fileContent: string) {
        loading.value = true;
        try {
            const parsed = parseLineChat(fileContent);
            messages.value = parsed;

            // Auto-set date range to full range
            if (parsed.length > 0) {
                // Find min/max logic could go here if we want default range to match data
            }
        } finally {
            loading.value = false;
        }
    }

    function reset() {
        messages.value = [];
    }

    return {
        messages,
        loading,
        dateRange,
        timeFilter,
        filteredMessages,
        stats,
        participants,
        loadFile,
        reset
    };
});
