import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { sendContact, sendChatbotMessage } from '../services/contact';
import { getApiError } from '../utils/errors';
import { stripChatMarkdown } from '../utils/stripChatMarkdown';

function validateForm(values, t) {
  const errors = {};
  if (!values.name.trim() || values.name.trim().length < 2) errors.name = t('contact.formErrorName');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = t('contact.formErrorEmail');
  if (!values.subject.trim() || values.subject.trim().length < 3) errors.subject = t('contact.formErrorSubject');
  if (!values.message.trim() || values.message.trim().length < 10) errors.message = t('contact.formErrorMessage');
  return errors;
}

export default function ContactPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [formErrors, setFormErrors] = useState({});
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const [chatProfile, setChatProfile] = useState({ name: '', email: '' });
  const [chatSession, setChatSession] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatLines, setChatLines] = useState([{ role: 'bot', text: t('contact.chatWelcome') }]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatEscalated, setChatEscalated] = useState(false);
  const [supportForm, setSupportForm] = useState({ subject: '', message: '' });
  const [supportMsg, setSupportMsg] = useState('');
  const [supportErr, setSupportErr] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLines, chatLoading, chatEscalated]);

  const submitContact = async (e) => {
    e.preventDefault();
    const errors = validateForm(form, t);
    setFormErrors(errors);
    setErr('');
    setMsg('');
    if (Object.keys(errors).length) return;
    setLoading(true);
    try {
      await sendContact({
        ...form,
        source: 'tools_page_form',
        category: 'contact_form',
        context: { page: 'outils' }
      });
      setMsg(t('contact.formSuccessMessage'));
      setForm({ name: '', email: '', subject: '', message: '' });
      setFormErrors({});
    } catch (e2) {
      setErr(getApiError(e2));
    } finally {
      setLoading(false);
    }
  };

  const sendChat = async (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    if (!chatProfile.name.trim() || !chatProfile.email.trim()) {
      setSupportErr(t('contact.profileRequiredBeforeChat'));
      return;
    }

    setSupportErr('');
    setChatLines((c) => [...c, { role: 'user', text }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await sendChatbotMessage(text, chatSession || undefined, {
        profile: chatProfile,
        context: { page: 'outils' }
      });
      const d = res.data.data;
      if (d.sessionId) setChatSession(d.sessionId);
      setChatEscalated(Boolean(d.isEscalated));
      if (d.isEscalated && !supportForm.subject) {
        setSupportForm({
          subject: t('contact.widgetEscalationSubjectDefault'),
          message: `Conversation chatbot (${d.sessionId || 'nouvelle session'}) : ${text}`
        });
      }
      setChatLines((c) => [...c, { role: 'bot', text: d.reply || '', escalated: d.isEscalated }]);
    } catch (e2) {
      setChatLines((c) => [...c, { role: 'bot', text: getApiError(e2) }]);
    } finally {
      setChatLoading(false);
    }
  };

  const submitEscalation = async (e) => {
    e.preventDefault();
    setSupportErr('');
    setSupportMsg('');
    try {
      await sendContact({
        name: chatProfile.name.trim(),
        email: chatProfile.email.trim(),
        subject: supportForm.subject.trim() || 'Escalade chatbot',
        message: supportForm.message.trim(),
        source: 'chatbot_escalation',
        sessionId: chatSession || undefined,
        category: 'chatbot_support',
        context: { page: 'outils' }
      });
      setSupportMsg(t('contact.escalationSuccessMessage'));
    } catch (e2) {
      setSupportErr(getApiError(e2));
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-ocean">{t('contact.toolsBadge')}</p>
        <h1 className="text-3xl font-bold text-slate-900">{t('contact.toolsTitle')}</h1>
        <p className="max-w-3xl text-slate-600">{t('contact.toolsIntro')}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr),minmax(0,0.95fr)]">
        <section id="support-form" className="card space-y-5 p-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{t('contact.fullFormTitle')}</h2>
          </div>

          <form onSubmit={submitContact} className="space-y-4" noValidate>
            {err ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p> : null}
            {msg ? <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{msg}</p> : null}
            <div>
              <label className="text-sm font-medium">{t('contact.name')}</label>
              <input
                className={`input mt-1 ${formErrors.name ? 'border-red-300' : ''}`}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              {formErrors.name ? <p className="mt-1 text-xs text-red-600">{formErrors.name}</p> : null}
            </div>
            <div>
              <label className="text-sm font-medium">{t('auth.email')}</label>
              <input
                type="email"
                className={`input mt-1 ${formErrors.email ? 'border-red-300' : ''}`}
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              {formErrors.email ? <p className="mt-1 text-xs text-red-600">{formErrors.email}</p> : null}
            </div>
            <div>
              <label className="text-sm font-medium">{t('contact.subject')}</label>
              <input
                className={`input mt-1 ${formErrors.subject ? 'border-red-300' : ''}`}
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              />
              {formErrors.subject ? <p className="mt-1 text-xs text-red-600">{formErrors.subject}</p> : null}
            </div>
            <div>
              <label className="text-sm font-medium">{t('contact.message')}</label>
              <textarea
                className={`input mt-1 min-h-[140px] ${formErrors.message ? 'border-red-300' : ''}`}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              />
              {formErrors.message ? <p className="mt-1 text-xs text-red-600">{formErrors.message}</p> : null}
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? t('contact.formSending') : t('contact.send')}
            </button>
          </form>
        </section>

        <section className="card flex h-[760px] flex-col p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">{t('contact.chatSectionTitle')}</h2>
            <p className="mt-1 text-sm text-slate-500">{t('contact.chatSectionSubtitle')}</p>
          </div>

          <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">{t('contact.name')}</span>
              <input
                className="input"
                value={chatProfile.name}
                onChange={(e) => setChatProfile((p) => ({ ...p, name: e.target.value }))}
                placeholder={t('contact.yourNamePlaceholder')}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">{t('auth.email')}</span>
              <input
                type="email"
                className="input"
                value={chatProfile.email}
                onChange={(e) => setChatProfile((p) => ({ ...p, email: e.target.value }))}
                placeholder={t('contact.yourEmailPlaceholder')}
              />
            </label>
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-2xl bg-slate-50 p-4 text-sm">
            <div className="space-y-3">
              {chatLines.map((line, i) => (
                <div
                  key={`${line.role}-${i}`}
                  className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                    line.role === 'user' ? 'ml-auto bg-ocean text-white' : 'bg-white text-slate-800 shadow-sm'
                  }`}
                >
                  <p>{line.role === 'bot' ? stripChatMarkdown(line.text) : line.text}</p>
                  {line.escalated ? (
                    <div className="mt-2 text-xs">
                      <p>{t('contact.human')}</p>
                      <Link to="/outils#support-form" className="mt-1 inline-block font-medium underline">
                        {t('contact.openDetailedForm')}
                      </Link>
                    </div>
                  ) : null}
                </div>
              ))}
              {chatLoading ? <p className="text-xs text-slate-500">{t('contact.chatTyping')}</p> : null}
              <div ref={bottomRef} />
            </div>
          </div>

          <form onSubmit={sendChat} className="mt-4 flex gap-2">
            <input
              className="input flex-1"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={t('contact.chatPlaceholder')}
            />
            <button type="submit" className="btn-primary shrink-0" disabled={chatLoading}>
              {t('contact.send')}
            </button>
          </form>

          {chatEscalated ? (
            <form onSubmit={submitEscalation} className="mt-4 space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div>
                <h3 className="font-semibold text-amber-900">{t('contact.escalationTitle')}</h3>
                <p className="mt-1 text-sm text-amber-800">{t('contact.escalationDescription')}</p>
              </div>
              {supportErr ? <p className="text-sm text-red-600">{supportErr}</p> : null}
              {supportMsg ? <p className="text-sm text-green-700">{supportMsg}</p> : null}
              <input
                className="input"
                value={supportForm.subject}
                onChange={(e) => setSupportForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder={t('contact.supportSubjectPlaceholder')}
              />
              <textarea
                className="input min-h-[110px]"
                value={supportForm.message}
                onChange={(e) => setSupportForm((f) => ({ ...f, message: e.target.value }))}
                placeholder={t('contact.supportMessagePlaceholder')}
              />
              <button type="submit" className="btn-primary">
                {t('contact.submitToSupport')}
              </button>
            </form>
          ) : null}
        </section>
      </div>
    </div>
  );
}
