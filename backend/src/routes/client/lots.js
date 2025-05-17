import express     from 'express';
import Lot         from '../../models/Lot.js';
import { protect } from '../../middleware/auth.js';

const router = express.Router();

// must be logged in as client, staff or admin
router.use(protect(['client','staff','admin']));

router.get('/', async (req, res) => {
  try {
    const lots = await Lot.find();
    res.json(lots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
