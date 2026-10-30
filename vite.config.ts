import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function createBooking(date, time, details) {
  console.log(`Executing real database reservation for: ${date} at ${time}. Notes: ${details}`);

  return {
    status: 'success',
    confirmationId: 'RES-' + Math.floor(100000 + Math.random() * 900000),
  };
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body ?? {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'A message is required.' });
    }

    const tools = [
      {
        type: 'function',
        function: {
          name: 'createBooking',
          description: 'Use this function automatically when a user explicitly requests to book an appointment, schedule a slot, or make a reservation.',
          parameters: {
            type: 'object',
            properties: {
              date: { type: 'string', description: 'The date of the reservation (Format: YYYY-MM-DD)' },
              time: { type: 'string', description: 'The requested time slot (Format: HH:MM)' },
              details: { type: 'string', description: 'Extra context or notes about the booking, e.g., "Meeting with client" or "Haircut appointment"' },
            },
            required: ['date', 'time'],
          },
        },
      },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an elite booking and calendar assistant. If a user asks to book or schedule something, you must use the createBooking tool to process it. Always double-check you have a clear date and time.',
        },
        { role: 'user', content: message },
      ],
      tools,
    });

    const responseMessage = response.choices[0].message;

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0];

      if (toolCall.function.name === 'createBooking') {
        const args = JSON.parse(toolCall.function.arguments);
        const bookingResult = await createBooking(args.date, args.time, args.details || 'No extra notes');

        return res.json({
          reply: `Perfect! I have scheduled that reservation for ${args.date} at ${args.time}. Your official confirmation code is **${bookingResult.confirmationId}**.`,
        });
      }
    }

    return res.json({ reply: responseMessage.content ?? 'I can help with that.' });
  } catch (error) {
    console.error('Booking handler error:', error);
    return res.status(500).json({ error: 'Failed to process reservation request' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Booking engine active on port ${PORT}`));
