import { Router } from 'express';
import { ExpenseController } from '@/controllers/expenseController';
import { authMiddleware } from '@/middleware/auth';

const router = Router();
const expenseController = new ExpenseController();

router.use(authMiddleware);

router.get('/', expenseController.getAll.bind(expenseController));
router.get('/:id', expenseController.getById.bind(expenseController));
router.post('/', expenseController.create.bind(expenseController));
router.put('/:id', expenseController.update.bind(expenseController));
router.delete('/:id', expenseController.delete.bind(expenseController));

export default router;