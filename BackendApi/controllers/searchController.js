import { ElasticsearchService } from '../services/elasticsearchService.js';

export class SearchController {
  constructor() {
    this.elasticsearchService = new ElasticsearchService();
  }

  search = async (req, res, next) => {
    try {
      const {
        q = '',
        minPrice,
        maxPrice,
        categoryId,
        inStock,
        sortBy = 'priority',
        page = 1,
        limit = 20
      } = req.query;

      const result = await this.elasticsearchService.search({
        q,
        minPrice,
        maxPrice,
        categoryId,
        inStock,
        sortBy,
        page: parseInt(page),
        limit: parseInt(limit),
        excludeStorefrontHidden: true
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        meta: result.meta
      });
    } catch (error) {
      next(error);
    }
  };
}

