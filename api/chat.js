import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn('OPENAI_API_KEY is not set. The AI endpoint will return an error until it is configured.');
}

const openai = apiKey ? new OpenAI({ apiKey }) : null;

app.get('/health', (_req, res) => {
  res.json({ ok: true, openaiConfigured: Boolean(apiKey) });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body ?? {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'A message is required.' });
    }

    if (!openai) {
      return res.status(500).json({
        error: 'OpenAI API key is missing. Set OPENAI_API_KEY in your environment before starting the server.',
      });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an elite travel assistant. Help the user plan their flights, hotels, and itineraries professionally. Keep answers concise.',
        },
        { role: 'user', content: message },
      ],
    });

    return res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to process AI response' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
