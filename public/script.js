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

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const userMessage = input.value.trim();
        if (!userMessage) return;
        appendMessage('user', userMessage);
        input.value = '';
        
        // Show loading indicator
        appendMessage('bot', 'Gemini is thinking...');
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conversation: [
                        { role: 'user', content: userMessage }
                    ]
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            // Remove the loading message
            const lastMessage = chatBox.lastChild;
            if (lastMessage && lastMessage.textContent === 'Gemini is thinking...') {
                chatBox.removeChild(lastMessage);
            }
            appendMessage('bot', data.result);
        } catch (error) {
            // Remove the loading message
            const lastMessage = chatBox.lastChild;
            if (lastMessage && lastMessage.textContent === 'Gemini is thinking...') {
                chatBox.removeChild(lastMessage);
            }
            appendMessage('bot', `Error: ${error.message}`);
        }
    });
});
