import Token from '../models/Token.js';

export class TokenRepository {
  async create(tokenData) {
    const token = new Token({
      ...tokenData,
      expiresAt: new Date(tokenData.expiresAt)
    });
    await token.save();
    return token.toObject();
  }

  async findByTokenAndType(token, type) {
    return await Token.findOne({
      token,
      type,
      expiresAt: { $gt: new Date() }
    }).lean();
  }

  async findByUserIdAndType(userId, type) {
    return await Token.findOne({
      userId,
      type,
      expiresAt: { $gt: new Date() }
    }).lean();
  }

  async deleteByToken(token) {
    await Token.deleteOne({ token });
  }

  async deleteByUserIdAndType(userId, type) {
    await Token.deleteMany({ userId, type });
  }

  async deleteAllByUserId(userId) {
    await Token.deleteMany({ userId });
  }

  async deleteExpiredTokens() {
    await Token.deleteMany({ expiresAt: { $lt: new Date() } });
  }
}

