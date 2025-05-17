import express     from 'express';
import Lot         from '../../models/Lot.js';
import { protect } from '../../middleware/auth.js';

const router = express.Router();

// must be staff or admin
router.use(protect(['staff','admin']));

router.get('/', async (req, res) => {
  try {
    const lots = await Lot.find();
    res.json(lots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const lot = await Lot.create(req.body);
    res.status(201).json(lot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const lot = await Lot.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lot) return res.status(404).json({ msg: 'Not found' });
    res.json(lot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const lot = await Lot.findByIdAndDelete(req.params.id);
    if (!lot) return res.status(404).json({ msg: 'Not found' });
    res.json({ msg: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
