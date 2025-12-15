export interface Message {
    id: string;
    date: Date;
    sender: string;
    content: string;
    type: 'text' | 'sticker' | 'image' | 'video' | 'call' | 'system';
}

export function parseLineChat(text: string): Message[] {
    const lines = text.split(/\r?\n/);
    const messages: Message[] = [];

    let currentDate: string | null = null;
    let currentMessage: Message | null = null;

    // Regex for Date headers: "2024/05/20(Mon)" or "2024/05/20"
    const dateRegex = /^(\d{4}\/\d{1,2}\/\d{1,2})/;

    // Regex for Time+Sender line: "13:30\tRex\tHello" or "13:30 Rex Hello"
    // Note: Line export usually uses tabs, but sometimes spaces if copy-pasted.
    // We assume tab or at least 3 parts.
    // Case 1: Time [tab] Sender [tab] Message
    // Case 2: System messages often don't have sender in the same format or are "13:30 [System msg]"

    // Helper to generate IDs
    let idCounter = 0;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // 1. Check for Date
        const dateMatch = trimmed.match(dateRegex);
        if (dateMatch && dateMatch[1]) {
            currentDate = dateMatch[1];
            continue;
        }

        // 2. Check for Message start
        // Standard format: HH:MM [TAB] SenderName [TAB] Content
        // Relaxed regex: HH:MM [whitespace] Sender [whitespace] Content
        const msgMatch = trimmed.match(/^(\d{1,2}:\d{2})\s+([^\s]+)\s+(.*)/);

        if (msgMatch && currentDate) {
            const timeStr = msgMatch[1];
            const sender = msgMatch[2];
            const content = msgMatch[3] || '';

            // Parse type
            let type: Message['type'] = 'text';
            const trimmedContent = content.trim();

            if (['[Sticker]', '[貼圖]', '貼圖', 'Sticker'].includes(trimmedContent)) {
                type = 'sticker';
            }
            else if (['[Photo]', '[照片]', '[圖片]', '照片', '圖片', 'Photo', 'Image'].includes(trimmedContent)) {
                type = 'image';
            }
            else if (['[Video]', '[影片]', '影片', 'Video'].includes(trimmedContent)) {
                type = 'video';
            }
            else if (['[File]', '[檔案]', '檔案', 'File'].includes(trimmedContent)) {
                type = 'video'; // Group file with others or treat specific
            }

            else if (
                (content.includes('Call') && (content.includes('Duration') || content.includes('started'))) ||
                (content.includes('通話') && (content.includes('通話時間') || content.includes('開始')))
            ) {
                type = 'call';
            }

            const dateTimeStr = `${currentDate} ${timeStr}`;
            const dateObj = new Date(dateTimeStr);

            // Log first few for debugging
            if (idCounter < 3) console.log('Parsed msg:', { timeStr, sender, content, type });

            const newMessage: Message = {
                id: `msg_${++idCounter}`,
                date: dateObj,
                sender: sender || 'Unknown',
                content: content,
                type: type
            };
            currentMessage = newMessage;
            messages.push(newMessage);
        }
        // 3. Handle multiline
        else if (currentMessage) {
            // If it's not a date and not a new message start, it's likely continuation
            currentMessage.content += '\n' + trimmed;
        }
        else {
            // Fallback: Debug unparsed lines that look like messages
            if (/^\d{1,2}:\d{2}/.test(trimmed) && currentDate) {
                console.warn('Failed to parse line:', trimmed);
            }
        }
    }

    return messages;
}
