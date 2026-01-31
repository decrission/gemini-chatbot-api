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
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

app.post('/api/chat', async (req, res) => {
    const { conversation } = req.body;
    const messages = conversation;

    try {
        if (!Array.isArray(messages)) throw new Error('Messages must be an array');

        const contents = messages.map(({role, content }) => ({
            role,
            parts: [{ text: content }],
        }));

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: {
                temperature: 0.9,
                systemInstruction: 'Jawab Hanya Menggunakan Bahasa Indonesia.',
            },
        });
        res.status(200).json({ result: response.text });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
}); 
