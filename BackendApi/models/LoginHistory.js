import mongoose from 'mongoose';

const loginHistorySchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
    index: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  loginAt: {
    type: Date,
    default: Date.now
  },
  success: {
    type: Boolean,
    default: true
  },
  failureReason: {
    type: String
  }
}, {
  timestamps: false
});

// Index composé pour les requêtes fréquentes
loginHistorySchema.index({ userId: 1, loginAt: -1 });
loginHistorySchema.index({ loginAt: -1 });

// TTL index pour supprimer les logs après 90 jours
loginHistorySchema.index({ loginAt: 1 }, { expireAfterSeconds: 7776000 });

const LoginHistory = mongoose.model('LoginHistory', loginHistorySchema);

export default LoginHistory;

