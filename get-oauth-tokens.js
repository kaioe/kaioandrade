import { google } from 'googleapis';
import fs from 'fs';
import readline from 'readline';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/auth/callback';

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Generate auth URL
const scopes = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent',
  response_type: 'code',
  redirect_uri: REDIRECT_URI,
  include_granted_scopes: true
});

console.log('🔑 OAuth 2.0 Token Generator');
console.log('==========================');
console.log('1. Visit this URL in your browser:');
console.log(authUrl);
console.log('\n2. Sign in with your Google account');
console.log('3. Grant the requested permissions');
console.log('4. Copy the authorization code from the redirect URL');
console.log('5. Paste the code below and press Enter\n');

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('📝 Enter the authorization code: ', async (code) => {
  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log('\n✅ Tokens obtained successfully!');
    console.log('🔑 Access Token:', tokens.access_token);
    console.log('🔄 Refresh Token:', tokens.refresh_token);
    console.log('⏱️ Expires in:', tokens.expiry_date);

    // Update .env file
    const envContent = fs.readFileSync('.env', 'utf8');
    const updatedEnv = envContent
      .replace(/GMAIL_PASSWORD=.*/, 'GMAIL_PASSWORD=OAuth2_Enabled')
      .concat(`\nREFRESH_TOKEN=${tokens.refresh_token}`);

    fs.writeFileSync('.env', updatedEnv);
    console.log('\n📝 .env file updated with REFRESH_TOKEN');
    console.log('📄 You can now use OAuth2 authentication in your email server');

  } catch (error) {
    console.error('❌ Error obtaining tokens:', error.message);
  } finally {
    rl.close();
  }
});
