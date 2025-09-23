import { Router } from 'express';
import { AnalyticsController } from '@/controllers/analyticsController';
import { authMiddleware } from '@/middleware/auth';

const router = Router();
const analyticsController = new AnalyticsController();

router.use(authMiddleware);

router.get('/monthly-revenue', analyticsController.getMonthlyRevenue.bind(analyticsController));
router.get('/equipment-utilization', analyticsController.getEquipmentUtilization.bind(analyticsController));
router.get('/financial-summary', analyticsController.getFinancialSummary.bind(analyticsController));

export default router;