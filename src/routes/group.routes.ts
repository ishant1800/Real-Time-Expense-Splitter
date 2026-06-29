import { Router } from 'express';
import {
  createGroup,
  joinGroup,
  listUserGroups,
  renameGroup,
  deleteGroup,
  removeMember,
  getGroupBalances,
  getGroupSettlementPath,
  getGroupSettlements,
  createSettlement,
  getGroupById,
} from '../controllers/group.controller';
import {
  createGroupSchema,
  joinGroupSchema,
  renameGroupSchema,
  createSettlementSchema,
  validateGroupId,
  validateMemberId,
} from '../validators/group.validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Protect all group routes using the authentication middleware
router.use(authenticate);

router.post('/', validate(createGroupSchema), createGroup);
router.post('/join', validate(joinGroupSchema), joinGroup);
router.get('/', listUserGroups);
router.get('/:groupId', validateGroupId, getGroupById);
router.patch('/:groupId', validateGroupId, validate(renameGroupSchema), renameGroup);
router.delete('/:groupId', validateGroupId, deleteGroup);
router.delete('/:groupId/members/:memberId', validateGroupId, validateMemberId, removeMember);
router.get('/:groupId/balances', validateGroupId, getGroupBalances);
router.get('/:groupId/settlement-path', validateGroupId, getGroupSettlementPath);
router.get('/:groupId/settlements', validateGroupId, getGroupSettlements);
router.post('/:groupId/settlements', validateGroupId, validate(createSettlementSchema), createSettlement);

export default router;
