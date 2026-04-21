import { getElasticsearchClient, initializeElasticsearchIndex } from '../config/elasticsearch.js';
import { ProductRepository } from '../repositories/productRepository.js';
import { ProductImageRepository } from '../repositories/productImageRepository.js';
import { CategoryRepository } from '../repositories/categoryRepository.js';

const INDEX_NAME = process.env.ELASTICSEARCH_INDEX || 'products';

export class ElasticsearchService {
  constructor() {
    this.client = getElasticsearchClient();
    this.productRepository = new ProductRepository();
    this.productImageRepository = new ProductImageRepository();
    this.categoryRepository = new CategoryRepository();
  }

  // Indexer un produit
  async indexProduct(productId) {
    try {
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new Error('Produit introuvable');
      }

      const images = await this.productImageRepository.findByProductId(productId);
      const category = product.categoryId 
        ? await this.categoryRepository.findById(product.categoryId)
        : null;

      // Préparer les données pour Elasticsearch
      const document = {
        id: product.id,
        name: product.name,
        description: product.description,
        technicalSpecs: typeof product.technicalSpecs === 'object' 
          ? JSON.stringify(product.technicalSpecs) 
          : product.technicalSpecs || '',
        priceHt: product.priceHt,
        priceTtc: product.priceTtc,
        tva: product.tva,
        stock: product.stock,
        priority: product.priority,
        status: product.status,
        slug: product.slug,
        categoryId: product.categoryId || null,
        categoryName: category?.name || null,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        images: images.map(img => ({
          url: img.url,
          alt: img.alt || '',
          isPrimary: img.isPrimary || false,
          order: img.order || 0
        }))
      };
      await this.client.index({
        index: INDEX_NAME,
        id: product.id.toString(),
        document: document
      });

     
      await this.client.indices.refresh({ index: INDEX_NAME });

      return true;
    } catch (error) {
      console.error(`❌ Error indexing product ${productId}:`, error.message);
      throw error;
    }
  }

  // Supprimer un produit de l'index
  async deleteProduct(productId) {
    try {
      await this.client.delete({
        index: INDEX_NAME,
        id: productId.toString()
      });
      return true;
    } catch (error) {
      // Si le document n'existe pas, ce n'est pas une erreur critique
      if (error.statusCode === 404) {
        return true;
      }
      console.error(`❌ Error deleting product ${productId} from index:`, error.message);
      throw error;
    }
  }

  // Recherche avancée
  async search(queryParams) {
    const {
      q = '', 
      minPrice,
      maxPrice,
      categoryId,
      inStock,
      sortBy = 'priority', 
      page = 1,
      limit = 20,
      excludeStorefrontHidden = true
    } = queryParams;

    const from = (page - 1) * limit;

    // Construire la requête bool
    const must = [];
    const filter = [];

    if (q && q.trim()) {
      must.push({
        multi_match: {
          query: q,
          fields: ['name^3', 'description^2', 'technicalSpecs'],
          type: 'best_fields',
          fuzziness: 'AUTO',
          operator: 'or'
        }
      });
    }

    // Filtres
    filter.push({ term: { status: 'active' } });

    if (minPrice !== undefined || maxPrice !== undefined) {
      const range = {};
      if (minPrice !== undefined) range.gte = parseFloat(minPrice);
      if (maxPrice !== undefined) range.lte = parseFloat(maxPrice);
      filter.push({ range: { priceTtc: range } });
    }

    if (categoryId) {
      filter.push({ term: { categoryId: parseInt(categoryId) } });
    }

    if (inStock !== undefined) {
      if (inStock === 'true' || inStock === true) {
        filter.push({ range: { stock: { gt: 0 } } });
      } else {
        filter.push({ term: { stock: 0 } });
      }
    }

    if (excludeStorefrontHidden) {
      filter.push({
        bool: {
          must_not: [
            {
              bool: {
                should: [
                  { wildcard: { 'name.keyword': { value: '*chaise*roulante*', case_insensitive: true } } },
                  { wildcard: { 'name.keyword': { value: '*chaise-roulante*', case_insensitive: true } } },
                  { wildcard: { 'name.keyword': { value: '*déambulateur*', case_insensitive: true } } },
                  { wildcard: { 'name.keyword': { value: '*deambulateur*', case_insensitive: true } } },
                  { wildcard: { 'name.keyword': { value: '*seringue*', case_insensitive: true } } },
                  {
                    bool: {
                      must: [
                        { wildcard: { 'name.keyword': { value: '*gants*', case_insensitive: true } } },
                        { wildcard: { 'name.keyword': { value: '*nitrile*', case_insensitive: true } } },
                        {
                          bool: {
                            should: [
                              {
                                bool: {
                                  must: [
                                    { wildcard: { 'name.keyword': { value: '*non*', case_insensitive: true } } },
                                    { wildcard: { 'name.keyword': { value: '*poudre*', case_insensitive: true } } }
                                  ]
                                }
                              },
                              {
                                bool: {
                                  must: [
                                    { wildcard: { 'name.keyword': { value: '*sans*', case_insensitive: true } } },
                                    { wildcard: { 'name.keyword': { value: '*poudre*', case_insensitive: true } } }
                                  ]
                                }
                              }
                            ],
                            minimum_should_match: 1
                          }
                        }
                      ]
                    }
                  },
                  {
                    bool: {
                      must: [
                        {
                          bool: {
                            should: [
                              { wildcard: { 'name.keyword': { value: '*gueridon*', case_insensitive: true } } },
                              { wildcard: { 'name.keyword': { value: '*guerido*', case_insensitive: true } } }
                            ],
                            minimum_should_match: 1
                          }
                        },
                        { wildcard: { 'name.keyword': { value: '*inox*', case_insensitive: true } } }
                      ]
                    }
                  },
                  {
                    bool: {
                      must: [
                        { wildcard: { 'name.keyword': { value: '*table*', case_insensitive: true } } },
                        { wildcard: { 'name.keyword': { value: '*examen*', case_insensitive: true } } },
                        {
                          bool: {
                            should: [
                              { wildcard: { 'name.keyword': { value: '*electrique*', case_insensitive: true } } },
                              { wildcard: { 'name.keyword': { value: '*électrique*', case_insensitive: true } } },
                              { wildcard: { 'name.keyword': { value: '*electronique*', case_insensitive: true } } },
                              { wildcard: { 'name.keyword': { value: '*électronique*', case_insensitive: true } } }
                            ],
                            minimum_should_match: 1
                          }
                        }
                      ]
                    }
                  },
                  {
                    bool: {
                      must: [
                        {
                          bool: {
                            should: [
                              { wildcard: { 'name.keyword': { value: '*tensiometre*', case_insensitive: true } } },
                              { wildcard: { 'name.keyword': { value: '*tensiomètre*', case_insensitive: true } } }
                            ],
                            minimum_should_match: 1
                          }
                        },
                        {
                          bool: {
                            should: [
                              { wildcard: { 'name.keyword': { value: '*bras*', case_insensitive: true } } },
                              { wildcard: { 'name.keyword': { value: '*brassard*', case_insensitive: true } } }
                            ],
                            minimum_should_match: 1
                          }
                        },
                        {
                          bool: {
                            should: [
                              { wildcard: { 'name.keyword': { value: '*electrique*', case_insensitive: true } } },
                              { wildcard: { 'name.keyword': { value: '*électrique*', case_insensitive: true } } },
                              { wildcard: { 'name.keyword': { value: '*electronique*', case_insensitive: true } } },
                              { wildcard: { 'name.keyword': { value: '*électronique*', case_insensitive: true } } }
                            ],
                            minimum_should_match: 1
                          }
                        }
                      ]
                    }
                  },
                  {
                    bool: {
                      must: [
                        { wildcard: { 'name.keyword': { value: '*capteur*', case_insensitive: true } } },
                        { wildcard: { 'name.keyword': { value: '*plan*', case_insensitive: true } } },
                        {
                          bool: {
                            should: [
                              { wildcard: { 'name.keyword': { value: '*radiolog*', case_insensitive: true } } },
                              { wildcard: { 'name.keyword': { value: '*radiologie*', case_insensitive: true } } }
                            ],
                            minimum_should_match: 1
                          }
                        }
                      ]
                    }
                  },
                  {
                    bool: {
                      must: [
                        { wildcard: { 'name.keyword': { value: '*autoclave*', case_insensitive: true } } },
                        { wildcard: { 'name.keyword': { value: '*classe*', case_insensitive: true } } },
                        { wildcard: { 'name.keyword': { value: '*classe*b*', case_insensitive: true } } }
                      ]
                    }
                  }
                ],
                minimum_should_match: 1
              }
            }
          ]
        }
      });
    }

    // Tri
    let sort = [];
    switch (sortBy) {
      case 'price_asc':
        sort = [{ priceTtc: { order: 'asc' } }, { priority: { order: 'desc' } }];
        break;
      case 'price_desc':
        sort = [{ priceTtc: { order: 'desc' } }, { priority: { order: 'desc' } }];
        break;
      case 'newest':
        sort = [{ createdAt: { order: 'desc' } }, { priority: { order: 'desc' } }];
        break;
      case 'stock':
        // Produits en stock en premier, puis triés par priorité
        sort = [
          { 
            _script: {
              type: 'number',
              script: {
                source: "doc['stock'].value > 0 ? 0 : 1"
              },
              order: 'asc'
            }
          },
          { priority: { order: 'desc' } },
          { priceTtc: { order: 'asc' } }
        ];
        break;
      case 'priority':
      default:
        sort = [
          { priority: { order: 'desc' } },
          {
            _script: {
              type: 'number',
              script: {
                source: "doc['stock'].value > 0 ? 0 : 1"
              },
              order: 'asc'
            }
          },
          { priceTtc: { order: 'asc' } }
        ];
        break;
    }

    try {
      const searchBody = {
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }],
            filter
          }
        },
        sort,
        from,
        size: parseInt(limit),
        _source: [
          'id', 'name', 'description', 'technicalSpecs', 'priceHt', 
          'priceTtc', 'tva', 'stock', 'priority', 'status', 'slug', 
          'categoryId', 'categoryName', 'createdAt', 'updatedAt', 'images'
        ]
      };

      const startTime = Date.now();
      
      const response = await this.client.search({
        index: INDEX_NAME,
        body: searchBody
      });
      const duration = Date.now() - startTime;

      
      const hits = response.hits || {};
      const hitList = hits.hits || [];
      const totalObj = hits.total || {};
      
      const totalValue = typeof totalObj === 'object' && totalObj.value !== undefined 
        ? totalObj.value 
        : (typeof totalObj === 'number' ? totalObj : 0);
      
      const products = hitList.map((hit) => {
        const source = hit._source || {};
        return {
          ...source,
          score: hit._score || 0,
          technicalSpecs: source.technicalSpecs
            ? typeof source.technicalSpecs === 'string'
              ? JSON.parse(source.technicalSpecs)
              : source.technicalSpecs
            : {}
        };
      });

      // Toujours prendre les images depuis MongoDB : l’index ES peut être obsolète
      // (catalogue / recherche sans images alors que ProductImage est à jour).
      const productIds = [...new Set(products.map((p) => p.id).filter((id) => id != null))];
      if (productIds.length > 0) {
        const allImages = await this.productImageRepository.findByProductIds(productIds);
        const byProductId = new Map();
        for (const img of allImages) {
          const pid = Number(img.productId);
          if (!byProductId.has(pid)) byProductId.set(pid, []);
          byProductId.get(pid).push({
            url: img.url,
            alt: img.alt || '',
            isPrimary: Boolean(img.isPrimary),
            order: img.order ?? 0
          });
        }
        for (const p of products) {
          const pid = Number(p.id);
          if (byProductId.has(pid)) {
            p.images = byProductId.get(pid);
          } else if (!Array.isArray(p.images)) {
            p.images = [];
          }
        }
      }

      return {
        data: products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalValue,
          totalPages: Math.ceil(totalValue / limit)
        },
        meta: {
          query: q,
          filters: {
            minPrice,
            maxPrice,
            categoryId,
            inStock
          },
          sortBy,
          duration: `${duration}ms`
        }
      };
    } catch (error) {
      console.error('❌ Elasticsearch search error:', error.message);
      
      // Vérifier si c'est une erreur de connexion
      if (error.message.includes('ECONNREFUSED') || 
          error.message.includes('other side closed') ||
          error.message.includes('connect ECONNREFUSED')) {
        const elasticsearchError = new Error('Elasticsearch n\'est pas disponible. Veuillez démarrer Elasticsearch ou désactiver la recherche avancée.');
        elasticsearchError.statusCode = 503;
        elasticsearchError.name = 'ServiceUnavailable';
        throw elasticsearchError;
      }
      
      throw error;
    }
  }

  // Réindexer tous les produits 
  async reindexAllProducts() {
    try {
      console.log('🔄 Starting full product reindexing...');
      
      let page = 1;
      let limit = 100;
      let processed = 0;
      let hasMore = true;
      
      while (hasMore) {
        const result = await this.productRepository.findAll({}, { page, limit });
        
        if (result.data.length === 0) {
          hasMore = false;
          break;
        }
        
        // Indexer les produits par batch
        const indexPromises = result.data.map(product => 
          this.indexProduct(product.id).catch(err => {
            console.error(`⚠️  Failed to index product ${product.id}:`, err.message);
            return null;
          })
        );
        
        await Promise.all(indexPromises);
        processed += result.data.length;
        
        if (processed % 100 === 0) {
          console.log(`  Processed ${processed} products...`);
        }
        
        // Vérifier s'il y a plus de produits
        if (result.data.length < limit) {
          hasMore = false;
        } else {
          page++;
        }
      }
      
      console.log(`✅ Reindexing complete: ${processed} products indexed`);
      return { message: `Réindexation terminée : ${processed} produits indexés` };
    } catch (error) {
      console.error('❌ Reindexing error:', error.message);
      throw error;
    }
  }
}

