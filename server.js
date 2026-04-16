import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Debug Configuration
console.log('\n🔍 --- Configuration Check ---');
console.log(`Port: ${PORT}`);
console.log(`Email Service: Brevo SMTP`);
console.log('-----------------------------\n');

// Email configuration
const getEmailConfig = () => {
  if (!process.env.BREVO_SMTP_KEY) {
    console.warn('⚠️  BREVO_SMTP_KEY is missing in .env');
  }

  return {
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // TLS
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_KEY
    }
  };
};

// Create transporter
const createTransporter = () => nodemailer.createTransport(getEmailConfig());
let transporter = createTransporter();

// Test the connection
transporter.verify((error, success) => {
  if (error) {
    console.warn('⚠️  SMTP Connection Warning:', error.message);
    console.log('👉 Make sure BREVO_SMTP_KEY and BREVO_SMTP_USER are valid and your Brevo account is active.');
  } else {
    console.log('✅ Connected to Brevo SMTP successfully');
  }
});

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { name, email, mobile, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Refresh transporter with current config (in case .env changed)
    const requestTransporter = nodemailer.createTransport(getEmailConfig());

    // Brevo requires a verified sender address
    const fromEmail = process.env.CONTACT_EMAIL || 'contact@kaioandrade.com';
    const toEmail = process.env.GMAIL_USER || 'kaioed@gmail.com';

    const mailOptions = {
      from: `"Contact Form" <${fromEmail}>`,
      to: toEmail,
      replyTo: email,
      subject: `Contact Request from ${name}, kaioandrade.com`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Contact Request</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${mobile ? `<p><strong>Mobile:</strong> ${mobile}</p>` : ''}
          <p><strong>Message:</strong></p>
          <p style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
            ${message.replace(/\n/g, '<br>')}
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            This email was sent via Brevo SMTP from your portfolio.
          </p>
        </div>
      `,
      text: `
        New Contact Request

        Name: ${name}
        Email: ${email}
        ${mobile ? `Mobile: ${mobile}\n` : ''}
        Message:
        ${message}
      `
    };

    const info = await requestTransporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);

    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      details: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.send('Email Server Running (Brevo SMTP Mode)');
});

app.listen(PORT, () => {
  console.log(`Email server running on port ${PORT}`);
});
