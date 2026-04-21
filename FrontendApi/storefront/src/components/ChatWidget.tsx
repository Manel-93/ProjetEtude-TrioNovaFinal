import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { sendChatbotMessage, sendContact } from '../services/contact';
import { getApiError } from '../utils/errors';
import { stripChatMarkdown } from '../utils/stripChatMarkdown';

type I18nLike = {
  dir?: () => string;
  resolvedLanguage?: string;
  language?: string;
};

type ChatMessage = {
  role: 'user' | 'bot';
  text: string;
  escalated?: boolean;
};

function isRtlLanguage(i18n: I18nLike) {
  try {
    if (typeof i18n.dir === 'function') return i18n.dir() === 'rtl';
  } catch {
    /* ignore */
  }
  const lng = String(i18n.resolvedLanguage || i18n.language || '').toLowerCase();
  return lng.startsWith('ar');
}

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());
}

export default function ChatWidget() {
  const { t, i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n);
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [input, setInput] = useState('');
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isEscalated, setIsEscalated] = useState(false);
  const [supportForm, setSupportForm] = useState({ subject: '', message: '' });
  const [supportState, setSupportState] = useState({ error: '', success: '' });
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const welcomedRef = useRef(false);

  const canSendMessage =
    profile.name.trim().length > 0 && isValidEmail(profile.email) && !loading;

  useEffect(() => {
    if (!open) welcomedRef.current = false;
  }, [open]);

  useEffect(() => {
    if (open && !welcomedRef.current) {
      welcomedRef.current = true;
      setMessages([{ role: 'bot', text: t('contact.chatWelcome') }]);
    }
  }, [open, t]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) {
      const t0 = window.setTimeout(() => inputRef.current?.focus(), 200);
      return () => window.clearTimeout(t0);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !panelRef.current || typeof panelRef.current.animate !== 'function') return;
    panelRef.current.animate(
      [
        { opacity: 0, transform: 'translateY(16px) scale(0.98)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' }
      ],
      { duration: 240, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
    );
  }, [open]);

  const send = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || loading || !canSendMessage) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    setSupportState({ error: '', success: '' });

    try {
      const res = await sendChatbotMessage(text, sessionId || undefined, {
        profile,
        context: { page: 'chat_widget', engine: 'mistral' }
      });
      const data = res?.data?.data || {};
      if (data.sessionId) setSessionId(data.sessionId);
      setIsEscalated(!!data.isEscalated);
      if (data.isEscalated && !supportForm.subject) {
        setSupportForm({
          subject: t('contact.widgetEscalationSubjectDefault'),
          message: `Conversation widget (session ${data.sessionId || 'nouvelle'}) :\n${text}`
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

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const submitSupport = async (e: React.FormEvent<HTMLFormElement>) => {
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
        context: { page: 'chat_widget', engine: 'mistral' }
      });
      setSupportState({ error: '', success: t('contact.widgetSupportSuccess') });
    } catch (err) {
      setSupportState({ error: getApiError(err), success: '' });
    }
  };

  const fabLabel = t('contact.floatingChatButton', { defaultValue: 'Contact Me' });
  const corner = isRtl ? 'left-2 sm:left-8' : 'right-2 sm:right-8';
  const floatingBottom = 'calc(1.25rem + env(safe-area-inset-bottom, 0px))';
  const floatingSide = isRtl ? { left: '1.25rem' } : { right: '1.25rem' };
  const floatingZIndex = 2147483647;
  const launcherColor = '#00a8b5';

  const panel = open ? (
    <>
      <button
        type="button"
        aria-label={t('contact.chatClose')}
        className="fixed inset-0 z-[2147483646] bg-slate-900/25 backdrop-blur-[2px] transition-opacity"
        style={{ zIndex: floatingZIndex - 1 }}
        onClick={() => setOpen(false)}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="althea-chat-title"
        className={`fixed z-[2147483647] flex max-h-[min(85vh,640px)] w-[min(calc(100vw-1rem),400px)] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_-8px_40px_rgba(15,23,42,0.18)] ${corner}`}
        style={{ bottom: floatingBottom, zIndex: floatingZIndex, ...floatingSide }}
      >
        <div className="relative shrink-0 bg-gradient-to-br from-[#00a8b5] via-teal-600 to-cyan-700 px-5 pb-8 pt-4 text-white">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p id="althea-chat-title" className="text-base font-semibold tracking-tight">
                {t('contact.chatbot')}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-white/90">
                <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {t('contact.widgetPoweredByMistral')}
              </p>
            </div>
            <button
              type="button"
              className="rounded-full p-1.5 text-white/90 transition hover:bg-white/15 hover:text-white"
              onClick={() => setOpen(false)}
              aria-label={t('contact.chatClose')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="-mt-5 flex min-h-0 flex-1 flex-col rounded-t-3xl bg-white">
          <div className="shrink-0 space-y-3 border-b border-slate-100 bg-white px-4 pb-4 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('contact.widgetEmailCaptureTitle')}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                className="input h-10 rounded-xl border-slate-200 bg-slate-50/50 text-sm"
                placeholder={t('contact.name')}
                autoComplete="name"
              />
              <input
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                className="input h-10 rounded-xl border-slate-200 bg-slate-50/50 text-sm"
                placeholder={t('auth.email')}
                type="email"
                autoComplete="email"
              />
            </div>
            {!canSendMessage && profile.email ? (
              <p className="text-xs text-amber-700">{t('contact.profileRequiredWidget')}</p>
            ) : null}
          </div>

          <div className="min-h-[210px] flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/80 to-white px-4 py-4">
            <p className="mb-3 rounded-xl bg-white px-3 py-2 text-[11px] leading-relaxed text-slate-500 ring-1 ring-slate-100">
              {t('contact.widgetMedicalDisclaimer')}
            </p>
            <div className="space-y-3.5 text-sm">
              {messages.map((m, idx) => (
                <div
                  key={`${m.role}-${idx}`}
                  className={`max-w-[92%] rounded-2xl px-4 py-2.5 leading-relaxed shadow-sm transition-all duration-200 ${
                    m.role === 'user'
                      ? 'ml-auto bg-ocean text-white shadow-[0_6px_20px_rgba(0,168,181,0.26)]'
                      : 'bg-white text-slate-800 ring-1 ring-slate-100'
                  }`}
                >
                  {m.role === 'bot' ? stripChatMarkdown(m.text) : m.text}
                  {m.escalated ? (
                    <span className="mt-2 block border-t border-white/20 pt-2 text-[11px] opacity-90">
                      {t('contact.human')}
                    </span>
                  ) : null}
                </div>
              ))}
              {loading ? (
                <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs text-slate-500 shadow-sm ring-1 ring-slate-100">
                  <span className="font-medium text-slate-600">{t('contact.widgetAiTyping')}</span>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ocean" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ocean [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ocean [animation-delay:240ms]" />
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>
          </div>

          <form onSubmit={send} className="shrink-0 border-t border-slate-100 bg-white px-4 pb-4 pt-3">
            <div className="flex items-end gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onInputKeyDown}
                className="input min-h-[46px] flex-1 rounded-xl border-slate-200 bg-slate-50/50 text-sm"
                placeholder={
                  canSendMessage ? t('contact.chatPlaceholder') : t('contact.profileRequiredBeforeChat')
                }
                disabled={!canSendMessage}
              />
              <button
                type="submit"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[#00a8b5] to-teal-600 text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!canSendMessage || !input.trim()}
                aria-label={t('contact.chatSend')}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>

          {isEscalated ? (
            <form
              onSubmit={submitSupport}
              className="shrink-0 space-y-2.5 border-t border-amber-100 bg-gradient-to-b from-amber-50/95 to-amber-50/60 px-4 pb-4 pt-3"
            >
              <p className="text-xs font-medium text-amber-950">{t('contact.widgetEscalationHint')}</p>
              {supportState.error ? <p className="text-xs text-red-600">{supportState.error}</p> : null}
              {supportState.success ? <p className="text-xs text-green-700">{supportState.success}</p> : null}
              <input
                className="input h-10 rounded-xl border-amber-200/80 bg-white/80 text-sm"
                value={supportForm.subject}
                onChange={(e) => setSupportForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder={t('contact.widgetSupportSubjectPlaceholder')}
              />
              <textarea
                className="input min-h-[88px] rounded-xl border-amber-200/80 bg-white/80 text-sm"
                value={supportForm.message}
                onChange={(e) => setSupportForm((f) => ({ ...f, message: e.target.value }))}
                placeholder={t('contact.widgetSupportMessagePlaceholder')}
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  to="/outils#support-form"
                  className="text-xs font-medium text-amber-900 underline underline-offset-2 hover:text-amber-950"
                >
                  {t('contact.openDetailedForm')}
                </Link>
                <button type="submit" className="btn-primary w-full shrink-0 sm:w-auto">
                  {t('contact.widgetSendToSupport')}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </>
  ) : null;

  const launcher = (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
      }}
      className={`pointer-events-auto fixed z-[2147483647] inline-flex min-h-[3.25rem] max-w-[calc(100vw-1rem)] touch-manipulation cursor-pointer items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(6,148,162,0.45)] ring-2 ring-white/90 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 sm:min-h-[3.5rem] sm:gap-3 sm:px-8 sm:text-base sm:min-w-[280px] ${corner}`}
      style={{
        bottom: floatingBottom,
        zIndex: floatingZIndex,
        backgroundColor: launcherColor,
        minWidth: 'min(260px, calc(100vw - 1rem))',
        maxWidth: 'calc(100vw - 1rem)',
        ...floatingSide
      }}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={t('contact.chatOpen')}
    >
      <MessageCircle className="h-6 w-6 shrink-0" aria-hidden />
      <span className="truncate whitespace-nowrap">{fabLabel}</span>
    </button>
  );

  const tree = (
    <>
      {!open ? launcher : null}
      {panel}
    </>
  );

  if (typeof document === 'undefined' || !document.body) return null;
  return createPortal(tree, document.body);
}
