document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('chat-form');
    const input = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');

    function appendMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        messageElement.textContent = message;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    let isLoading = false;
    let loadingMessageId = null;

    function removeLoadingMessage() {
        if (loadingMessageId && chatBox.contains(loadingMessageId)) {
            chatBox.removeChild(loadingMessageId);
            loadingMessageId = null;
        }
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (isLoading) return;
        
        const userMessage = input.value.trim();
        if (!userMessage) return;
        
        appendMessage('user', userMessage);
        input.value = '';
        input.disabled = true;
        
        const loadingElement = document.createElement('div');
        loadingElement.classList.add('message', 'bot', 'loading');
        loadingElement.textContent = 'Gemini is thinking...';
        chatBox.appendChild(loadingElement);
        loadingMessageId = loadingElement;
        chatBox.scrollTop = chatBox.scrollHeight;
        
        isLoading = true;
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation: [{ role: 'user', content: userMessage }]
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }
            
            const data = await response.json();
            removeLoadingMessage();
            appendMessage('bot', data.result);
        } catch (error) {
            removeLoadingMessage();
            const msg = error.name === 'AbortError' ? 'Request timeout' : error.message;
            appendMessage('bot', `Error: ${msg}`);
        } finally {
            isLoading = false;
            input.disabled = false;
            input.focus();
        }
    });
});
