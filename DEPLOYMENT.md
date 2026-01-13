# Production Deployment Guide

## What to Upload for Production

### Option 1: Build and Deploy (Traditional Hosting)

If you're deploying to a traditional hosting service (VPS, shared hosting, etc.):

#### Step 1: Build the Project

```bash
npm run build
```

This creates a `.next` folder with the optimized production build.

#### Step 2: Upload These Files/Folders

**Required:**
- `.next/` - The built application (created by `npm run build`)
- `public/` - Static assets (if you have any)
- `package.json` - Dependencies list
- `package-lock.json` or `yarn.lock` - Lock file for consistent installs
- `next.config.js` - Next.js configuration
- `node_modules/` - **OR** install on server with `npm install --production`

**Optional but Recommended:**
- `app/` - Source files (if you need to rebuild on server)
- `components/` - Source files (if you need to rebuild on server)
- `lib/` - Source files (if you need to rebuild on server)
- `tsconfig.json` - TypeScript config (if rebuilding)
- `tailwind.config.ts` - Tailwind config (if rebuilding)
- `postcss.config.js` - PostCSS config (if rebuilding)

**DO NOT Upload:**
- `node_modules/` - Install on server instead (saves space, ensures compatibility)
- `.git/` - Version control (not needed for production)
- `.next/` - If you're rebuilding on server
- `*.log` - Log files
- `.env.local` - Local environment variables (use server environment variables)

#### Step 3: On Your Server

```bash
# Install production dependencies only
npm install --production

# Start the production server
npm start
```

---

### Option 2: Platform Deployment (Recommended)

#### Vercel (Recommended for Next.js)

1. **Connect your Git repository** to Vercel
2. **Vercel automatically:**
   - Detects Next.js
   - Runs `npm run build`
   - Deploys the `.next` folder
   - Handles environment variables

**No manual upload needed!** Just push to Git.

#### Netlify

1. Connect Git repository
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Deploy automatically

#### Other Platforms

- **Railway**: Connect Git, auto-detects Next.js
- **Render**: Connect Git, auto-detects Next.js
- **AWS Amplify**: Connect Git, auto-detects Next.js

---

## File Structure for Production

```
Your Production Server/
├── .next/              # Built application (REQUIRED)
├── public/             # Static files (if any)
├── package.json        # Dependencies (REQUIRED)
├── package-lock.json   # Lock file (REQUIRED)
├── next.config.js      # Next.js config (REQUIRED)
└── node_modules/       # Installed on server (or upload)
```

---

## Environment Variables

Make sure to set these on your production server:

- No sensitive data in code
- Use server environment variables
- For Vercel: Add in dashboard under Settings → Environment Variables

---

## Quick Deployment Checklist

- [ ] Run `npm run build` locally to test
- [ ] Check `.next` folder exists
- [ ] Set environment variables on server
- [ ] Upload required files (or connect Git)
- [ ] Install dependencies: `npm install --production`
- [ ] Start server: `npm start`
- [ ] Test the deployed site

---

## Recommended: Use Vercel

For Next.js projects, **Vercel is the easiest option**:

1. Sign up at [vercel.com](https://vercel.com)
2. Import your Git repository
3. Vercel handles everything automatically
4. Free tier available

No manual uploads needed!
