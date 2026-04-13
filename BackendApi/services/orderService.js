import { OrderRepository } from '../repositories/orderRepository.js';
import { ProductRepository } from '../repositories/productRepository.js';
import { AddressRepository } from '../repositories/addressRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { InvoiceService } from './invoiceService.js';

export class OrderService {
  constructor() {
    this.orderRepository = new OrderRepository();
    this.productRepository = new ProductRepository();
    this.addressRepository = new AddressRepository();
    this.userRepository = new UserRepository();
    this.invoiceService = new InvoiceService();
  }

  // Créer une commande après paiement réussi
  async createOrderFromPayment(paymentId, paymentData) {
    const { cartId, userId, metadata } = paymentData;
    
    // Vérifier si une commande existe déjà pour ce paiement
    const existingOrder = await this.orderRepository.findByPaymentId(paymentId);
    if (existingOrder) {
      console.log('⚠️ Order already exists for payment:', paymentId, '- Order:', existingOrder.orderNumber);
      return this.getOrderById(existingOrder.id);
    }
    
    // Vérifier que les métadonnées sont présentes
    // Si cartItems n'est pas disponible, on peut créer une commande avec un tableau vide
    if (!metadata) {
      throw new Error('Métadonnées de paiement manquantes');
    }
    
    // Normaliser cartItems (peut être vide si les métadonnées n'étaient pas disponibles)
    if (!metadata.cartItems || !Array.isArray(metadata.cartItems)) {
      console.warn('⚠️ [ORDER SERVICE] cartItems manquant ou invalide, utilisation d\'un tableau vide');
      metadata.cartItems = [];
    }
    
    if (!metadata.subtotal || !metadata.total) {
      // Si les montants ne sont pas dans les métadonnées, utiliser des valeurs par défaut
      console.warn('⚠️ [ORDER SERVICE] subtotal ou total manquant, calcul à partir du total');
      if (metadata.total && !metadata.subtotal) {
        metadata.subtotal = metadata.total / 1.2; // Approximation si TVA = 20%
        metadata.tva = metadata.total - metadata.subtotal;
      } else if (!metadata.total) {
        throw new Error('Métadonnées de paiement invalides : total manquant');
      }
    }
    
    console.log('📦 Creating order with metadata:', {
      paymentId,
      cartId,
      userId,
      subtotal: metadata.subtotal,
      tva: metadata.tva,
      total: metadata.total,
      itemsCount: metadata.cartItems.length
    });
    
    // Récupérer les adresses de l'utilisateur
    let shippingAddress = null;
    let billingAddress = null;
    
    if (userId) {
      const addresses = await this.addressRepository.findByUserId(userId);
      shippingAddress = addresses.find(a => a.type === 'shipping' && a.isDefault) || 
                       addresses.find(a => a.type === 'shipping') || 
                       addresses.find(a => a.isDefault);
      billingAddress = addresses.find(a => a.type === 'billing' && a.isDefault) || 
                      addresses.find(a => a.type === 'billing') || 
                      addresses.find(a => a.isDefault && a.type !== 'shipping');
    }

    // Créer la commande
    console.log('🟢 [ORDER SERVICE] About to create order with data:', {
      userId: userId || null,
      paymentId: paymentId,
      cartId: cartId,
      subtotal: metadata.subtotal || 0,
      tva: metadata.tva || 0,
      total: metadata.total || 0,
      hasShippingAddress: !!shippingAddress,
      hasBillingAddress: !!billingAddress
    });

    const orderData = {
      userId: userId || null,
      paymentId: paymentId,
      cartId: cartId,
      subtotal: metadata.subtotal || 0,
      tva: metadata.tva || 0,
      total: metadata.total || 0,
      currency: 'EUR',
      status: 'pending',
      shippingAddress: shippingAddress ? {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        company: shippingAddress.company,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        phone: shippingAddress.phone
      } : null,
      billingAddress: billingAddress ? {
        firstName: billingAddress.firstName,
        lastName: billingAddress.lastName,
        company: billingAddress.company,
        addressLine1: billingAddress.addressLine1,
        addressLine2: billingAddress.addressLine2,
        city: billingAddress.city,
        postalCode: billingAddress.postalCode,
        country: billingAddress.country,
        phone: billingAddress.phone
      } : null,
      metadata: metadata
    };

    console.log('🟢 [ORDER SERVICE] Calling orderRepository.create()...');
    const order = await this.orderRepository.create(orderData);
    console.log('✅ [ORDER SERVICE] Order created in repository, orderNumber:', order.orderNumber);

    // Ajouter les items de la commande
    if (metadata.cartItems && Array.isArray(metadata.cartItems)) {
      for (const item of metadata.cartItems) {
        const product = await this.productRepository.findById(item.productId);
        if (product) {
          await this.orderRepository.addItem(order.id, {
            productId: item.productId,
            productName: product.name,
            productSlug: product.slug,
            quantity: item.quantity,
            unitPriceHt: product.priceHt,
            unitPriceTtc: item.price,
            tva: product.tva,
            subtotal: product.priceHt * item.quantity,
            total: item.price * item.quantity
          });
        }
      }
    }

    // Générer automatiquement la facture
    await this.invoiceService.createInvoiceFromOrder(order.id);

    // Mettre à jour le statut de la commande en "processing"
    await this.orderRepository.updateStatus(order.id, 'processing', null, 'Commande créée automatiquement après paiement réussi');

    return this.getOrderById(order.id);
  }

  // Récupérer une commande par ID avec ses détails
  async getOrderById(orderId, userId = null) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Commande introuvable');
    }

    // Vérifier que l'utilisateur peut accéder à cette commande
    if (userId && order.userId !== userId) {
      throw new Error('Accès non autorisé à cette commande');
    }

    const items = await this.orderRepository.getOrderItems(orderId);
    const statusHistory = await this.orderRepository.getStatusHistory(orderId);
    const invoice = await this.invoiceService.getInvoiceByOrderId(orderId);

    return {
      ...order,
      items,
      statusHistory,
      invoice: invoice ? {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        pdfPath: invoice.pdfPath
      } : null
    };
  }

  // Récupérer les commandes d'un utilisateur
  async getUserOrders(userId, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;
    
    const orders = await this.orderRepository.findByUserId(userId, limit, offset);
    
    return {
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: orders.length
      }
    };
  }

  // Récupérer toutes les commandes (admin)
  async getAllOrders(filters = {}, pagination = {}) {
    return await this.orderRepository.findAll(filters, pagination);
  }

  // Mettre à jour le statut d'une commande (admin)
  async updateOrderStatus(orderId, status, changedBy, notes = null) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Commande introuvable');
    }

    // Si la commande est annulée, créer un avoir pour la facture
    if (status === 'canceled' && order.status !== 'canceled') {
      const invoice = await this.invoiceService.getInvoiceByOrderId(orderId);
      if (invoice && invoice.status === 'issued') {
        await this.invoiceService.createCreditNote(invoice.id, {
          reason: notes || 'Annulation de commande',
          amount: invoice.total
        });
      }
    }

    return await this.orderRepository.updateStatus(orderId, status, changedBy, notes);
  }
}

