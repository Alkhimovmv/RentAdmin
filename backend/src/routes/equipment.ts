import { Router } from 'express';
import { EquipmentController } from '@/controllers/equipmentController';
import { authMiddleware } from '@/middleware/auth';

const router = Router();
const equipmentController = new EquipmentController();

router.use(authMiddleware);

router.get('/', equipmentController.getAll.bind(equipmentController));
router.get('/for-rental', equipmentController.getForRental.bind(equipmentController));
router.get('/:id', equipmentController.getById.bind(equipmentController));
router.post('/', equipmentController.create.bind(equipmentController));
router.put('/:id', equipmentController.update.bind(equipmentController));
router.delete('/:id', equipmentController.delete.bind(equipmentController));

export default router;