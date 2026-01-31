import 'dotenv/config';
import express, { text } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, PartMediaResolutionLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = 'gemini-2.5-flash';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting middleware
const requestCounts = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60000;

app.use((req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    if (!requestCounts.has(ip)) requestCounts.set(ip, []);
    const requests = requestCounts.get(ip).filter(time => now - time < RATE_WINDOW);
    if (requests.length >= RATE_LIMIT) {
        return res.status(429).json({ error: 'Too many requests' });
    }
    requests.push(now);
    requestCounts.set(ip, requests);
    next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

app.post('/api/chat', async (req, res) => {
    const { conversation } = req.body;

    try {
        if (!conversation) throw new Error('Conversation is required');
        if (!Array.isArray(conversation)) throw new Error('Conversation must be an array');
        if (conversation.length === 0) throw new Error('Conversation cannot be empty');
        if (conversation.length > 50) throw new Error('Conversation history too long');
        
        const messages = conversation.map(msg => {
            if (!msg.role || !msg.content) throw new Error('Each message must have role and content');
            return {
                role: msg.role.toLowerCase(),
                content: String(msg.content).trim().substring(0, 5000)
            };
        });

        const contents = messages.map(({role, content }) => ({
            role,
            parts: [{ text: content }],
        }));

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: {
                temperature: 0.7,
                systemInstruction: 'Jawab Hanya Menggunakan Bahasa Indonesia.',
            },
        });
        
        res.status(200).json({ result: response.text || 'No response generated' });
    } catch (error) {
        console.error('Error:', error.message);
        const statusCode = error.message.includes('required') || error.message.includes('must') ? 400 : 500;
        res.status(statusCode).json({ error: error.message });
    }
}); 
