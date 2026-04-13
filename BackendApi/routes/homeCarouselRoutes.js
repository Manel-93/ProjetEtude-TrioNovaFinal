import express from 'express';
import { HomeCarouselController } from '../controllers/homeCarouselController.js';

const router = express.Router();
const controller = new HomeCarouselController();

/**
 * @swagger
 * /home-carousel:
 *   get:
 *     summary: Diapositives du carrousel d'accueil (vitrine)
 *     tags: [Carrousel]
 *     responses:
 *       200:
 *         description: Liste des diapositives actives enrichies
 */
router.get('/', controller.getPublicSlides);

export default router;
