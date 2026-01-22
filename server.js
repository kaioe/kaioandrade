import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import bodyParser from 'body-parser';
import { google } from 'googleapis';
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
console.log(`Client ID: ${process.env.CLIENT_ID ? process.env.CLIENT_ID.substring(0, 15) + '...' : 'MISSING'}`);
console.log(`Redirect URI: http://localhost:${PORT}/auth/callback`);
console.log('-----------------------------\n');

// Email configuration
// Email configuration
const getEmailConfig = () => {
  const baseConfig = {
    service: 'gmail',
  };

  const hasRefreshToken = !!process.env.REFRESH_TOKEN;
  const hasClientId = !!process.env.CLIENT_ID;
  const hasClientSecret = !!process.env.CLIENT_SECRET;

  if (hasRefreshToken && hasClientId && hasClientSecret) {
    console.log('📧 Using OAuth2 (Token Present)');
    return {
      ...baseConfig,
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
      },
    };
  }

  console.log('📧 Using Password/App Password (OAuth2 params missing)');
  console.log(`   - Refresh Token: ${hasRefreshToken ? 'OK' : 'MISSING'}`);
  console.log(`   - Client ID: ${hasClientId ? 'OK' : 'MISSING'}`);
  console.log(`   - Client Secret: ${hasClientSecret ? 'OK' : 'MISSING'}`);

  return {
    ...baseConfig,
    auth: {
      user: process.env.GMAIL_USER || 'your-email@gmail.com',
      pass: process.env.GMAIL_PASSWORD || 'your-app-password',
    },
  };
};

// Global transporter var for reuse, but we'll update it if needed or just recreate it lightly.
// For robustness, we will create a fresh one for the verify step on startup.
const createTransporter = () => nodemailer.createTransport(getEmailConfig());

let transporter = createTransporter();

// Test the connection
transporter.verify((error, success) => {
  if (error) {
    // Determine if this is likely due to missing OAuth setup
    if (!process.env.REFRESH_TOKEN && !process.env.GMAIL_PASSWORD) {
        console.log('\n⚠️  Email configuration not complete (Expected).');
        console.log('👉 Please visit http://localhost:3000/auth/login to authenticate with Google.\n');
    } else {
        // Only log full error if we expected it to work
        console.warn('⚠️  SMTP Connection Warning:', error.message);
        if (!process.env.REFRESH_TOKEN) {
            console.log('👉 You may need to authenticate: http://localhost:3000/auth/login');
        }
    }
  } else {
    console.log('✅ SMTP server is ready to take our messages');
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

    // Get current config
    const currentConfig = getEmailConfig();

    if (currentConfig.auth.type === 'OAuth2') {
        try {
            console.log('🔄 Refreshing Access Token manually...');
            const oauth2Client = new google.auth.OAuth2(
                currentConfig.auth.clientId,
                currentConfig.auth.clientSecret,
                `http://localhost:${PORT}/auth/callback`
            );
            oauth2Client.setCredentials({
                refresh_token: currentConfig.auth.refreshToken
            });
            const { token } = await oauth2Client.getAccessToken();
            if (!token) throw new Error('Failed to retrieve access token');

            console.log('✅ Access Token refreshed successfully');
            currentConfig.auth.accessToken = token;
        } catch (err) {
            console.error('❌ Failed to refresh token manually:', err.message);
            throw new Error(`OAuth Token Error: ${err.message}`);
        }
    }

    // Re-create transporter
    const requestTransporter = nodemailer.createTransport(currentConfig);

    // Email content
    const mailOptions = {
      from: `"Contact Form" <${currentConfig.auth.user}>`,
      to: 'kaioed@gmail.com',
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
    const info = await requestTransporter.sendMail(mailOptions);

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

// Root endpoint for OAuth callback (if configured as redirect URI)
// Initiates the OAuth flow
app.get('/auth/login', (req, res) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    `http://localhost:${PORT}/auth/callback`
  );

  const scopes = [
    'https://mail.google.com/', // Full access (required for some SMTP connections)
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent prompt to ensure we get a refresh token
    include_granted_scopes: true
  });

  res.redirect(authUrl);
});

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Email Server</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .btn { display: inline-block; padding: 10px 20px; background: #4285f4; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>Email Server Running</h1>
        <p>To configure OAuth, click the button below:</p>
        <a href="/auth/login" class="btn">Authorize with Google</a>
      </body>
    </html>
  `);
});

// OAuth2 callback endpoint
app.get('/auth/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send('Authorization code not provided');
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      `http://localhost:${PORT}/auth/callback`
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user email
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });
    const { data: { email } } = await oauth2.userinfo.get();

    console.log('✅ OAuth tokens obtained successfully!');
    console.log('📧 Authenticated as:', email);
    console.log('🔑 Access Token:', tokens.access_token);
    console.log('🔄 Refresh Token:', tokens.refresh_token);
    console.log('⏱️ Expires in:', tokens.expiry_date);

    // Update .env file with refresh token and email
    const fs = await import('fs');
    const envContent = fs.readFileSync('.env', 'utf8');

    // Update or add GMAIL_USER
    let updatedEnv = envContent;
    if (updatedEnv.includes('GMAIL_USER=')) {
        updatedEnv = updatedEnv.replace(/GMAIL_USER=.*/, `GMAIL_USER=${email}`);
    } else {
        // Ensure newline if needed
        if (!updatedEnv.endsWith('\n')) updatedEnv += '\n';
        updatedEnv += `GMAIL_USER=${email}`;
    }

    // Update or add GMAIL_PASSWORD marker
    if (updatedEnv.includes('GMAIL_PASSWORD=')) {
        updatedEnv = updatedEnv.replace(/GMAIL_PASSWORD=.*/, 'GMAIL_PASSWORD=OAuth2_Enabled');
    } else {
        if (!updatedEnv.endsWith('\n')) updatedEnv += '\n';
        updatedEnv += 'GMAIL_PASSWORD=OAuth2_Enabled';
    }

    // Update or add REFRESH_TOKEN
    if (updatedEnv.includes('REFRESH_TOKEN=')) {
        updatedEnv = updatedEnv.replace(/REFRESH_TOKEN=.*/, `REFRESH_TOKEN=${tokens.refresh_token}`);
    } else {
        if (!updatedEnv.endsWith('\n')) updatedEnv += '\n';
        updatedEnv += `REFRESH_TOKEN=${tokens.refresh_token}`;
    }

    fs.writeFileSync('.env', updatedEnv);
    console.log('📝 .env file updated with REFRESH_TOKEN and GMAIL_USER');

    // Update process.env and recreate transporter immediately
    process.env.REFRESH_TOKEN = tokens.refresh_token;
    process.env.GMAIL_USER = email;
    process.env.GMAIL_PASSWORD = 'OAuth2_Enabled'; // Marker
    transporter = nodemailer.createTransport(getEmailConfig());
    console.log('🔄 Transporter re-initialized with new OAuth tokens');

    // Send success response
    res.send(`
      <html>
        <head>
          <title>OAuth Success</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: green; }
          </style>
        </head>
        <body>
          <h1 class="success">✅ OAuth Authentication Successful!</h1>
          <p>Your Google OAuth tokens have been obtained and saved.</p>
          <p>You can now close this window and use OAuth2 authentication in your email server.</p>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    res.status(500).send(`
      <html>
        <head>
          <title>OAuth Error</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: red; }
          </style>
        </head>
        <body>
          <h1 class="error">❌ OAuth Authentication Failed</h1>
          <p>Error: ${error.message}</p>
        </body>
      </html>
    `);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Email server running on port ${PORT}`);
  console.log(`Contact form endpoint: POST http://localhost:${PORT}/api/send-email`);
});
