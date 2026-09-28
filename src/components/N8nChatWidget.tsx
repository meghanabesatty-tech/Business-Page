import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, RotateCcw, Send, X } from 'lucide-react';

const N8N_DIRECT_WEBHOOK_URL =
  'https://megu2006.app.n8n.cloud/webhook/129e795d-0ca2-469b-91c8-2c9e0194c556/chat';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome_1',
  sender: 'bot',
  text: 'Welcome to MD ART STUDIO ❤️ I can help you with custom T-Shirt Paintings (₹259+), Handkerchief Paintings (₹99+), Embroidery (₹120+), Canvas Art (₹69+), Texture Art, or Customized UNO Cards (₹300 / 30 cards). What would you like to create today?',
  timestamp: 'Just now',
};

const QUICK_PROMPTS = [
  'Tell me about Customized UNO Cards (₹300)',
  'How do I customize a T-Shirt Painting?',
  'Shipping time & pan-India delivery?',
];

function getOrCreateSessionId(): string {
  try {
    const key = 'md_art_n8n_session_id';
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const created = `mdart_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(key, created);
    return created;
  } catch {
    return `mdart_${Date.now()}`;
  }
}

export const N8nChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => getOrCreateSessionId());
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const resetChat = () => {
    const freshId = `mdart_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    try {
      sessionStorage.setItem('md_art_n8n_session_id', freshId);
    } catch {
      // ignore storage errors
    }
    setSessionId(freshId);
    setMessages([INITIAL_WELCOME_MESSAGE]);
  };

  const sendMessage = async (rawMessage: string) => {
    const cleanText = rawMessage.trim();
    if (!cleanText || isSending) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      // Primary path: Server-side proxy (/api/n8n-chat) avoids CORS issues and parses streaming/JSON
      const res = await fetch('/api/n8n-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatInput: cleanText,
          sessionId,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { reply?: string };
        setMessages((prev) => [
          ...prev,
          {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            text:
              data.reply ||
              'Thank you for reaching out to MD ART STUDIO! Please let us know if you have any other questions.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setIsSending(false);
        return;
      }

      // Fallback direct call to n8n webhook if proxy returns an error
      const directRes = await fetch(`${N8N_DIRECT_WEBHOOK_URL}?action=sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendMessage',
          sessionId,
          chatInput: cleanText,
        }),
      });

      const directText = await directRes.text();
      let parsedReply = directText;
      try {
        const json = JSON.parse(directText);
        parsedReply =
          json.output ||
          json.text ||
          json.response ||
          json.message ||
          (Array.isArray(json) && (json[0]?.output || json[0]?.text)) ||
          directText;
      } catch {
        // Handle NDJSON stream fallback
        const lines = directText.split('\n');
        let streamText = '';
        for (const line of lines) {
          try {
            const item = JSON.parse(line);
            if (item.type === 'item' && typeof item.content === 'string') {
              streamText += item.content;
            }
          } catch {
            // ignore
          }
        }
        if (streamText) parsedReply = streamText;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text:
            parsedReply.trim() ||
            'We received your message at MD ART STUDIO! Feel free to ask about our custom handmade products.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          sender: 'bot',
          text: 'Our studio chat assistant is momentarily unreachable. Make sure your n8n workflow is active, or message us directly on Instagram @md_art_studio0608.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40">
      {/* Chat Window Panel */}
      {isOpen && (
        <div className="mb-3 w-[calc(100vw-2rem)] sm:w-96 bg-[#FAF7F2] rounded-3xl border border-[#1C2822]/15 shadow-xl overflow-hidden flex flex-col max-h-[72vh] sm:max-h-[540px]">
          {/* Chat Header */}
          <div className="bg-[#1E3F2F] text-[#FAF7F2] px-5 py-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-lg font-semibold leading-tight">
                MD ART STUDIO Assistant
              </h3>
              <p className="text-[11px] text-[#E5D5B5]">
                Handmade &amp; Custom Art Help · @md_art_studio0608
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={resetChat}
                title="Reset conversation"
                aria-label="Reset conversation"
                className="p-2 rounded-lg text-[#FAF7F2]/75 hover:text-[#FAF7F2] hover:bg-[#FAF7F2]/10 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="p-2 rounded-lg text-[#FAF7F2]/75 hover:text-[#FAF7F2] hover:bg-[#FAF7F2]/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF7F2]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-[#1E3F2F] text-[#FAF7F2] rounded-br-sm'
                      : 'bg-[#F4EFE6] text-[#1C2822] border border-[#1C2822]/10 rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-[#1C2822]/45 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isSending && (
              <div className="flex items-start">
                <div className="bg-[#F4EFE6] text-[#1C2822]/70 border border-[#1C2822]/10 rounded-2xl rounded-bl-sm px-4 py-2.5 text-xs">
                  Typing response...
                </div>
              </div>
            )}

            {/* Starter Quick Prompts when only the welcome message is present */}
            {messages.length === 1 && !isSending && (
              <div className="pt-2 space-y-1.5">
                <p className="text-[11px] text-[#1C2822]/55 px-1">Quick questions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className="text-left text-[11px] px-3 py-1.5 rounded-xl bg-[#EAE3D5] text-[#1E3F2F] hover:bg-[#DED4C1] transition-colors cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Form */}
          <form
            onSubmit={handleFormSubmit}
            className="p-3 bg-[#F4EFE6] border-t border-[#1C2822]/10 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about custom art, UNO cards, prices..."
              maxLength={1000}
              disabled={isSending}
              className="flex-1 px-3.5 py-2.5 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl text-[#1C2822] focus:outline-none focus:border-[#1E3F2F]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              aria-label="Send message"
              className="p-2.5 rounded-xl bg-[#1E3F2F] text-[#FAF7F2] hover:bg-[#163023] disabled:opacity-40 transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? 'Close studio chat' : 'Open studio chat'}
          className="px-4 py-3 rounded-full bg-[#1E3F2F] text-[#FAF7F2] hover:bg-[#163023] shadow-lg border border-[#FAF7F2]/15 flex items-center gap-2 text-xs font-semibold transition-transform duration-150 hover:-translate-y-0.5 cursor-pointer"
        >
          {isOpen ? (
            <>
              <X className="w-4 h-4" />
              <span>Close Chat</span>
            </>
          ) : (
            <>
              <MessageCircle className="w-4 h-4" />
              <span>Chat with Studio</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
