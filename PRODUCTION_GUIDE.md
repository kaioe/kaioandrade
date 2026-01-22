# Production Deployment Guide

This project consists of two parts:
1.  **Frontend**: A Vite/React application.
2.  **Backend**: A Node.js Express server (for email).

To deploy this to production, you cannot simply use `npm run dev`. You need to deploy them separately (recommended) or use a platform that supports both.

## Part 1: Deploying the Backend (Email Server)

The backend needs to run continuously. Services like **Render**, **Railway**, or **Heroku** are perfect for this.

### Steps for Render (Free Tier available)
1.  Push your code to GitHub.
2.  Create a new **Web Service** on Render connected to your repo.
3.  **Build Command**: `npm install`
4.  **Start Command**: `node server.js`
5.  **Environment Variables**:
    You MUST add the following variables in the Render dashboard:
    *   `EMAIL_SERVICE`: `smtp.gmail.com`
    *   `GMAIL_USER`: `dev@kaioandrade.com` (or your email)
    *   `CLIENT_ID`: (From your .env)
    *   `CLIENT_SECRET`: (From your .env)
    *   `REFRESH_TOKEN`: (From your .env - this is CRITICAL. Use the one you generated locally)
    *   `GMAIL_PASSWORD`: `OAuth2_Enabled`

**Important**: The `REFRESH_TOKEN` must be valid. Since we generated it locally with the `mail.google.com` scope, it should work indefinitely unless revoked.

## Part 2: Deploying the Frontend

The frontend is a static site. Services like **Vercel** or **Netlify** are best.

### Steps for Vercel
1.  Import your GitHub repo into Vercel.
2.  **Framework Preset**: Vite
3.  **Build Command**: `npm run build`
4.  **Output Directory**: `dist`
5.  **Environment Variables**:
    *   `VITE_EMAIL_API_ENDPOINT`: The URL of your deployed Backend (e.g., `https://kaio-email-server.onrender.com/api/send-email`)

## Summary
1.  Deploy Backend -> Get URL.
2.  Deploy Frontend -> Set `VITE_EMAIL_API_ENDPOINT` to that Backend URL.
