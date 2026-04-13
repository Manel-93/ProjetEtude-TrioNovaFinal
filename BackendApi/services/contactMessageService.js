import { ContactMessageRepository } from '../repositories/contactMessageRepository.js';
import { ContactMessageModel } from '../models/ContactMessage.js';

export class ContactMessageService {
  constructor() {
    this.contactMessageRepository = new ContactMessageRepository();
  }

  async create(messageData) {
    const mysqlMessage = await this.contactMessageRepository.create(messageData);

    try {
      await ContactMessageModel.create({
        name: mysqlMessage.name,
        email: mysqlMessage.email,
        subject: mysqlMessage.subject,
        message: mysqlMessage.message,
        status: mysqlMessage.status,
        userId: mysqlMessage.userId,
        metadata: mysqlMessage.metadata || {
          source: 'contact_form'
        }
      });
    } catch (error) {
      // On log l'erreur mais on ne bloque pas la création MySQL
      console.error('MongoDB ContactMessage create error:', error.message);
    }

    return mysqlMessage;
  }

  async getById(id) {
    const message = await this.contactMessageRepository.findById(id);
    if (!message) {
      throw new Error('Message introuvable');
    }
    return message;
  }

  async getAll(filters = {}, pagination = {}) {
    const messages = await this.contactMessageRepository.findAll(filters, pagination);
    return {
      data: messages,
      pagination: {
        page: parseInt(pagination.page || 1),
        limit: parseInt(pagination.limit || 50)
      }
    };
  }

  async updateStatus(id, status, assignedTo = null) {
    return await this.contactMessageRepository.updateStatus(id, status, assignedTo);
  }

  async getStats() {
    const counts = await this.contactMessageRepository.countByStatus();
    return {
      pending: counts.pending || 0,
      inProgress: counts.in_progress || 0,
      resolved: counts.resolved || 0,
      archived: counts.archived || 0,
      total: Object.values(counts).reduce((sum, count) => sum + parseInt(count), 0)
    };
  }
}

