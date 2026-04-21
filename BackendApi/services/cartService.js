import { CartRepository } from '../repositories/cartRepository.js';
import { ProductRepository } from '../repositories/productRepository.js';
import { ProductImageRepository } from '../repositories/productImageRepository.js';
import { isProductExcludedFromStorefront } from '../utils/storefrontProductExclusions.js';
import crypto from 'crypto';

function mapMongoProductImage(img) {
  if (!img?.url) return null;
  return {
    id: img._id != null ? String(img._id) : undefined,
    url: img.url,
    order: img.order ?? 0,
    isPrimary: Boolean(img.isPrimary)
  };
}

export class CartService {
  constructor() {
    this.cartRepository = new CartRepository();
    this.productRepository = new ProductRepository();
    this.productImageRepository = new ProductImageRepository();
  }

  // Générer un token invité unique
  generateGuestToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Obtenir ou créer un panier (utilisateur ou invité)
  async getOrCreateCart(userId, guestToken) {
    if (userId) {
      return await this.cartRepository.findOrCreateUserCart(userId);
    } else if (guestToken) {
      return await this.cartRepository.findOrCreateGuestCart(guestToken);
    } else {
      throw new Error('UserId ou guestToken requis');
    }
  }

  // Obtenir le panier complet avec items et détails produits
  async getCart(userId, guestToken) {
    const cart = await this.getOrCreateCart(userId, guestToken);
    if (!cart) {
      return { cart: null, items: [], total: 0, subtotal: 0, tva: 0 };
    }

    const items = await this.cartRepository.getCartItems(cart.id);

    const productIds = [...new Set(items.map((i) => i.productId).filter(Boolean))];
    const mongoImages = productIds.length
      ? await this.productImageRepository.findByProductIds(productIds)
      : [];
    const imagesByProductId = new Map();
    for (const raw of mongoImages) {
      const mapped = mapMongoProductImage(raw);
      if (!mapped) continue;
      const pid = Number(raw.productId);
      if (!Number.isFinite(pid)) continue;
      if (!imagesByProductId.has(pid)) imagesByProductId.set(pid, []);
      imagesByProductId.get(pid).push(mapped);
    }

    // Récupérer les détails des produits
    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const product = await this.productRepository.findById(item.productId);
        if (!product || isProductExcludedFromStorefront(product)) {
          // Si le produit n'existe plus ou n'est plus proposé en vitrine, on ne l'affiche pas
          return null;
        }

        const itemPrice = product.priceTtc * item.quantity;
        const itemPriceHt = product.priceHt * item.quantity;
        const itemTva = itemPrice - itemPriceHt;
        const images = imagesByProductId.get(Number(product.id)) || [];

        return {
          id: item.id,
          productId: item.productId,
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            priceHt: product.priceHt,
            priceTtc: product.priceTtc,
            tva: product.tva,
            stock: product.stock,
            status: product.status,
            images
          },
          quantity: item.quantity,
          subtotal: itemPriceHt,
          total: itemPrice,
          tva: itemTva
        };
      })
    );

    // Filtrer les produits null (produits supprimés)
    const validItems = itemsWithProducts.filter(item => item !== null);

    // Calculer les totaux
    const subtotal = validItems.reduce((sum, item) => sum + item.subtotal, 0);
    const tva = validItems.reduce((sum, item) => sum + item.tva, 0);
    const total = validItems.reduce((sum, item) => sum + item.total, 0);

    return {
      cart: {
        id: cart.id,
        userId: cart.userId,
        guestToken: cart.guestToken,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt
      },
      items: validItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tva: parseFloat(tva.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  }

  // Ajouter un produit au panier
  async addItem(userId, guestToken, productId, quantity = 1) {
    // Vérifier que le produit existe et est disponible
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('Produit introuvable');
    }

    if (product.status !== 'active') {
      throw new Error('Ce produit n\'est pas disponible');
    }

    if (isProductExcludedFromStorefront(product)) {
      throw new Error('Ce produit n\'est pas disponible');
    }

    // Obtenir ou créer le panier
    const cart = await this.getOrCreateCart(userId, guestToken);

    // Vérifier le stock disponible
    const existingItems = await this.cartRepository.getCartItems(cart.id);
    const existingItem = existingItems.find(item => item.productId === productId);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    const newQuantity = currentQuantity + quantity;

    if (newQuantity > product.stock) {
      throw new Error(`Stock insuffisant. Stock disponible: ${product.stock}, Quantité demandée: ${newQuantity}`);
    }

    // Ajouter l'item
    await this.cartRepository.addItem(cart.id, productId, quantity);

    // Retourner le panier mis à jour
    return await this.getCart(userId, guestToken);
  }

  // Mettre à jour la quantité d'un produit
  async updateItem(userId, guestToken, productId, quantity) {
    if (quantity < 1) {
      throw new Error('La quantité doit être supérieure à 0');
    }

    // Vérifier que le produit existe et est disponible
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('Produit introuvable');
    }

    if (product.status !== 'active') {
      throw new Error('Ce produit n\'est pas disponible');
    }

    if (isProductExcludedFromStorefront(product)) {
      throw new Error('Ce produit n\'est pas disponible');
    }

    // Vérifier le stock
    if (quantity > product.stock) {
      throw new Error(`Stock insuffisant. Stock disponible: ${product.stock}, Quantité demandée: ${quantity}`);
    }

    // Obtenir le panier
    const cart = await this.getOrCreateCart(userId, guestToken);

    // Mettre à jour la quantité
    await this.cartRepository.updateItemQuantity(cart.id, productId, quantity);

    // Retourner le panier mis à jour
    return await this.getCart(userId, guestToken);
  }

  // Supprimer un produit du panier
  async removeItem(userId, guestToken, productId) {
    const cart = await this.getOrCreateCart(userId, guestToken);
    
    const removed = await this.cartRepository.removeItem(cart.id, productId);
    if (!removed) {
      throw new Error('Produit introuvable dans le panier');
    }

    // Retourner le panier mis à jour
    return await this.getCart(userId, guestToken);
  }

  // Vérifier le stock de tous les items du panier (pour checkout)
  async validateCartStock(userId, guestToken) {
    const cartData = await this.getCart(userId, guestToken);
    
    if (!cartData.cart || cartData.items.length === 0) {
      throw new Error('Le panier est vide');
    }

    const errors = [];
    
    for (const item of cartData.items) {
      const product = await this.productRepository.findById(item.productId);
      
      if (!product || product.status !== 'active' || isProductExcludedFromStorefront(product)) {
        errors.push({
          productId: item.productId,
          productName: item.product?.name || 'Produit inconnu',
          message: 'Ce produit n\'est plus disponible'
        });
      } else if (item.quantity > product.stock) {
        errors.push({
          productId: item.productId,
          productName: product.name,
          message: `Stock insuffisant. Stock disponible: ${product.stock}, Quantité dans le panier: ${item.quantity}`
        });
      }
    }

    if (errors.length > 0) {
      const error = new Error('Certains produits du panier ont un stock insuffisant');
      error.statusCode = 400;
      error.errors = errors;
      throw error;
    }

    return { valid: true, cart: cartData };
  }

  // Synchroniser le panier invité avec le panier utilisateur (lors de la connexion)
  async syncGuestCartToUser(guestToken, userId) {
    if (!guestToken || !userId) {
      return null;
    }

    // Trouver le panier invité
    const guestCart = await this.cartRepository.findByGuestToken(guestToken);
    if (!guestCart) {
      // Pas de panier invité, retourner le panier utilisateur s'il existe
      return await this.cartRepository.findByUserId(userId);
    }

    // Trouver le panier utilisateur
    const userCart = await this.cartRepository.findByUserId(userId);

    if (!userCart) {
      // Pas de panier utilisateur, convertir le panier invité
      return await this.cartRepository.convertGuestToUserCart(guestToken, userId);
    }

    // Fusionner les deux paniers
    const guestItems = await this.cartRepository.getCartItems(guestCart.id);
    
    for (const guestItem of guestItems) {
      try {
        // Vérifier le stock avant de fusionner
        const product = await this.productRepository.findById(guestItem.productId);
        if (!product || product.status !== 'active' || isProductExcludedFromStorefront(product)) {
          continue; // Ignorer les produits invalides ou retirés de la vitrine
        }

        // Vérifier si l'item existe déjà dans le panier utilisateur
        const userItems = await this.cartRepository.getCartItems(userCart.id);
        const existingItem = userItems.find(item => item.productId === guestItem.productId);

        if (existingItem) {
          // Fusionner les quantités (en respectant le stock)
          const newQuantity = Math.min(
            existingItem.quantity + guestItem.quantity,
            product.stock
          );
          await this.cartRepository.updateItemQuantity(userCart.id, guestItem.productId, newQuantity);
        } else {
          // Ajouter l'item (en respectant le stock)
          const quantity = Math.min(guestItem.quantity, product.stock);
          if (quantity > 0) {
            await this.cartRepository.addItem(userCart.id, guestItem.productId, quantity);
          }
        }
      } catch (error) {
        // Ignorer les erreurs de stock et continuer avec les autres items
        console.warn(`Impossible de fusionner l'item ${guestItem.productId}:`, error.message);
      }
    }

    // Supprimer le panier invité après fusion
    await this.cartRepository.deleteCart(guestCart.id);

    // Retourner le panier utilisateur fusionné
    return await this.getCart(userId, null);
  }
}

