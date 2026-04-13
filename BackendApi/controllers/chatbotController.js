import { ChatbotService } from '../services/chatbotService.js';

export class ChatbotController {
  constructor() {
    this.chatbotService = new ChatbotService();
  }

  // Envoyer un message au chatbot
  sendMessage = async (req, res, next) => {
    try {
      const { sessionId, message } = req.body;

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
}

