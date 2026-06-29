import { Router } from 'express';
import {
  createExpense,
  updateExpense,
  deleteExpense,
  listGroupExpenses,
} from '../controllers/expense.controller';
import {
  createExpenseSchema,
  updateExpenseSchema,
  validateExpenseId,
} from '../validators/expense.validator';
import { validateGroupId } from '../validators/group.validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Protect all expense routes using the authentication middleware
router.use(authenticate);

router.post('/', validate(createExpenseSchema), createExpense);
router.put('/:expenseId', validateExpenseId, validate(updateExpenseSchema), updateExpense);
router.delete('/:expenseId', validateExpenseId, deleteExpense);
router.get('/group/:groupId', validateGroupId, listGroupExpenses);

export default router;
