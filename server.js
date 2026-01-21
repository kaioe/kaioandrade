const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Email configuration - these should be in environment variables in production
const emailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'your-email@gmail.com',
    pass: process.env.GMAIL_PASSWORD || 'your-app-password'
  }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Test the connection
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to take our messages');
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

    // Email content
    const mailOptions = {
      from: `"Contact Form" <${emailConfig.auth.user}>`,
      to: emailConfig.auth.user, // Send to yourself
      subject: `New Contact Request from ${name}`,
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
            This email was sent from your portfolio contact form.
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

        This email was sent from your portfolio contact form.
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));

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

// Start server
app.listen(PORT, () => {
  console.log(`Email server running on port ${PORT}`);
  console.log(`Contact form endpoint: POST http://localhost:${PORT}/api/send-email`);
});
