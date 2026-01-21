# Email Setup Guide for Contact Form

This guide explains how to set up Gmail SMTP for the contact form in your portfolio.

## Prerequisites

1. A Gmail account
2. Node.js installed
3. Basic terminal/command line knowledge

## Setup Instructions

### 1. Install Dependencies

The required dependencies are already installed:
- `express` - Web server framework
- `nodemailer` - Email sending library
- `cors` - Cross-origin resource sharing middleware
- `body-parser` - Request body parsing middleware

### 2. Configure Gmail SMTP

To use Gmail SMTP, you need to:

#### Option A: Use App Password (Recommended)

1. **Enable 2-Factor Authentication** on your Google account:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Under "Signing in to Google", enable 2-Step Verification

2. **Generate an App Password**:
   - After enabling 2FA, go to "App Passwords"
   - Select "Mail" as the app and "Other" as the device
   - Name it "Portfolio Contact Form"
   - Copy the generated 16-character password

#### Option B: Use Less Secure Apps (Not Recommended)

⚠️ **Note:** Google has disabled this option for most accounts. Use App Password instead.

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-password-or-regular-password
```

**Important:** Never commit your `.env` file to version control. Add it to `.gitignore`.

### 4. Start the Email Server

Run the email server in a separate terminal:

```bash
node server.js
```

The server will start on port 3001 and you should see:
```
Email server running on port 3001
Contact form endpoint: POST http://localhost:3001/api/send-email
SMTP server is ready to take our messages
```

### 5. Start the Frontend Application

In another terminal, start your Vite development server:

```bash
npm run dev
```

### 6. Test the Contact Form

1. Open your portfolio in the browser (usually http://localhost:3000)
2. Fill out the contact form with valid information
3. Click "SEND MESSAGE"
4. You should see a success toast notification
5. Check your Gmail inbox for the contact request

## Troubleshooting

### Common Issues

**1. Authentication Failed**
- Make sure you're using the correct email and password
- If using 2FA, ensure you're using an App Password, not your regular password
- Check that "Less Secure Apps" is enabled if not using 2FA

**2. Connection Timeout**
- Check your internet connection
- Make sure the email server is running (`node server.js`)
- Verify the API endpoint URL in the contact form component

**3. CORS Errors**
- The server already has CORS enabled
- Make sure both frontend and backend are running on the same domain in production

**4. Emails Not Received**
- Check your spam folder
- Verify the email address in the `.env` file is correct
- Test with a different email provider

### Debugging

To see detailed logs, run the server with:

```bash
DEBUG=nodemailer node server.js
```

This will show SMTP communication details.

## Security Considerations

1. **Environment Variables**: Always use environment variables for sensitive data
2. **HTTPS**: Use HTTPS in production to encrypt form submissions
3. **Input Validation**: The form already validates input, but you can add more
4. **Rate Limiting**: Consider adding rate limiting to prevent spam
5. **CSRF Protection**: Add CSRF protection in production

## Production Deployment

For production, consider:

1. **Using a dedicated email service** like SendGrid, Mailgun, or AWS SES
2. **Setting up a proper backend** with authentication
3. **Using environment variables** in your hosting platform
4. **Adding monitoring** for email delivery failures
5. **Implementing a queue system** for high traffic

## Alternative Email Services

If you prefer not to use Gmail SMTP, you can modify the `server.js` to use other services:

### SendGrid Example

```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

### Mailgun Example

```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.mailgun.org',
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAILGUN_USER,
    pass: process.env.MAILGUN_PASSWORD
  }
});
```

## Support

If you need help with email setup, refer to:
- [Nodemailer Documentation](https://nodemailer.com/)
- [Google App Passwords Help](https://support.google.com/accounts/answer/185833)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
