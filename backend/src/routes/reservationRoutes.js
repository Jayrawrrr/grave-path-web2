import express from 'express';
import multer from 'multer';
import path from 'path';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { protect } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import Reservation from '../models/Reservation.js';

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/proofs/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'proof-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Create reservation with file upload - allow both client and staff roles
router.post('/create', protect(['client', 'staff']), upload.single('proofImage'), async (req, res) => {
  try {
    console.log('Received reservation request:', req.body);
    console.log('File:', req.file);
    console.log('User from token:', req.user);

    const {
      lotId,
      sqm,
      location,
      clientName,
      clientContact,
      paymentMethod,
      paymentAmount,
      totalPrice
    } = req.body;

    // Only require proof for client reservations
    if (req.user.role === 'client' && !req.file) {
      return res.status(400).json({ message: 'Payment proof is required for client reservations' });
    }

    // Create the reservation object
    const reservationData = {
      lotId,
      clientId: req.user.id,
      sqm,
      location,
      clientName,
      clientContact,
      paymentMethod,
      paymentAmount,
      totalPrice,
      status: req.user.role === 'staff' ? 'approved' : 'pending' // Auto-approve staff reservations
    };

    // Add proof image path if file was uploaded
    if (req.file) {
      reservationData.proofImage = req.file.path.replace(/\\/g, '/');
    }

    // If the user is staff, add their ID as staffId
    if (req.user.role === 'staff') {
      reservationData.staffId = req.user.id;
    }

    const reservation = new Reservation(reservationData);
    await reservation.save();
    console.log('Reservation saved:', reservation);

    // Send confirmation email for client reservations
    if (req.user.role === 'client') {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        console.log('Sending email to:', clientContact);

        const mailOptions = {
          from: process.env.EMAIL_FROM,
          to: clientContact,
          subject: 'Grave Path Reservation Confirmation',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2c3e50; text-align: center;">Reservation Confirmation</h2>
              
              <p>Dear ${clientName},</p>
              
              <p>Thank you for your reservation at Grave Path. Here are your reservation details:</p>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Lot ID:</strong> ${lotId}</p>
                <p><strong>Location:</strong> ${location}</p>
                <p><strong>Square Meters:</strong> ${sqm}</p>
                <p><strong>Total Price:</strong> ₱${Number(totalPrice).toLocaleString()}</p>
                <p><strong>Reservation Fee (10%):</strong> ₱${Number(paymentAmount).toLocaleString()}</p>
              </div>

              <h3 style="color: #2c3e50;">Terms of Reservation:</h3>
              <ul style="line-height: 1.6;">
                <li>Your reservation is currently pending approval from our administration.</li>
                <li>The 10% reservation fee is non-refundable once the reservation is approved.</li>
                <li>You will receive another email once your reservation has been approved or if additional information is needed.</li>
                <li>Please complete the full payment within 30 days after reservation approval.</li>
                <li>Failure to complete the payment may result in cancellation of the reservation.</li>
              </ul>

              <p style="background: #e8f4ff; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
                <strong>Next Steps:</strong><br>
                Please wait for our approval email. We will process your reservation within 2-3 business days.
              </p>

              <p>If you have any questions, please don't hesitate to contact us.</p>
              
              <p>Best regards,<br>Grave Path Team</p>
            </div>
          `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Confirmation email sent successfully:', info.response);
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(201).json({
      message: 'Reservation created successfully',
      reservation
    });
  } catch (error) {
    console.error('Reservation error:', error);
    res.status(500).json({
      message: 'Error creating reservation',
      error: error.message
    });
  }
});

// Get all reservations - allow admin to see all
router.get('/', protect(['client', 'staff', 'admin']), async (req, res) => {
  try {
    let query = {};
    
    // If client role, only show their reservations
    if (req.user.role === 'client') {
      query.clientId = req.user.id;
    }
    // If staff role, only show reservations they created
    else if (req.user.role === 'staff') {
      query.staffId = req.user.id;
    }
    // Admin sees all reservations
    
    console.log('Fetching reservations with query:', query);
    const reservations = await Reservation.find(query).sort({ createdAt: -1 });
    console.log(`Found ${reservations.length} reservations`);
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get reservation by ID - allow both client and staff roles
router.get('/:id', protect(['client', 'staff']), async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update reservation status - allow both staff and admin
router.patch('/:id/status', protect(['staff', 'admin']), async (req, res) => {
  try {
    const { status, sendEmail } = req.body;
    const reservation = await Reservation.findById(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    reservation.status = status;
    await reservation.save();

    // Send status update email if requested or if status is approved
    if (sendEmail || status === 'approved') {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        const mailOptions = {
          from: process.env.EMAIL_FROM,
          to: reservation.clientContact,
          subject: `Grave Path Reservation ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2c3e50; text-align: center;">Reservation ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
              
              <p>Dear ${reservation.clientName},</p>
              
              <p>Your reservation has been ${status}. Here are your reservation details:</p>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Lot ID:</strong> ${reservation.lotId}</p>
                <p><strong>Location:</strong> ${reservation.location}</p>
                <p><strong>Total Price:</strong> ₱${Number(reservation.totalPrice).toLocaleString()}</p>
                <p><strong>Status:</strong> ${status.toUpperCase()}</p>
              </div>

              ${status === 'approved' ? `
                <p style="background: #e8f4ff; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
                  <strong>Next Steps:</strong><br>
                  Please complete the full payment within 30 days to finalize your reservation.
                </p>
              ` : ''}

              <p>If you have any questions, please don't hesitate to contact us.</p>
              
              <p>Best regards,<br>Grave Path Team</p>
            </div>
          `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Status update email sent successfully:', info.response);
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json(reservation);
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router; 