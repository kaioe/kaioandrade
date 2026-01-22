# Production Deployment Guide (SendGrid + Cloudways)

This project has been migrated to use **SendGrid** for reliable email delivery.

## Local Development
1.  Add your `SENDGRID_API_KEY` to the `.env` file.
2.  Ensure `CONTACT_EMAIL` in `.env` matches a **Verified Sender Identity** in your SendGrid dashboard.
3.  Run `npm run start:dev` to start the frontend and local email server.

## Production (Cloudways)
The production environment uses the Cloudways **SMTP Add-on** configured with your SendGrid credentials.

### 1. Cloudways Setup
1.  Log in to Cloudways Console.
2.  Go to **Server Management** -> **SMTP**.
3.  Select **External SMTP**.
4.  Choose **SendGrid** from the dropdown.
5.  Enter your SendGrid API Key (use `apikey` as username).
6.  **Important**: Send a test email from the Cloudways console to verify the server is authenticated.

### 2. GitHub Actions Deployment
The deployment workflow (`.github/workflows/deploy.yml`) is already configured to:
1.  Build the React app.
2.  Inject the `config.php` (using the `GMAIL_USER` secret for the target email).
3.  Deploy both the site and the PHP API to your Cloudways server.

### 3. Verification
- **Local**: Use the "Contact Me" form on `localhost:5173`. Check your terminal for `✅ Connected to SendGrid SMTP`.
- **Production**: Use the form on `kaioandrade.com`. The PHP script will use the Cloudways SMTP relay to send the email via SendGrid.

## Troubleshooting
- **No Email Received**: Check your **SendGrid Activity Feed**. If it shows "Dropped", it's likely because your "From" address (in `send-email.php` or `server.js`) isn't verified in SendGrid.
- **500 Error**: Check the PHP error logs in Cloudways. Ensure the SMTP add-on is active.
