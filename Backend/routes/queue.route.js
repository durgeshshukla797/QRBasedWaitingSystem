import { Router } from 'express';
import { getQueueQr,deleteQueue,updateQueue } from '../controllers/queue.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { listEntries,setQueueStatus,completeEntry,skipEntry,markNoShow,callNext } from '../controllers/queueActions.controller.js';
import { queueStatusSchema,updateQueueSchema} from '../validator/queue.validator.js';
import { validate } from '../middlewares/validate.middleware.js';


const router = Router();
router.use(requireAuth);

router.get('/:queueId/qr', getQueueQr);
router.delete('/:queueId', deleteQueue);


router.get('/:queueId/entries', listEntries);
router.post('/:queueId/next', callNext);
router.post('/:queueId/entries/:entryId/complete', completeEntry);
router.post('/:queueId/entries/:entryId/skip', skipEntry);
router.patch('/:queueId/status', validate(queueStatusSchema), setQueueStatus);

router.patch('/:queueId', validate(updateQueueSchema), updateQueue);
router.post('/:queueId/entries/:entryId/no-show', markNoShow);
export default router;