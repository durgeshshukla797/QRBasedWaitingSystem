import {Router} from 'express';
import {validate} from '../middlewares/validate.middleware.js';
import {requireAuth} from '../middlewares/auth.middleware.js';
import { createQueueSchema } from '../validator/queue.validator.js';
import { createShop, getMyShops, deleteShop, updateShop } from '../controllers/shop.controller.js';
import { createQueue, getShopQueues } from '../controllers/queue.controller.js';
import { createShopSchema, updateShopSchema } from '../validator/shop.validator.js';



const router =Router();
router.use(requireAuth);//every route below needs a logged-in merchant

router.post('/',validate(createShopSchema),createShop);
router.get('/',getMyShops);
router.delete('/:shopId', deleteShop);

router.post('/:shopId/queues',validate(createQueueSchema),createQueue);
router.get('/:shopId/queues', getShopQueues);

router.patch('/:shopId', validate(updateShopSchema), updateShop);

export default router;