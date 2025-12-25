export interface Message {
    id: string;
    date: Date;
    sender: string;
    content: string;
    type: 'text' | 'sticker' | 'image' | 'video' | 'call' | 'file' | 'system';
}

export interface ParseResult {
    messages: Message[];
    stats: {
        totalLines: number;
        parsedMessages: number;
        skippedLines: number;
        dateHeaders: number;
        emptyLines: number;
        failedLines: string[];  // 記錄無法解析的行（最多保留 20 條）
    };
    errors: string[];
}

export function parseLineChat(text: string): ParseResult {
    const lines = text.split(/\r?\n/);
    const messages: Message[] = [];
    const errors: string[] = [];
    const failedLines: string[] = [];

    let currentDate: string | null = null;
    let currentMessage: Message | null = null;

    // 統計數據
    const totalLines = lines.length;
    let emptyLines = 0;
    let dateHeaders = 0;
    let skippedLines = 0;

    // 支援多種日期格式：
    // - 2024/05/20(Mon) 或 2024/05/20
    // - 2024-05-20 或 2024.05.20
    // - 西元年/月/日 格式
    const dateRegex = /^(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/;

    // Helper to generate IDs
    let idCounter = 0;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        if (line === undefined) continue;

        const trimmed = line.trim();

        if (!trimmed) {
            emptyLines++;
            continue;
        }

        // 1. Check for Date header
        const dateMatch = trimmed.match(dateRegex);
        if (dateMatch && dateMatch[1]) {
            // 標準化日期格式為 YYYY/MM/DD
            currentDate = dateMatch[1].replace(/[\-\.]/g, '/');
            dateHeaders++;
            continue;
        }

        // 2. Check for Message start
        // 優先使用 Tab 分隔（LINE 官方匯出格式）
        // 格式: HH:MM [TAB] SenderName [TAB] Content
        const tabParts = trimmed.split('\t');

        let msgParsed = false;

        // 方式一：Tab 分隔格式（最準確，支援包含空格的用戶名）
        if (tabParts.length >= 2) {
            const timeStr = tabParts[0] ?? '';
            if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
                const sender = tabParts[1] ?? '';
                const content = tabParts.slice(2).join('\t');

                if (currentDate && sender) {
                    const msg = createMessage(++idCounter, currentDate, timeStr, sender, content);
                    if (msg) {
                        currentMessage = msg;
                        messages.push(msg);
                        msgParsed = true;
                    }
                }
            }
        }

        // 方式二：空格分隔格式（fallback，用戶名不能含空格）
        if (!msgParsed) {
            const spaceMatch = trimmed.match(/^(\d{1,2}:\d{2})\s+([^\s]+)\s*(.*)/);
            if (spaceMatch && currentDate) {
                const timeStr = spaceMatch[1] ?? '';
                const sender = spaceMatch[2] ?? '';
                const content = spaceMatch[3] ?? '';

                const msg = createMessage(++idCounter, currentDate, timeStr, sender, content);
                if (msg) {
                    currentMessage = msg;
                    messages.push(msg);
                    msgParsed = true;
                }
            }
        }

        // 方式三：只有時間和發送者，沒有內容
        if (!msgParsed) {
            const minimalMatch = trimmed.match(/^(\d{1,2}:\d{2})\s+(.+)$/);
            if (minimalMatch && currentDate && minimalMatch[2] && !minimalMatch[2].includes('\t')) {
                // 這可能是系統訊息或特殊格式
                const timeStr = minimalMatch[1] ?? '';
                const rest = minimalMatch[2] ?? '';

                // 檢查是否為系統訊息
                if (isSystemMessage(rest)) {
                    const msg = createMessage(++idCounter, currentDate, timeStr, 'System', rest);
                    if (msg) {
                        msg.type = 'system';
                        currentMessage = msg;
                        messages.push(msg);
                        msgParsed = true;
                    }
                }
            }
        }

        // 3. Handle multiline content
        if (!msgParsed && currentMessage) {
            // 不是日期也不是新訊息，視為上一則訊息的延續
            currentMessage.content += '\n' + trimmed;
            continue;
        }

        // 4. 無法解析的行
        if (!msgParsed) {
            // 如果看起來像訊息但無法解析
            if (/^\d{1,2}:\d{2}/.test(trimmed)) {
                skippedLines++;
                if (failedLines.length < 20) {
                    failedLines.push(`行 ${lineIndex + 1}: ${trimmed.substring(0, 100)}`);
                }
                console.warn(`[LineParser] 無法解析第 ${lineIndex + 1} 行:`, trimmed);
            } else if (currentDate === null && !dateMatch) {
                // 還沒讀到日期，但有內容
                skippedLines++;
                if (failedLines.length < 20) {
                    failedLines.push(`行 ${lineIndex + 1} (無日期): ${trimmed.substring(0, 80)}`);
                }
            }
        }
    }

    // 生成錯誤訊息
    if (dateHeaders === 0) {
        errors.push('找不到日期標頭，請確認檔案格式是否正確（需要 YYYY/MM/DD 或 YYYY-MM-DD 格式）');
    }

    if (messages.length === 0) {
        if (dateHeaders > 0) {
            errors.push('找到日期但無法解析任何訊息，可能是訊息格式不相容');
        } else {
            errors.push('無法解析任何內容，請確認這是 LINE 聊天記錄匯出檔案');
        }
    }

    if (skippedLines > 0) {
        errors.push(`有 ${skippedLines} 行無法解析`);
    }

    return {
        messages,
        stats: {
            totalLines,
            parsedMessages: messages.length,
            skippedLines,
            dateHeaders,
            emptyLines,
            failedLines
        },
        errors
    };
}

function createMessage(
    id: number,
    dateStr: string,
    timeStr: string,
    sender: string,
    content: string
): Message | null {
    const dateTimeStr = `${dateStr} ${timeStr}`;
    const dateObj = new Date(dateTimeStr);

    // 驗證日期是否有效
    if (isNaN(dateObj.getTime())) {
        console.warn(`[LineParser] 無效的日期時間: ${dateTimeStr}`);
        return null;
    }

    // 判斷訊息類型
    const type = detectMessageType(content);

    return {
        id: `msg_${id}`,
        date: dateObj,
        sender: sender || 'Unknown',
        content: content,
        type: (sender && isSystemMessage(sender)) ? 'system' : type
    };
}

function detectMessageType(content: string): Message['type'] {
    const trimmedContent = content.trim();

    // 貼圖
    if (['[Sticker]', '[貼圖]', '貼圖', 'Sticker', '[スタンプ]'].includes(trimmedContent)) {
        return 'sticker';
    }

    // 照片/圖片
    if (['[Photo]', '[照片]', '[圖片]', '照片', '圖片', 'Photo', 'Image', '[画像]'].includes(trimmedContent)) {
        return 'image';
    }

    // 影片
    if (['[Video]', '[影片]', '影片', 'Video', '[動画]'].includes(trimmedContent)) {
        return 'video';
    }

    // 檔案
    if (['[File]', '[檔案]', '檔案', 'File', '[ファイル]'].includes(trimmedContent)) {
        return 'file';
    }

    // 通話
    if (
        (content.includes('Call') && (content.includes('Duration') || content.includes('started') || content.includes('Missed'))) ||
        (content.includes('通話') && (content.includes('通話時間') || content.includes('開始') || content.includes('未接'))) ||
        content.includes('☎')
    ) {
        return 'call';
    }

    // 系統訊息 / 收回訊息
    if (['收回了訊息', '已收回訊息', 'unsent a message', 'unsent message'].some(keyword => trimmedContent.includes(keyword))) {
        return 'system';
    }

    return 'text';
}

function isSystemMessage(text: string): boolean {
    const systemKeywords = [
        '已加入聊天', '已離開聊天', '已邀請', '已移除',
        '更改了群組名稱', '更改了群組圖片',
        'joined the chat', 'left the chat', 'invited', 'removed',
        'changed the group name', 'changed the group photo',
        '收回了訊息', '已收回訊息', 'unsent a message', 'unsent message',
        '已建立記事本', '已建立相簿'
    ];

    return systemKeywords.some(keyword => text.includes(keyword));
}

// 保留舊的函數簽名以維持向後相容（但內部使用新的解析器）
export function parseLineChatLegacy(text: string): Message[] {
    return parseLineChat(text).messages;
}
