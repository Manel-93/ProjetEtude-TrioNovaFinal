import mongoose from 'mongoose';

const ContactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 200
    },
    message: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 5000
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'archived'],
      default: 'pending'
    },
    userId: {
      type: Number,
      default: null
    },
    metadata: {
      type: Object,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const ContactMessageModel =
  mongoose.models.ContactMessage || mongoose.model('ContactMessage', ContactMessageSchema);

