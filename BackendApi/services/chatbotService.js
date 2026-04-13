import crypto from 'crypto';
import { Mistral } from '@mistralai/mistralai';
import { ChatbotConversationModel } from '../models/ChatbotConversation.js';
import { ProductRepository } from '../repositories/productRepository.js';

const BASE_SYSTEM_PROMPT = `Tu es l'assistant virtuel d'AltheaSystems, boutique en ligne d'équipements médicaux.
Réponds en français avec un ton professionnel, simple et utile.
Tu peux conseiller des produits en t'appuyant sur le catalogue fourni ci-dessous (prix TTC, descriptions), expliquer livraison/retour et orienter vers la page Contact en cas de besoin.
Ne donne pas de diagnostic médical personnalisé et ne fabrique pas d'informations de commande (numéro, statut d'expédition, etc.) : dans ce cas, renvoie vers la page Contact.`;

const DEFAULT_MISTRAL_MODEL = 'mistral-small-latest';

const SUPPORT_CONTACT =
  'L’assistant automatique est momentanément indisponible. Pour une aide personnalisée sur nos produits ou votre commande, ' +
  'merci d’utiliser la page **Contact** du site ou d’écrire à **altheasystems@outlook.fr**.';

const STOP_WORDS = new Set([
  'le',
  'la',
  'les',
  'un',
  'une',
  'des',
  'de',
  'du',
  'et',
  'ou',
  'en',
  'au',
  'aux',
  'pour',
  'avec',
  'sans',
  'sur',
  'est',
  'pas',
  'qui',
  'que',
  'quoi',
  'comment',
  'combien',
  'prix',
  'quel',
  'quelle',
  'quelles',
  'quels',
  'merci',
  'bonjour',
  'salut',
  'jour',
  'svp',
  'please',
  'the',
  'vous',
  'notre',
  'nos',
  'this',
  'that',
  'have',
  'what',
  'how'
]);

const OFFLINE_ANSWERS = [
  {
    test: (m) =>
      /tensio|tension\s*art|pression\s*art|brassard|sphygmo/i.test(m),
    answer:
      'Un tensiomètre électronique au bras mesure la pression artérielle avec un brassard gonflé automatiquement autour du bras. ' +
      'Il affiche en général la tension systolique, la tension diastolique et parfois la fréquence cardiaque. ' +
      'Il sert au suivi de la tension à domicile ou en cabinet, mais l’interprétation des valeurs pour une personne ' +
      'doit être faite par un professionnel de santé. Pour un achat ou une question de commande, utilisez la page Contact du site.'
  },
  {
    test: (m) => /st[hé]?é?thoscope|stethoscope|stetho|auscult/i.test(m),
    answer:
      'Un stéthoscope professionnel sert à écouter les sons du corps (cœur, poumons, vaisseaux, etc.) lors d’un examen. ' +
      'Il est surtout utilisé par les professionnels de santé ; pour un usage personnel, demandez l’avis d’un médecin. ' +
      'Pour le choix d’un modèle ou une commande, vous pouvez consulter notre catalogue ou nous écrire via la page Contact.'
  },
  {
    test: (m) => /thermom|infrarouge|temp[eé]rature/i.test(m),
    answer:
      'Un thermomètre infrarouge mesure la température à distance (souvent au front ou à l’oreille selon le modèle), sans contact prolongé. ' +
      'Il est pratique pour un dépistage rapide ; en cas de fièvre ou de doute, consultez un professionnel de santé. ' +
      'Pour une question sur nos produits, utilisez la page Contact.'
  }
];

function normalizeMistralModelName(raw) {
  let s = String(raw ?? '').trim();
  if (!s) return null;
  const prefix = /^MISTRAL_MODEL\s*=\s*/i;
  while (prefix.test(s)) {
    s = s.replace(prefix, '').trim();
  }
  return s || null;
}

function extractSearchTokens(text) {
  const n = String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  const words = n.split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
  const out = [];
  const seen = new Set();
  for (const w of words) {
    if (STOP_WORDS.has(w)) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
    if (out.length >= 8) break;
  }
  return out;
}

function truncateText(s, max) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function formatCatalogBlock(products) {
  if (!products?.length) {
    return '(Aucun produit actif dans le catalogue pour le moment.)';
  }
  return products
    .map((p) => {
      const price = Number(p.priceTtc).toFixed(2);
      const desc = truncateText(p.description, 200);
      const stock = Number(p.stock) > 0 ? 'en stock' : 'rupture / sur demande';
      return `- **${p.name}** | Prix TTC : ${price} € | Slug : ${p.slug} | ${stock}\n  Description : ${desc}`;
    })
    .join('\n');
}

function buildSystemPromptWithCatalog(products) {
  const block = formatCatalogBlock(products);
  return `${BASE_SYSTEM_PROMPT}

--- Catalogue AltheaSystems (MySQL, produits actifs affichés en boutique) ---
${block}
--- Fin catalogue ---`;
}

function buildMistralMessages({ messages, userText, systemContent }) {
  const out = [{ role: 'system', content: systemContent }];
  const withoutLast = messages.slice(0, -1);
  const slice = withoutLast.slice(-20);
  for (const m of slice) {
    if (m.sender === 'user') {
      out.push({ role: 'user', content: String(m.message) });
    } else if (m.sender === 'bot' || m.sender === 'human') {
      out.push({ role: 'assistant', content: String(m.message) });
    }
  }
  out.push({ role: 'user', content: userText });
  return out;
}

function offlineReplyForMessage(message) {
  for (const entry of OFFLINE_ANSWERS) {
    if (entry.test(message)) return entry.answer;
  }
  return null;
}

function friendlyMistralError(err) {
  const msg = String(err?.message || err || '');
  const status = err?.statusCode ?? err?.status ?? err?.code;
  const lower = msg.toLowerCase();

  if (!process.env.MISTRAL_API_KEY?.trim()) {
    return SUPPORT_CONTACT;
  }
  if (
    status === 401 ||
    status === 403 ||
    /api\s*key|unauthorized|invalid\s*key|permission\s*denied/i.test(lower)
  ) {
    return (
      'La clé API Mistral est refusée ou invalide. Vérifiez MISTRAL_API_KEY dans le fichier .env du serveur, puis redémarrez l’API. ' +
      'En attendant, vous pouvez nous contacter via la page Contact ou à altheasystems@outlook.fr.'
    );
  }
  if (status === 404 || /\[404|404\s+not\s+found|not\s*found.*model/i.test(lower)) {
    return (
      'Le modèle Mistral configuré n’est pas disponible. Définissez MISTRAL_MODEL=mistral-small-latest (ou un modèle listé sur console.mistral.ai), puis redémarrez l’API. ' +
      'Sinon, contactez-nous via la page Contact.'
    );
  }
  if (
    status === 429 ||
    /quota|rate\s*limit|too\s*many\s*requests/i.test(lower)
  ) {
    return (
      'Le service d’intelligence artificielle est temporairement saturé (quota Mistral). Réessayez plus tard ou écrivez-nous via la page Contact / altheasystems@outlook.fr.'
    );
  }
  if (/network|fetch|econnreset|etimedout|enotfound|socket/i.test(lower)) {
    return (
      'Impossible de joindre le service Mistral (réseau). Réessayez dans quelques instants ou utilisez la page Contact.'
    );
  }
  return SUPPORT_CONTACT;
}

async function generateWithMistral(messages) {
  const apiKey = process.env.MISTRAL_API_KEY?.trim();
  if (!apiKey) {
    const e = new Error('MISTRAL_API_KEY manquante');
    e.statusCode = 400;
    throw e;
  }

  const model =
    normalizeMistralModelName(process.env.MISTRAL_MODEL) || DEFAULT_MISTRAL_MODEL;
  const client = new Mistral({ apiKey });

  const response = await client.chat.complete({
    model,
    messages,
    temperature: 0.4,
    maxTokens: 1024
  });

  const content = response?.choices?.[0]?.message?.content;
  const text = typeof content === 'string' ? content : content != null ? String(content) : '';
  const trimmed = text.trim();
  if (!trimmed) {
    const e = new Error('Mistral: réponse vide');
    e.statusCode = 502;
    throw e;
  }
  return trimmed;
}

function formatLocalProductReply(products) {
  if (!products?.length) return null;
  const lines = products.map((p) => {
    const price = Number(p.priceTtc).toFixed(2);
    const desc = truncateText(p.description, 400);
    const stock = Number(p.stock) > 0 ? 'En stock' : 'Rupture de stock (pour l’instant)';
    return (
      `**${p.name}**\n` +
      `- Prix TTC : ${price} €\n` +
      `- ${stock}\n` +
      `- Description : ${desc}\n` +
      `- Fiche sur le site : /produit/${encodeURIComponent(p.slug)}`
    );
  });
  return (
    'Voici ce que nous trouvons dans notre catalogue pour votre recherche :\n\n' +
    lines.join('\n\n') +
    '\n\nPour commander ou pour une question précise, utilisez la page Contact si besoin.'
  );
}

export class ChatbotService {
  constructor() {
    this.productRepository = new ProductRepository();
  }

  async getOrCreateConversation(sessionId, userId = null) {
    if (sessionId) {
      const existing = await ChatbotConversationModel.findOne({ sessionId });
      if (existing) {
        return existing;
      }
    }

    const newSessionId = sessionId || crypto.randomUUID();
    const conversation = new ChatbotConversationModel({
      sessionId: newSessionId,
      userId: userId || null,
      status: 'open',
      isEscalated: false,
      messages: []
    });

    await conversation.save();
    return conversation;
  }

  async tryLocalProductAnswer(message) {
    const tokens = extractSearchTokens(message);
    if (!tokens.length) return null;
    const rows = await this.productRepository.searchActiveProductsForChatbotTokens(tokens, 8);
    return formatLocalProductReply(rows);
  }

  useMistralApi() {
    const mode = String(process.env.CHATBOT_MODE || '').toLowerCase().trim();
    if (mode === 'local') return false;
    return Boolean(process.env.MISTRAL_API_KEY?.trim());
  }

  async handleMessage({ sessionId, message, userId = null, metadata = {} }) {
    const conversation = await this.getOrCreateConversation(sessionId, userId);

    conversation.messages.push({
      sender: 'user',
      message,
      metadata
    });

    const localReply = await this.tryLocalProductAnswer(message);
    const faqReply = offlineReplyForMessage(message);
    const useMistral = this.useMistralApi();

    let botReply;
    let mistralFailed = false;

    try {
      if (!useMistral) {
        botReply = localReply || faqReply || SUPPORT_CONTACT;
      } else {
        const catalogResult = await this.productRepository.findAll(
          { status: 'active' },
          { page: 1, limit: 80 },
          { excludeStorefrontHidden: true }
        );
        const systemContent = buildSystemPromptWithCatalog(catalogResult.data);
        const mistralMessages = buildMistralMessages({
          messages: conversation.messages,
          userText: message,
          systemContent
        });
        botReply = await generateWithMistral(mistralMessages);
      }
    } catch (err) {
      mistralFailed = useMistral;
      console.error('[chatbot] Mistral error', err?.statusCode ?? err?.code, err?.message);
      botReply = localReply || faqReply || friendlyMistralError(err);
    }

    const isEscalation =
      botReply === SUPPORT_CONTACT ||
      (mistralFailed && !localReply && !faqReply);

    if (isEscalation) {
      conversation.isEscalated = true;
      conversation.status = 'pending_human';
    }

    conversation.messages.push({
      sender: 'bot',
      message: botReply,
      metadata,
      faqMatchedQuestion: null,
      faqMatchedAnswer: null,
      isEscalation
    });

    await conversation.save();

    return {
      sessionId: conversation.sessionId,
      reply: botReply,
      isEscalated: isEscalation,
      matchedFaq: null
    };
  }
}
