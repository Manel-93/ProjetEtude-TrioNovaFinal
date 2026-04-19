import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { sendChatbotMessage } from '../services/contact';
import { sendContact } from '../services/contact';
import { getApiError } from '../utils/errors';

export default function ChatWidget() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [input, setInput] = useState('');
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isEscalated, setIsEscalated] = useState(false);
  const [supportForm, setSupportForm] = useState({ subject: '', message: '' });
  const [supportState, setSupportState] = useState({ error: '', success: '' });
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
    if (!profile.name.trim() || !profile.email.trim()) {
      setSupportState({ error: 'Merci de renseigner votre nom et votre email.', success: '' });
      return;
    }

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      setSupportState({ error: '', success: '' });
      const res = await sendChatbotMessage(text, sessionId || undefined, {
        profile,
        context: { page: 'chat_widget' }
      });
      const data = res?.data?.data || {};
      if (data.sessionId) setSessionId(data.sessionId);
      setIsEscalated(!!data.isEscalated);
      if (data.isEscalated && !supportForm.subject) {
        setSupportForm({
          subject: 'Escalade chatbot - besoin complexe',
          message: `Conversation widget (${data.sessionId || 'nouvelle session'}) : ${text}`
        });
      }
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

  const submitSupport = async (e) => {
    e.preventDefault();
    setSupportState({ error: '', success: '' });
    try {
      await sendContact({
        name: profile.name.trim(),
        email: profile.email.trim(),
        subject: supportForm.subject.trim() || 'Escalade chatbot',
        message: supportForm.message.trim(),
        source: 'chatbot_widget',
        sessionId: sessionId || undefined,
        category: 'chatbot_support',
        context: { page: 'chat_widget' }
      });
      setSupportState({ error: '', success: 'Votre demande a été envoyée au support.' });
    } catch (err) {
      setSupportState({ error: getApiError(err), success: '' });
    }
  };

  return (
    <div className="fixed bottom-6 right-4 z-[100] sm:right-6 left-auto max-w-[100vw]">
      {open ? (
        <div className="w-[min(92vw,24rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
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

          <div className="border-b border-slate-100 bg-slate-50 p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                className="input h-10"
                placeholder="Nom"
              />
              <input
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                className="input h-10"
                placeholder="Email"
                type="email"
              />
            </div>
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
                  {m.escalated ? (
                    <div className="mt-1 block text-xs opacity-80">
                      <span className="block">{t('contact.human')}</span>
                      <Link to="/outils#support-form" className="font-medium underline">
                        Ouvrir le formulaire détaillé
                      </Link>
                    </div>
                  ) : null}
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

          {isEscalated ? (
            <form onSubmit={submitSupport} className="border-t border-amber-100 bg-amber-50 p-3">
              <p className="mb-2 text-xs text-amber-900">Besoin d’un agent humain ? Transmettez votre demande.</p>
              {supportState.error ? <p className="mb-2 text-xs text-red-600">{supportState.error}</p> : null}
              {supportState.success ? <p className="mb-2 text-xs text-green-700">{supportState.success}</p> : null}
              <div className="space-y-2">
                <input
                  className="input h-10"
                  value={supportForm.subject}
                  onChange={(e) => setSupportForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="Sujet"
                />
                <textarea
                  className="input min-h-[90px]"
                  value={supportForm.message}
                  onChange={(e) => setSupportForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Décrivez votre besoin"
                />
                <button type="submit" className="btn-primary w-full">
                  Envoyer au support
                </button>
              </div>
            </form>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-ocean px-4 py-3 text-sm font-semibold text-white shadow-xl transition hover:scale-[1.03] hover:bg-ocean-hover"
          aria-label={t('contact.chatOpen')}
        >
          <MessageCircle className="h-6 w-6" />
          <span>Contact Me</span>
        </button>
      )}
    </div>
  );
}

