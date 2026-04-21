import { OrderRepository } from '../repositories/orderRepository.js';
import { ProductRepository } from '../repositories/productRepository.js';
import { AddressRepository } from '../repositories/addressRepository.js';
import { PaymentRepository } from '../repositories/paymentRepository.js';
import { PaymentMethodRepository } from '../repositories/paymentMethodRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { InvoiceService } from './invoiceService.js';

export class OrderService {
  constructor() {
    this.orderRepository = new OrderRepository();
    this.productRepository = new ProductRepository();
    this.addressRepository = new AddressRepository();
    this.paymentRepository = new PaymentRepository();
    this.paymentMethodRepository = new PaymentMethodRepository();
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

    // Ajouter les items de la commande et diminuer le stock en base
    if (metadata.cartItems && Array.isArray(metadata.cartItems)) {
      for (const item of metadata.cartItems) {
        const product = await this.productRepository.findById(item.productId);
        if (product) {
          const unitTtc =
            item.price != null && Number(item.price) > 0
              ? Number(item.price)
              : Number(product.priceTtc || 0);
          const unitHt =
            product.priceHt != null
              ? Number(product.priceHt)
              : unitTtc / (1 + Number(product.tva || 0) / 100);
          const lineSubtotal = unitHt * item.quantity;
          const lineTotal = unitTtc * item.quantity;
          await this.orderRepository.addItem(order.id, {
            productId: item.productId,
            productName: product.name,
            productSlug: product.slug,
            quantity: item.quantity,
            unitPriceHt: unitHt,
            unitPriceTtc: unitTtc,
            tva: product.tva,
            subtotal: lineSubtotal,
            total: lineTotal
          });
          const qty = Math.max(0, parseInt(String(item.quantity), 10) || 0);
          if (qty > 0) {
            const ok = await this.productRepository.decrementStock(item.productId, qty);
            if (!ok) {
              console.warn(
                '[ORDER SERVICE] Stock non déduit (stock insuffisant ou produit absent) pour',
                item.productId,
                'qty',
                qty
              );
            }
          }
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

    let items = await this.orderRepository.getOrderItems(orderId);
    items = items.map((it) => {
      const q = Number(it.quantity) || 0;
      const total = Number(it.total) || 0;
      let unitTtc = Number(it.unitPriceTtc) || 0;
      if (unitTtc <= 0 && q > 0 && total > 0) {
        unitTtc = total / q;
      }
      return { ...it, unitPriceTtc: unitTtc };
    });
    const statusHistory = await this.orderRepository.getStatusHistory(orderId);
    const invoice = await this.invoiceService.getInvoiceByOrderId(orderId);
    const payment = order.paymentId ? await this.paymentRepository.findById(order.paymentId) : null;
    const paymentMethods = order.userId ? await this.paymentMethodRepository.findByUserId(order.userId) : [];

    const parseMeta = (m) => {
      if (!m) return {};
      return typeof m === 'string' ? (() => { try { return JSON.parse(m); } catch { return {}; } })() : m;
    };
    const payMeta = parseMeta(payment?.metadata);

    const orderCreatedMs = order.createdAt ? new Date(order.createdAt).getTime() : Date.now();
    const methodsChrono = [...paymentMethods].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const methodNearOrder = methodsChrono.find(
      (m) => new Date(m.createdAt).getTime() <= orderCreatedMs + 120000
    );

    const brandLabel = (b) => (b ? String(b).replace(/_/g, ' ') : '');
    let paymentSummary = null;
    if (payMeta.paymentMethodLabel) {
      paymentSummary = {
        type: payMeta.paymentMethodType || 'card',
        brand: payMeta.cardBrand || payMeta.brand || null,
        last4: payMeta.cardLast4 || payMeta.last4 || null,
        label: payMeta.paymentMethodLabel
      };
    } else if (methodNearOrder) {
      paymentSummary = {
        type: methodNearOrder.type || 'card',
        brand: methodNearOrder.brand || null,
        last4: methodNearOrder.last4 || null,
        label: null
      };
    } else {
      const fallback = paymentMethods.find((method) => method.isDefault) || paymentMethods[0] || null;
      paymentSummary = fallback
        ? {
            type: fallback.type || 'card',
            brand: fallback.brand || null,
            last4: fallback.last4 || null,
            label: null
          }
        : { type: 'card', brand: null, last4: null, label: null };
    }

    const buildPaymentMethodLabel = () => {
      if (paymentSummary?.label) return paymentSummary.label;
      const type = (paymentSummary?.type || '').toLowerCase();
      const typeFr =
        type === 'card'
          ? 'Carte bancaire'
          : type
            ? type.charAt(0).toUpperCase() + type.slice(1)
            : 'Paiement en ligne';
      const brand = brandLabel(paymentSummary?.brand);
      const last = paymentSummary?.last4 ? `···· ${paymentSummary.last4}` : '';
      return [typeFr, brand, last].filter(Boolean).join(' · ');
    };

    const paymentMethodLabel = buildPaymentMethodLabel();

    let customer = null;
    if (order.userId) {
      const u = await this.userRepository.findById(order.userId);
      if (u) {
        const displayName = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
        customer = {
          id: u.id,
          email: u.email,
          firstName: u.first_name,
          lastName: u.last_name,
          phone: u.phone,
          displayName: displayName || u.email
        };
      }
    }

    return {
      ...order,
      items,
      statusHistory,
      customer,
      paymentMethodLabel,
      payment: payment
        ? {
            id: payment.id,
            status: payment.status,
            amount: payment.amount,
            currency: payment.currency,
            summary: { ...paymentSummary, label: paymentMethodLabel }
          }
        : {
            id: null,
            status: null,
            amount: order.total,
            currency: order.currency,
            summary: { ...paymentSummary, label: paymentMethodLabel }
          },
      invoice: invoice ? {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        pdfPath: invoice.pdfPath
      } : null
    };
  }

  // Récupérer les commandes d'un utilisateur
  async getUserOrders(userId, filters = {}, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;
    
    const orders = await this.orderRepository.findByUserId(userId, filters, limit, offset);
    const total = await this.orderRepository.countByUserId(userId, filters);
    
    return {
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
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

