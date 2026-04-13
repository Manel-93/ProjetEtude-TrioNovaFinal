import dotenv from 'dotenv';
import { getMySQLConnection } from '../config/database.js';

dotenv.config();

async function checkOrders() {
  try {
    const pool = await getMySQLConnection();
    
    console.log('📊 Vérification des données...\n');
    
    // Vérifier les paiements
    const [payments] = await pool.execute(
      'SELECT id, user_id, cart_id, stripe_payment_intent_id, status, amount, created_at FROM payments ORDER BY created_at DESC LIMIT 10'
    );
    
    console.log(`💳 Paiements trouvés : ${payments.length}`);
    payments.forEach(p => {
      console.log(`  - Payment ID: ${p.id}, User: ${p.user_id}, Status: ${p.status}, Amount: ${p.amount}€`);
    });
    
    // Vérifier les commandes
    const [orders] = await pool.execute(
      'SELECT id, order_number, user_id, payment_id, status, total, created_at FROM orders ORDER BY created_at DESC LIMIT 10'
    );
    
    console.log(`\n📦 Commandes trouvées : ${orders.length}`);
    orders.forEach(o => {
      console.log(`  - Order: ${o.order_number}, User: ${o.user_id}, Payment: ${o.payment_id}, Status: ${o.status}, Total: ${o.total}€`);
    });
    
    // Vérifier les paiements sans commande
    const [paymentsWithoutOrder] = await pool.execute(
      `SELECT p.id, p.user_id, p.status, p.stripe_payment_intent_id, p.amount 
       FROM payments p 
       LEFT JOIN orders o ON p.id = o.payment_id 
       WHERE o.id IS NULL AND p.status = 'succeeded'
       ORDER BY p.created_at DESC`
    );
    
    console.log(`\n⚠️  Paiements réussis sans commande : ${paymentsWithoutOrder.length}`);
    paymentsWithoutOrder.forEach(p => {
      console.log(`  - Payment ID: ${p.id}, User: ${p.user_id}, Intent: ${p.stripe_payment_intent_id}, Amount: ${p.amount}€`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkOrders();

