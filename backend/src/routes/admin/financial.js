import express from 'express';
import Reservation from '../../models/Reservation.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    // Only include paid/confirmed reservations
    const reservations = await Reservation.find({ 'payment.status': 'paid' });
    const records = reservations.map(r => ({
      _id: r._id,
      date: r.date,
      description: `Reservation by ${r.clientName} (${r.payment.method})`,
      amount: r.payment.amount
    }));
    res.json(records);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch financial report', error: err.message });
  }
});

export default router;



