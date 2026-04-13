import LoginHistory from '../models/LoginHistory.js';

export class LoginHistoryRepository {
  async create(loginData) {
    const loginHistory = new LoginHistory(loginData);
    await loginHistory.save();
    return loginHistory.toObject();
  }

  async findByUserId(userId, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      LoginHistory.find({ userId })
        .sort({ loginAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      LoginHistory.countDocuments({ userId })
    ]);
    
    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findAll(pagination = {}) {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      LoginHistory.find()
        .sort({ loginAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      LoginHistory.countDocuments()
    ]);
    
    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

