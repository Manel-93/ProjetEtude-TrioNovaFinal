import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['user', 'bot', 'human'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    metadata: {
      type: Object,
      default: null
    },
    faqMatchedQuestion: {
      type: String,
      default: null
    },
    faqMatchedAnswer: {
      type: String,
      default: null
    },
    isEscalation: {
      type: Boolean,
      default: false
    }
  },
  {
    _id: false,
    timestamps: {
      createdAt: true,
      updatedAt: false
    }
  }
);

const ChatbotConversationSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: Number,
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: ['open', 'pending_human', 'closed'],
      default: 'open',
      index: true
    },
    isEscalated: {
      type: Boolean,
      default: false
    },
    contactProfile: {
      type: Object,
      default: null
    },
    messages: {
      type: [ChatMessageSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export const ChatbotConversationModel =
  mongoose.models.ChatbotConversation ||
  mongoose.model('ChatbotConversation', ChatbotConversationSchema);

