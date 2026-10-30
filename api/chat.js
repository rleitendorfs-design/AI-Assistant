import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body ?? {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'A message is required.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'OpenAI API key is missing. Configure OPENAI_API_KEY in your deployment environment.',
    });
  }

  try {
    const openai = new OpenAI({ apiKey });
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

    return res.status(200).json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error('OpenAI request failed:', error);
    return res.status(500).json({ error: 'Failed to process AI response' });
  }
}
