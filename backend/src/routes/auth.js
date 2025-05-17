import express    from 'express';
import bcrypt     from 'bcryptjs';
import jwt        from 'jsonwebtoken';
import crypto     from 'crypto';
import nodemailer from 'nodemailer';
import dotenv     from 'dotenv';
import User       from '../models/User.js';

dotenv.config();
const router = express.Router();

// Configure transporter…
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: { rejectUnauthorized: false }
});

// 1) send code
router.post('/send-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    let user = await User.findOne({ email });
    if (!user) user = new User({ email, verificationCode: code });
    else {
      user.verificationCode = code;
      user.emailVerified = false;
    }
    await user.save();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to:   email,
      subject: 'Grave Path Code',
      text: `Your code is ${code}`
    });
    res.json({ msg: 'Code sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to send code' });
  }
});

// 2) verify code
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (user?.verificationCode === code) {
      user.emailVerified = true;
      user.verificationCode = undefined;
      await user.save();
      return res.json({ msg: 'Verified', verified: true });
    }
    res.status(400).json({ msg: 'Invalid code', verified: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// 3) register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    if (role === 'client') {
      const found = await User.findOne({ email });
      if (!found?.emailVerified) {
        return res.status(400).json({ msg: 'Please verify email first.' });
      }
      found.firstName = firstName;
      found.lastName  = lastName;
      found.role      = 'client';
      found.password  = await bcrypt.hash(password, 12);
      await found.save();
      return res.status(201).json({ msg: 'Client registered.' });
    }
    // staff/admin flow
    const hash = await bcrypt.hash(password, 12);
    await User.create({ firstName, lastName, email, password: hash, role });
    res.status(201).json({ msg: `${role} registered.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// 4) login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
