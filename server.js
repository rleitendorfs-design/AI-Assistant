import { useEffect, useRef, useState } from 'react';
import { Plane, Sparkles } from 'lucide-react';
import ChatBubble, { type ChatMessage } from '@/components/assistant/ChatBubble';
import ChatComposer from '@/components/assistant/ChatComposer';

const SUGGESTIONS = [
  'Fly to Lisbon from March 3 to March 10',
  'A weekend in Tokyo next month',
  'Business trip to Chicago, 2 nights in a hotel downtown',
];

const GREETING: ChatMessage = {
  id: 'greeting',
  role: 'assistant',
  text: 'Tell me where you want to go and when. I can plan the flights and stay, and save them to your Bookings page for you to confirm.',
};

export default function TripAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [nextId, setNextId] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const showSuggestions = messages.length === 1;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function handleSend(text: string) {
    const currentUserId = `m-${nextId}`;
    const currentAssistantId = `m-${nextId + 1}`;
    setNextId((id) => id + 2);

    const userMessage: ChatMessage = { id: currentUserId, role: 'user', text };
    const placeholderMessage: ChatMessage = { id: currentAssistantId, role: 'assistant', text: 'Thinking...' };

    setMessages((prev) => [...prev, userMessage, placeholderMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to get a response from the AI service.');
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === currentAssistantId
            ? { ...msg, text: data.reply || 'Sorry, I encountered an empty response.' }
            : msg
        )
      );
    } catch (error) {
      console.error('Error communicating with AI backend:', error);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === currentAssistantId
            ? {
                ...msg,
                text: 'Could not connect to the AI service. Please make sure your backend is running and the OpenAI API key is configured.',
              }
            : msg
        )
      );
    }
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col lg:h-dvh">
      <header className="animate-fade-up border-b border-neutral-200 bg-white px-6 py-5 md:px-10">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-800" aria-hidden="true">
            <Plane className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900 md:text-2xl">Trip Assistant</h1>
            <p className="text-sm text-neutral-500">Plan a trip in plain words</p>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}

          {showSuggestions && (
            <div className="animate-fade-up pl-11">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                Try asking
              </p>
              <ul className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {SUGGESTIONS.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => handleSend(suggestion)}
                      className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-left text-sm text-neutral-700 transition-all hover:-translate-y-px hover:border-emerald-600 hover:bg-emerald-50"
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-neutral-200 bg-white/95 px-6 py-4 backdrop-blur md:px-10">
        <div className="mx-auto max-w-3xl">
          <ChatComposer onSend={handleSend} />
          <p className="mt-2 text-center text-xs text-neutral-500">
            Nothing is booked or paid for automatically. You confirm every reservation yourself.
          </p>
        </div>
      </div>
    </div>
  );
}
