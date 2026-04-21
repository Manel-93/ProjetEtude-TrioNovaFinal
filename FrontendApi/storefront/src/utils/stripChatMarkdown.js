/** Retire **gras** / *emphase* du texte renvoyé par le chatbot (réponses historiques ou hors API). */
export function stripChatMarkdown(text) {
  let s = String(text || '');
  while (/\*\*[^*]+\*\*/.test(s)) {
    s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
  }
  s = s.replace(/\*([^*\n]+)\*/g, '$1');
  s = s.replace(/\*{1,2}/g, '');
  return s.trim();
}
