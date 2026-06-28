import { Router } from 'express';
import {
  createExpense,
  updateExpense,
  deleteExpense,
  listGroupExpenses,
} from '../controllers/expense.controller';
import {
  validateCreateExpense,
  validateUpdateExpense,
  validateExpenseId,
} from '../validators/expense.validator';
import { validateGroupId } from '../validators/group.validator';
import { authenticate } from '../middleware/auth';

const router = Router();

// Protect all expense routes using the authentication middleware
router.use(authenticate);

router.post('/', validateCreateExpense, createExpense);
router.put('/:expenseId', validateExpenseId, validateUpdateExpense, updateExpense);
router.delete('/:expenseId', validateExpenseId, deleteExpense);
router.get('/group/:groupId', validateGroupId, listGroupExpenses);

export default router;
