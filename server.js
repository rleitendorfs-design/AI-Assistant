import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI with your Secret API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and highly affordable model
      messages: [
        { 
          role: 'system', 
          content: 'You are an elite travel assistant. Help the user plan their flights, hotels, and itineraries professionally. Keep answers concise.' 
        },
        { role: 'user', content: message }
      ],
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process AI response' });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
