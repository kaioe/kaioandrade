/**
 * Cloudways Serverless Function for Email Sending
 *
 * This function handles contact form submissions and sends emails via Gmail SMTP.
 * Designed to work with Cloudways serverless functions.
 */

import nodemailer from 'nodemailer';

// Email configuration - use environment variables in production
const emailConfig = {
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

/**
 * Cloudways Serverless Function Handler
 * @param {Object} context - Cloudways function context
 * @param {Object} context.body - Request body
 * @param {Object} context.query - Query parameters
 * @param {Object} context.headers - Request headers
 * @returns {Object} Response object
 */
export async function handler(context) {
  try {
    // Parse request body
    const { name, email, mobile, message } = context.body || {};

    // Validate required fields
    if (!name || !email || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      };
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Invalid email format'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      };
    }

    // Email content
    const mailOptions = {
      from: `"Contact Form" <${emailConfig.auth.user}>`,
      to: emailConfig.auth.user, // Send to yourself
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

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        messageId: info.messageId
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    };

  } catch (error) {
    console.error('Error sending email:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Failed to send email',
        details: error.message
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
}

/**
 * Local testing function for development
 */
async function testLocal() {
  const mockContext = {
    body: {
      name: 'Test User',
      email: 'test@example.com',
      mobile: '+1234567890',
      message: 'This is a test message for local development.'
    }
  };

  const result = await handler(mockContext);
  console.log('Local test result:', result);
}

// Run local test if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testLocal().catch(console.error);
}
