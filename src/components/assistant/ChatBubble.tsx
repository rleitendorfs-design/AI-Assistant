import { Sparkles } from 'lucide-react';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
}

interface ChatBubbleProps {
  message: ChatMessage;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex animate-fade-up gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800" aria-hidden="true">
          <Sparkles className="h-4 w-4" strokeWidth={1.75} />
        </div>
      )}
      <div
        className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-soft sm:max-w-[75%] ${
          isUser
            ? 'rounded-br-md bg-emerald-700 text-white'
            : 'rounded-bl-md border border-neutral-200 bg-white text-neutral-800'
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}
