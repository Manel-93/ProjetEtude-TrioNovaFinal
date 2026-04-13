import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { sendContact, sendChatbotMessage } from '../services/contact';
import { getApiError } from '../utils/errors';

export default function ContactPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const [chatSession, setChatSession] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatLines, setChatLines] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLines]);

  const submitContact = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    setLoading(true);
    try {
      await sendContact(form);
      setMsg('Message envoyé.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (e2) {
      setErr(getApiError(e2));
    } finally {
      setLoading(false);
    }
  };

  const sendChat = async (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    setChatLines((c) => [...c, { role: 'user', text }]);
    setChatInput('');
    try {
      const res = await sendChatbotMessage(text, chatSession || undefined);
      const d = res.data.data;
      if (d.sessionId) setChatSession(d.sessionId);
      setChatLines((c) => [...c, { role: 'bot', text: d.reply, escalated: d.isEscalated }]);
    } catch (e2) {
      setChatLines((c) => [...c, { role: 'bot', text: getApiError(e2) }]);
    }
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('contact.title')}</h1>
        <form onSubmit={submitContact} className="card mt-4 space-y-4 p-6">
          {err ? <p className="text-sm text-red-600">{err}</p> : null}
          {msg ? <p className="text-sm text-green-700">{msg}</p> : null}
          <div>
            <label className="text-sm font-medium">{t('contact.name')}</label>
            <input
              className="input mt-1"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              minLength={2}
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t('auth.email')}</label>
            <input
              type="email"
              className="input mt-1"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t('contact.subject')}</label>
            <input className="input mt-1" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium">{t('contact.message')}</label>
            <textarea
              className="input mt-1 min-h-[120px]"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              required
              minLength={10}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {t('contact.send')}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900">{t('contact.chatbot')}</h2>
        <div className="card mt-4 flex h-[420px] flex-col p-4">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-lg bg-slate-50 p-3 text-sm">
            {chatLines.length === 0 ? (
              <p className="text-slate-500">{t('contact.chatPlaceholder')}</p>
            ) : null}
            {chatLines.map((line, i) => (
              <div
                key={i}
                className={`max-w-[90%] rounded-xl px-3 py-2 ${
                  line.role === 'user' ? 'ml-auto bg-ocean text-white' : 'bg-white text-slate-800 shadow-sm'
                }`}
              >
                {line.text}
                {line.escalated ? (
                  <span className="mt-1 block text-xs opacity-80">{t('contact.human')}</span>
                ) : null}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={sendChat} className="mt-3 flex gap-2">
            <input
              className="input flex-1"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={t('contact.chatPlaceholder')}
            />
            <button type="submit" className="btn-primary shrink-0">
              OK
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
