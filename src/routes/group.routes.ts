import { Router } from 'express';
import {
  createGroup,
  joinGroup,
  listUserGroups,
  renameGroup,
  deleteGroup,
  removeMember,
  getGroupBalances,
  getGroupSettlements,
  createSettlement,
} from '../controllers/group.controller';
import {
  validateCreateGroup,
  validateJoinGroup,
  validateRenameGroup,
  validateGroupId,
  validateMemberId,
  validateCreateSettlement,
} from '../validators/group.validator';
import { authenticate } from '../middleware/auth';

const router = Router();

// Protect all group routes using the authentication middleware
router.use(authenticate);

router.post('/', validateCreateGroup, createGroup);
router.post('/join', validateJoinGroup, joinGroup);
router.get('/', listUserGroups);
router.patch('/:groupId', validateGroupId, validateRenameGroup, renameGroup);
router.delete('/:groupId', validateGroupId, deleteGroup);
router.delete('/:groupId/members/:memberId', validateGroupId, validateMemberId, removeMember);
router.get('/:groupId/balances', validateGroupId, getGroupBalances);
router.get('/:groupId/settlement-path', validateGroupId, getGroupSettlements);
router.post('/:groupId/settlements', validateGroupId, validateCreateSettlement, createSettlement);

export default router;
