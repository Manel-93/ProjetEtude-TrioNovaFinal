import { HomeCarouselService } from '../services/homeCarouselService.js';

export class HomeCarouselController {
  constructor() {
    this.service = new HomeCarouselService();
  }

  getPublicSlides = async (req, res, next) => {
    try {
      const data = await this.service.getPublicSlides();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getAdminSlides = async (req, res, next) => {
    try {
      const data = await this.service.getAdminSlides();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  putAdminSlides = async (req, res, next) => {
    try {
      const { slides } = req.body;
      const data = await this.service.replaceAdminSlides(slides);
      res.status(200).json({
        success: true,
        data,
        message: 'Carrousel enregistré'
      });
    } catch (error) {
      next(error);
    }
  };
}
