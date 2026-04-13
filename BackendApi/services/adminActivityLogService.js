import { AdminActivityLogRepository } from '../repositories/adminActivityLogRepository.js';

export class AdminActivityLogService {
  constructor() {
    this.logRepository = new AdminActivityLogRepository();
  }

  async log(adminId, action, entityType = null, entityId = null, details = null, req = null) {
    return await this.logRepository.create({
      adminId,
      action,
      entityType,
      entityId,
      details,
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null
    });
  }

  async getLogs(filters = {}, pagination = {}) {
    const logs = await this.logRepository.findAll(filters, pagination);
    return {
      data: logs,
      pagination: {
        page: parseInt(pagination.page || 1),
        limit: parseInt(pagination.limit || 50)
      }
    };
  }

  async getLogsByAdmin(adminId, pagination = {}) {
    const logs = await this.logRepository.findByAdminId(adminId, pagination);
    return {
      data: logs,
      pagination: {
        page: parseInt(pagination.page || 1),
        limit: parseInt(pagination.limit || 50)
      }
    };
  }
}

