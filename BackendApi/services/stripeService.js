import { getStripeClient } from '../config/stripe.js';
import { PaymentRepository } from '../repositories/paymentRepository.js';
import { PaymentMethodRepository } from '../repositories/paymentMethodRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { CartService } from './cartService.js';
import { OrderService } from './orderService.js';
import { EmailService } from './emailService.js';

export class StripeService {
  constructor() {
    this.stripe = getStripeClient();
    this.paymentRepository = new PaymentRepository();
    this.paymentMethodRepository = new PaymentMethodRepository();
    this.userRepository = new UserRepository();
    this.cartService = new CartService();
    this.orderService = new OrderService();
    this.emailService = new EmailService();
  }

  // Créer un PaymentIntent
  async createPaymentIntent(userId, guestToken, cartId = null) {
    try {
      // Valider le panier et obtenir le total
      const validationResult = await this.cartService.validateCartStock(userId, guestToken);
      const cartData = validationResult.cart;
      
      if (!cartData.cart || !cartData.items || cartData.items.length === 0) {
        throw new Error('Le panier est vide');
      }

      const amount = Math.round(cartData.total * 100); // Convertir en centimes
      const currency = 'eur';

      // Créer le PaymentIntent avec Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount,
        currency: currency,
        metadata: {
          userId: userId ? userId.toString() : null,
          cartId: cartData.cart.id.toString(),
          guestToken: guestToken || null
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Enregistrer le paiement en base de données
      console.log('💳 [STRIPE SERVICE] Creating payment in database:', {
        userId: userId || null,
        cartId: cartData.cart.id,
        stripePaymentIntentId: paymentIntent.id,
        amount: cartData.total
      });
      
      const payment = await this.paymentRepository.create({
        userId: userId || null,
        cartId: cartData.cart.id,
        stripePaymentIntentId: paymentIntent.id,
        amount: cartData.total,
        currency: currency.toUpperCase(),
        status: 'pending',
        metadata: {
          cartItems: cartData.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.priceTtc
          })),
          subtotal: cartData.subtotal,
          tva: cartData.tva,
          total: cartData.total
        }
      });
      
      console.log('✅ [STRIPE SERVICE] Payment created in database:', {
        paymentId: payment.id,
        stripePaymentIntentId: payment.stripePaymentIntentId
      });

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: cartData.total,
        currency: currency.toUpperCase(),
        payment: payment
      };
    } catch (error) {
      console.error('❌ Error creating payment intent:', error.message);
      throw error;
    }
  }

  // Gérer les événements webhook Stripe
  async handleWebhookEvent(event) {
    try {
      const paymentIntentId = event.data.object.id;
      console.log('🔍 Looking for payment with intent:', paymentIntentId);
      
      let payment = await this.paymentRepository.findByPaymentIntentId(paymentIntentId);
      
      if (!payment) {
        console.warn('⚠️ Payment not found for intent:', paymentIntentId);
        console.log('📋 PaymentIntent metadata:', event.data.object.metadata);
        
        // Si le paiement n'existe pas, le créer depuis les metadata Stripe
        // Ceci peut arriver si create-intent n'a pas réussi à enregistrer le paiement
        const paymentIntent = event.data.object;
        const userIdFromMetadata = paymentIntent.metadata?.userId ? parseInt(paymentIntent.metadata.userId) : null;
        const cartIdFromMetadata = paymentIntent.metadata?.cartId ? parseInt(paymentIntent.metadata.cartId) : null;
        
        console.log('🔧 Creating payment from webhook metadata:', {
          userId: userIdFromMetadata,
          cartId: cartIdFromMetadata,
          amount: paymentIntent.amount / 100
        });
        
        // Extraire les metadata complètes (cartItems, subtotal, etc.) si disponibles
        let fullMetadata = {};
        if (paymentIntent.metadata) {
          // Les metadata Stripe sont des strings, il faut les parser si possible
          try {
            fullMetadata = typeof paymentIntent.metadata === 'object' 
              ? paymentIntent.metadata 
              : JSON.parse(paymentIntent.metadata);
          } catch (e) {
            // Si ce n'est pas du JSON, utiliser tel quel
            fullMetadata = paymentIntent.metadata;
          }
        }
        
        // Si on n'a pas les cartItems dans les metadata, essayer de les récupérer du panier
        // Note : Les metadata Stripe peuvent être vides si créées autrement
        if (!fullMetadata.cartItems || fullMetadata.cartItems.length === 0) {
          // Essayer de récupérer depuis cartId si disponible
          if (cartIdFromMetadata) {
            try {
              const cartData = await this.cartService.getCart(userIdFromMetadata, paymentIntent.metadata?.guestToken || null);
              if (cartData && cartData.items && cartData.items.length > 0) {
                fullMetadata.cartItems = cartData.items.map(item => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  price: item.product?.priceTtc || 0
                }));
                fullMetadata.subtotal = cartData.subtotal || 0;
                fullMetadata.tva = cartData.tva || 0;
                fullMetadata.total = cartData.total || paymentIntent.amount / 100;
                
                console.log('✅ Cart data retrieved from cartId for metadata:', {
                  cartId: cartIdFromMetadata,
                  itemsCount: fullMetadata.cartItems.length,
                  subtotal: fullMetadata.subtotal,
                  tva: fullMetadata.tva,
                  total: fullMetadata.total
                });
              }
            } catch (error) {
              console.warn('⚠️ Could not retrieve cart data from cartId:', error.message);
            }
          }
          
          // Si toujours pas de cartItems, essayer avec userId ou guestToken
          if ((!fullMetadata.cartItems || fullMetadata.cartItems.length === 0) && 
              (userIdFromMetadata || paymentIntent.metadata?.guestToken)) {
            try {
              const cartData = await this.cartService.getCart(userIdFromMetadata, paymentIntent.metadata?.guestToken || null);
              if (cartData && cartData.items && cartData.items.length > 0) {
                fullMetadata.cartItems = cartData.items.map(item => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  price: item.product?.priceTtc || 0
                }));
                fullMetadata.subtotal = cartData.subtotal || 0;
                fullMetadata.tva = cartData.tva || 0;
                fullMetadata.total = cartData.total || paymentIntent.amount / 100;
                
                console.log('✅ Cart data retrieved from user/guest for metadata:', {
                  userId: userIdFromMetadata,
                  guestToken: paymentIntent.metadata?.guestToken ? 'present' : 'null',
                  itemsCount: fullMetadata.cartItems.length,
                  subtotal: fullMetadata.subtotal,
                  tva: fullMetadata.tva,
                  total: fullMetadata.total
                });
              }
            } catch (error) {
              console.warn('⚠️ Could not retrieve cart data from user/guest:', error.message);
            }
          }
        }
        
        // Si on n'a toujours pas les montants, utiliser les valeurs du PaymentIntent
        if (!fullMetadata.subtotal && !fullMetadata.total) {
          fullMetadata.total = paymentIntent.amount / 100;
          fullMetadata.subtotal = paymentIntent.amount / 100 / 1.2; // Approximation si TVA = 20%
          fullMetadata.tva = fullMetadata.total - fullMetadata.subtotal;
        }
        
        payment = await this.paymentRepository.create({
          userId: userIdFromMetadata,
          cartId: cartIdFromMetadata,
          stripePaymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100, // Convertir de centimes en euros
          currency: paymentIntent.currency.toUpperCase(),
          status: this.mapStripeStatusToPaymentStatus(paymentIntent.status),
          metadata: fullMetadata
        });
        
        console.log('✅ Payment created from webhook:', {
          paymentId: payment.id,
          userId: payment.userId,
          cartId: payment.cartId
        });
      } else {
        console.log('✅ Payment found:', {
          id: payment.id,
          userId: payment.userId,
          cartId: payment.cartId,
          status: payment.status,
          hasMetadata: !!payment.metadata
        });
      }

      // Mettre à jour le statut selon l'événement
      if (payment) {
        let newStatus = null;
        let metadata = null;
        let shouldCreateOrder = false;

        switch (event.type) {
          case 'payment_intent.succeeded':
            newStatus = 'succeeded';
            
            // S'assurer que metadata est un objet
            const paymentMetadata = payment.metadata || {};
            const parsedMetadata = typeof paymentMetadata === 'string' 
              ? JSON.parse(paymentMetadata) 
              : paymentMetadata;
            
            metadata = {
              ...parsedMetadata,
              succeededAt: new Date().toISOString(),
              chargeId: event.data.object.latest_charge
            };
            
            shouldCreateOrder = true;
            break;

          case 'payment_intent.payment_failed':
            newStatus = 'failed';
            metadata = {
              ...payment.metadata,
              failedAt: new Date().toISOString(),
              failureMessage: event.data.object.last_payment_error?.message || 'Payment failed'
            };
            break;

          case 'payment_intent.canceled':
            newStatus = 'canceled';
            metadata = {
              ...payment.metadata,
              canceledAt: new Date().toISOString()
            };
            break;

          case 'payment_intent.processing':
            newStatus = 'processing';
            break;

          case 'charge.refunded':
            newStatus = 'refunded';
            metadata = {
              ...payment.metadata,
              refundedAt: new Date().toISOString(),
              refundId: event.data.object.id
            };
            break;

          default:
            // Pour les autres événements, on ne change pas le statut
            return { processed: false, message: `Event type ${event.type} not handled` };
        }

        if (newStatus) {
          payment = await this.paymentRepository.updateStatus(paymentIntentId, newStatus, metadata);
        }

        if (event.type === 'payment_intent.succeeded' && payment?.userId) {
          await this.saveUserPaymentMethodFromIntent(payment, event.data.object);
        }

        // Créer la commande après mise à jour du statut du paiement
        if (shouldCreateOrder && payment) {
          console.log('🔵 [STRIPE SERVICE] shouldCreateOrder is TRUE, payment exists:', {
            paymentId: payment.id,
            paymentStatus: payment.status
          });
          
          try {
            // S'assurer que metadata est un objet (récupérer depuis payment mis à jour)
            const paymentMetadata = payment.metadata || {};
            const parsedMetadata = typeof paymentMetadata === 'string' 
              ? JSON.parse(paymentMetadata) 
              : paymentMetadata;
            
            console.log('📦 [STRIPE SERVICE] Creating order from payment:', {
              paymentId: payment.id,
              cartId: payment.cartId,
              userId: payment.userId,
              hasMetadata: !!parsedMetadata,
              hasCartItems: !!parsedMetadata?.cartItems,
              subtotal: parsedMetadata?.subtotal,
              tva: parsedMetadata?.tva,
              total: parsedMetadata?.total
            });
            
            const order = await this.orderService.createOrderFromPayment(payment.id, {
              cartId: payment.cartId,
              userId: payment.userId,
              metadata: parsedMetadata
            });
            
            console.log('✅ [STRIPE SERVICE] Order created successfully:', order.orderNumber);

            // Email de confirmation de commande (best-effort)
            await this.sendOrderConfirmationEmail(order, payment.userId);
          } catch (orderError) {
            console.error('❌ [STRIPE SERVICE] Error creating order from payment:');
            console.error('   Error type:', orderError.constructor.name);
            console.error('   Message:', orderError.message);
            console.error('   Stack:', orderError.stack);
            if (orderError.code) {
              console.error('   SQL Error code:', orderError.code);
              console.error('   SQL State:', orderError.sqlState);
            }
            // On continue même si la création de commande échoue
          }
        } else {
          console.log('⚠️ [STRIPE SERVICE] Order NOT created. Reasons:');
          console.log('   shouldCreateOrder:', shouldCreateOrder);
          console.log('   payment exists:', !!payment);
        }
      }

      return {
        processed: true,
        payment: payment,
        eventType: event.type
      };
    } catch (error) {
      console.error('❌ Error handling webhook event:', error.message);
      throw error;
    }
  }

  // Mapper le statut Stripe vers notre statut de paiement
  mapStripeStatusToPaymentStatus(stripeStatus) {
    const statusMap = {
      'requires_payment_method': 'pending',
      'requires_confirmation': 'pending',
      'requires_action': 'pending',
      'processing': 'processing',
      'requires_capture': 'processing',
      'succeeded': 'succeeded',
      'canceled': 'canceled'
    };

    return statusMap[stripeStatus] || 'pending';
  }

  async saveUserPaymentMethodFromIntent(payment, paymentIntentEventObject) {
    if (!payment?.userId) return;

    try {
      const piId = paymentIntentEventObject?.id;
      if (!piId) return;

      const paymentIntent = await this.stripe.paymentIntents.retrieve(piId, {
        expand: ['latest_charge.payment_method', 'payment_method']
      });

      const pmRef = paymentIntent.payment_method || paymentIntent?.latest_charge?.payment_method;
      const paymentMethodId = typeof pmRef === 'string' ? pmRef : pmRef?.id || null;

      const latestCharge =
        typeof paymentIntent.latest_charge === 'object' ? paymentIntent.latest_charge : null;

      const customerId =
        (typeof paymentIntent.customer === 'string'
          ? paymentIntent.customer
          : paymentIntent.customer?.id) ||
        (typeof latestCharge?.customer === 'string'
          ? latestCharge.customer
          : latestCharge?.customer?.id) ||
        null;

      const card =
        (typeof pmRef === 'object' && pmRef?.card) ||
        latestCharge?.payment_method_details?.card ||
        null;

      if (!paymentMethodId) return;

      const brandUp = card?.brand ? String(card.brand).replace(/_/g, ' ').toUpperCase() : '';
      const labelParts = ['Carte bancaire'];
      if (brandUp) labelParts.push(brandUp);
      if (card?.last4) labelParts.push(`···· ${card.last4}`);
      await this.paymentRepository.mergeMetadataById(payment.id, {
        paymentMethodType: 'card',
        paymentMethodLabel: labelParts.join(' · '),
        cardBrand: card?.brand || null,
        cardLast4: card?.last4 || null
      });

      const exists = await this.paymentMethodRepository.findByUserIdAndStripePaymentMethodId(
        payment.userId,
        paymentMethodId
      );
      if (exists) return;

      await this.paymentMethodRepository.create({
        userId: payment.userId,
        stripeCustomerId: customerId || null,
        stripePaymentMethodId: paymentMethodId,
        type: 'card',
        isDefault: false,
        last4: card?.last4 || null,
        brand: card?.brand || null,
        expiryMonth: card?.exp_month || null,
        expiryYear: card?.exp_year || null
      });
    } catch (error) {
      console.warn('⚠️ Could not save payment method from Stripe:', error.message);
    }
  }

  async sendOrderConfirmationEmail(order, userId) {
    if (!order || !userId) return;
    try {
      const user = await this.userRepository.findById(userId);
      if (!user?.email) return;
      await this.emailService.sendOrderConfirmation(
        user.email,
        user.first_name || user.firstName || '',
        order.orderNumber,
        order.total
      );
    } catch (error) {
      console.warn('⚠️ Could not send order confirmation email:', error.message);
    }
  }

  // Récupérer le statut d'un paiement
  async getPaymentStatus(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      const payment = await this.paymentRepository.findByPaymentIntentId(paymentIntentId);

      return {
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency
        },
        payment: payment
      };
    } catch (error) {
      console.error('❌ Error retrieving payment status:', error.message);
      throw error;
    }
  }

  /**
   * Finalisation côté serveur sans webhook (utile en dev local).
   * Idempotent grâce à la vérification findByPaymentId dans createOrderFromPayment.
   */
  async finalizePaymentIntent(paymentIntentId) {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    if (!paymentIntent) {
      throw new Error('PaymentIntent introuvable');
    }

    const syntheticEvent = {
      type:
        paymentIntent.status === 'succeeded'
          ? 'payment_intent.succeeded'
          : paymentIntent.status === 'canceled'
            ? 'payment_intent.canceled'
            : paymentIntent.status === 'processing'
              ? 'payment_intent.processing'
              : paymentIntent.status === 'requires_payment_method'
                ? 'payment_intent.payment_failed'
                : 'payment_intent.processing',
      data: { object: paymentIntent }
    };

    const result = await this.handleWebhookEvent(syntheticEvent);
    return {
      paymentIntentId,
      stripeStatus: paymentIntent.status,
      processed: result?.processed === true,
      eventType: result?.eventType || syntheticEvent.type
    };
  }
}

