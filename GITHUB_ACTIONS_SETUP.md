# GitHub Actions Deployment Setup

## Overview

I've created two GitHub Actions workflow files:

1. **`.github/workflows/deploy.yml`** - Full Vercel deployment (requires Vercel secrets)
2. **`.github/workflows/deploy-simple.yml`** - Build and test only (no secrets needed)

---

## Option 1: Simple Build & Test (Recommended to Start)

The `deploy-simple.yml` workflow will:
- ✅ Run on every push to `main`/`master`
- ✅ Install dependencies
- ✅ Run linter
- ✅ Build the project
- ✅ Upload build artifacts

**No setup required!** Just push your code and it will run automatically.

---

## Option 2: Full Vercel Deployment

The `deploy.yml` workflow will:
- ✅ Do everything from Option 1
- ✅ Deploy to Vercel automatically
- ⚠️ Requires Vercel secrets setup

### Setup Steps:

#### 1. Get Vercel Credentials

**Method A: Using Vercel CLI (Easiest)**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project (run in project root)
vercel link

# This will show:
# - VERCEL_ORG_ID
# - VERCEL_PROJECT_ID
```

**Method B: From Vercel Dashboard**
1. Go to your project on [vercel.com](https://vercel.com)
2. Go to **Settings** → **General**
3. Find:
   - **Team ID** (this is your ORG_ID)
   - **Project ID**

#### 2. Get Vercel Token

1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Click **"Create Token"**
3. Name it (e.g., "GitHub Actions")
4. Copy the token (you won't see it again!)

#### 3. Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add these three secrets:

   | Secret Name | Value |
   |------------|-------|
   | `VERCEL_TOKEN` | Your Vercel token from step 2 |
   | `VERCEL_ORG_ID` | Your Team/Org ID |
   | `VERCEL_PROJECT_ID` | Your Project ID |

#### 4. Enable the Workflow

The workflow will automatically run on:
- Push to `main`/`master` branch
- Pull requests to `main`/`master` branch

---

## Alternative: Use Vercel's Native Integration (Easier!)

Instead of GitHub Actions, you can use Vercel's built-in Git integration:

1. **Connect GitHub to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click **"Add New..."** → **"Project"**
   - Import from GitHub
   - Vercel handles everything automatically!

2. **Benefits:**
   - ✅ No secrets to manage
   - ✅ Automatic deployments
   - ✅ Preview deployments for PRs
   - ✅ Built-in CI/CD

**This is the recommended approach!** GitHub Actions is useful if you need custom build steps or want to deploy to multiple platforms.

---

## Workflow Files Explained

### `deploy-simple.yml`
- **Purpose:** Build and test your code
- **When:** Every push/PR
- **Secrets:** None required
- **Use case:** CI/CD validation

### `deploy.yml`
- **Purpose:** Build, test, and deploy to Vercel
- **When:** Every push/PR
- **Secrets:** Requires Vercel credentials
- **Use case:** Full automated deployment

---

## Testing the Workflow

1. **Push your code:**
   ```bash
   git add .
   git commit -m "Add GitHub Actions workflow"
   git push
   ```

2. **Check GitHub Actions:**
   - Go to your repository on GitHub
   - Click **"Actions"** tab
   - You should see the workflow running

3. **View logs:**
   - Click on the running workflow
   - Click on the job to see detailed logs

---

## Troubleshooting

### Workflow Not Running
- Check that the file is in `.github/workflows/` directory
- Verify the branch name matches (`main` or `master`)
- Check that the file has `.yml` extension

### Build Fails
- Check the Actions logs for error messages
- Test locally: `npm run build`
- Fix any TypeScript or build errors

### Vercel Deployment Fails
- Verify all three secrets are set correctly
- Check that VERCEL_TOKEN has proper permissions
- Ensure VERCEL_ORG_ID and VERCEL_PROJECT_ID are correct

---

## Recommended Approach

**For most users:** Use Vercel's native Git integration (no GitHub Actions needed)

**Use GitHub Actions if:**
- You need custom build steps
- You want to deploy to multiple platforms
- You need advanced CI/CD workflows
- You want to run tests before deployment
