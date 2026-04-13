import { ElasticsearchService } from '../services/elasticsearchService.js';

export class AdminSearchController {
  constructor() {
    this.elasticsearchService = new ElasticsearchService();
  }

  reindexAll = async (req, res, next) => {
    try {
      const result = await this.elasticsearchService.reindexAllProducts();
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };
}

