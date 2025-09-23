import { Router } from 'express';
import { RentalController } from '@/controllers/rentalController';
import { authMiddleware } from '@/middleware/auth';

const router = Router();
const rentalController = new RentalController();

router.use(authMiddleware);

router.get('/', rentalController.getAll.bind(rentalController));
router.get('/gantt', rentalController.getGanttData.bind(rentalController));
router.get('/:id', rentalController.getById.bind(rentalController));
router.post('/', rentalController.create.bind(rentalController));
router.put('/:id', rentalController.update.bind(rentalController));
router.delete('/:id', rentalController.delete.bind(rentalController));

export default router;