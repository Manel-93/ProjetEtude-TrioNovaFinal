import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { sendChatbotMessage } from '../services/contact';
import { getApiError } from '../utils/errors';

export default function ChatWidget() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);
  const welcomedRef = useRef(false);

  useEffect(() => {
    if (open && !welcomedRef.current) {
      welcomedRef.current = true;
      setMessages([
        {
          role: 'bot',
          text: t('contact.chatWelcome')
        }
      ]);
    }
  }, [open, t]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (e) => {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatbotMessage(text, sessionId || undefined);
      const data = res?.data?.data || {};
      if (data.sessionId) setSessionId(data.sessionId);
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: data.reply || t('common.error'),
          escalated: !!data.isEscalated
        }
      ]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'bot', text: getApiError(err) }]);
    } finally {
      setLoading(false);
    }
  };

  const onInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="fixed bottom-6 right-4 z-[100] sm:right-6 left-auto max-w-[100vw]">
      {open ? (
        <div className="w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-ink px-4 py-3 text-white">
            <p className="text-sm font-semibold">{t('contact.chatbot')}</p>
            <button
              type="button"
              className="rounded-md p-1 text-white/90 transition hover:bg-white/15 hover:text-white"
              onClick={() => setOpen(false)}
              aria-label={t('contact.chatClose')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="h-80 overflow-y-auto bg-surface/30 p-3">
            <div className="space-y-2 text-sm">
              {messages.map((m, idx) => (
                <div
                  key={`${m.role}-${idx}`}
                  className={`max-w-[90%] rounded-2xl px-3 py-2 ${
                    m.role === 'user'
                      ? 'ml-auto bg-ocean text-white'
                      : 'bg-white text-slate-800 shadow-sm'
                  }`}
                >
                  {m.text}
                  {m.escalated ? <span className="mt-1 block text-xs opacity-80">{t('contact.human')}</span> : null}
                </div>
              ))}

              {loading ? (
                <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">
                  <span className="font-medium text-slate-600">L'IA écrit...</span>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ocean" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ocean [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ocean [animation-delay:240ms]" />
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>
          </div>

          <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-100 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onInputKeyDown}
              className="input h-10 flex-1"
              placeholder={t('contact.chatPlaceholder')}
            />
            <button
              type="submit"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ocean text-white transition hover:bg-ocean-hover disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading || !input.trim()}
              aria-label={t('contact.chatSend')}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-ocean text-white shadow-xl transition hover:scale-[1.03] hover:bg-ocean-hover"
          aria-label={t('contact.chatOpen')}
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}

