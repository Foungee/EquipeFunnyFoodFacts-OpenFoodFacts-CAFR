import { Router } from 'express';
import { getCategories } from '../controllers/produitsController.mjs';

const router = Router();

router.get('/', getCategories);

export default router;