import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

dotenv.config();

let elasticsearchClient = null;

export const getElasticsearchClient = () => {
  if (!elasticsearchClient) {
    const node = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
    const username = process.env.ELASTICSEARCH_USERNAME;
    const password = process.env.ELASTICSEARCH_PASSWORD;
    
    const config = {
      node
    };
    
    if (username && password) {
      config.auth = {
        username,
        password
      };
    }
    
    elasticsearchClient = new Client(config);
  }
  
  return elasticsearchClient;
};

export const initializeElasticsearchIndex = async () => {
  const client = getElasticsearchClient();
  const indexName = process.env.ELASTICSEARCH_INDEX || 'products';
  
  try {
    // Vérifier si l'index existe (Elasticsearch v8 retourne un booléen)
    const indexExists = await client.indices.exists({ index: indexName });
    
    if (!indexExists) {
      // Créer l'index avec mapping (Elasticsearch v8 utilise 'body' pour settings et mappings)
      await client.indices.create({
        index: indexName,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 1,
            analysis: {
              analyzer: {
                french_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'asciifolding', 'french_stemmer', 'french_stop']
                }
              },
              filter: {
                french_stemmer: {
                  type: 'stemmer',
                  language: 'french'
                },
                french_stop: {
                  type: 'stop',
                  stopwords: '_french_'
                }
              }
            }
          },
          mappings: {
            properties: {
              id: { type: 'integer' },
              name: {
                type: 'text',
                analyzer: 'french_analyzer',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              description: {
                type: 'text',
                analyzer: 'french_analyzer'
              },
              technicalSpecs: {
                type: 'text',
                analyzer: 'french_analyzer'
              },
              priceHt: { type: 'float' },
              priceTtc: { type: 'float' },
              tva: { type: 'float' },
              stock: { type: 'integer' },
              priority: { type: 'integer' },
              status: { type: 'keyword' },
              slug: { type: 'keyword' },
              categoryId: { type: 'integer' },
              categoryName: { type: 'keyword' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' },
              images: {
                type: 'nested',
                properties: {
                  url: { type: 'keyword' },
                  alt: { type: 'text' },
                  isPrimary: { type: 'boolean' },
                  order: { type: 'integer' }
                }
              }
            }
          }
        }
      });
      
      console.log(`✅ Elasticsearch index "${indexName}" created`);
    } else {
      console.log(`✅ Elasticsearch index "${indexName}" already exists`);
    }
  } catch (error) {
    console.error('❌ Elasticsearch initialization error:', error.message);
    throw error;
  }
};

export const testElasticsearchConnection = async () => {
  try {
    const client = getElasticsearchClient();
    await client.ping();
    return true;
  } catch (error) {
    console.error('❌ Elasticsearch connection test failed:', error.message);
    throw error;
  }
};
