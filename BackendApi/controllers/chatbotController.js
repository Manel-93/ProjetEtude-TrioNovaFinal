import { ChatbotService } from '../services/chatbotService.js';

export class ChatbotController {
  constructor() {
    this.chatbotService = new ChatbotService();
  }

  // Envoyer un message au chatbot
  sendMessage = async (req, res, next) => {
    try {
      const { sessionId, message, profile, context } = req.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            type: 'ValidationError',
            message: 'Le champ "message" est requis'
          }
        });
      }

      const result = await this.chatbotService.handleMessage({
        sessionId,
        message: message.trim(),
        userId: req.user?.userId || null,
        metadata: {
          profile: profile || null,
          context: context || null,
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        }
      });

      res.status(200).json({
        success: true,
        data: {
          sessionId: result.sessionId,
          reply: result.reply,
          isEscalated: result.isEscalated,
          matchedFaq: result.matchedFaq
        }
      });
    } catch (error) {
      next(error);
    }
  };

  getConversations = async (req, res, next) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await this.chatbotService.getConversations(
        { status },
        { page, limit }
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /** Détail MongoDB pour suivi back-office (fil de discussion complet). */
  getConversationBySessionId = async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const doc = await this.chatbotService.getConversationBySessionId(sessionId);
      res.status(200).json({
        success: true,
        data: doc
      });
    } catch (error) {
      next(error);
    }
  };
}

