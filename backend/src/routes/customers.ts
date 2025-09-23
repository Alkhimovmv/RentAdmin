import { Router } from 'express';
import { CustomerController } from '@/controllers/customerController';
import { authMiddleware } from '@/middleware/auth';

const router = Router();
const customerController = new CustomerController();

router.use(authMiddleware);

router.get('/', customerController.getAll.bind(customerController));
router.get('/:phone/rentals', customerController.getCustomerRentals.bind(customerController));

export default router;