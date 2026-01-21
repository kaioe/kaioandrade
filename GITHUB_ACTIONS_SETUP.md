# GitHub Actions Deployment Setup

## Overview

I've created GitHub Actions workflow files:

1. **`.github/workflows/deploy.yml`** - Full Cloudways deployment via SFTP (requires FTP credentials)
2. **`.github/workflows/deploy-simple.yml`** - Build and test only (no secrets needed)

---

## Option 1: Simple Build & Test (Recommended to Start)

The `deploy-simple.yml` workflow will:
- ✅ Run on every push to `main`
- ✅ Install dependencies
- ✅ Run linter
- ✅ Build the project
- ✅ Upload build artifacts

**No setup required!** Just push your code and it will run automatically.

---

## Option 2: Full Cloudways Deployment

The `deploy.yml` workflow will:
- ✅ Do everything from Option 1
- ✅ Deploy to Cloudways automatically via SFTP
- ⚠️ Requires Cloudways FTP credentials setup

### Setup Steps:

#### 1. Get Cloudways FTP Credentials

1. **Login to Cloudways Console**
   - Go to [platform.cloudways.com](https://platform.cloudways.com)
   - Select your application

2. **Get FTP/SFTP Details**
   - Go to **Application Management** → **Deployment via FTP/SFTP**
   - Note down:
     - **FTP Host** (e.g., `ftp.example.com`)
     - **FTP Username**
     - **FTP Password**

#### 2. Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add these three secrets:

   | Secret Name | Value |
   |------------|-------|
   | `CLOUDWAYS_FTP_HOST` | Your FTP host (without ftp://) |
   | `CLOUDWAYS_FTP_USERNAME` | Your FTP username |
   | `CLOUDWAYS_FTP_PASSWORD` | Your FTP password |

#### 3. Verify Deployment Path

The workflow deploys to `./public_html/` directory. If your Cloudways app uses a different webroot:
- Update the `server-dir` in `.github/workflows/deploy.yml`
- Common alternatives: `./public/`, `./www/`, or root `./`

#### 4. Enable the Workflow

The workflow will automatically run on:
- Push to `main` branch

**Note:** Removed pull request trigger to avoid unnecessary deployments during code review.

---

## Workflow Files Explained

### `deploy-simple.yml`
- **Purpose:** Build and test your code
- **When:** Every push/PR
- **Secrets:** None required
- **Use case:** CI/CD validation

### `deploy.yml`
- **Purpose:** Build, test, and deploy to Cloudways
- **When:** Every push to main
- **Secrets:** Requires Cloudways FTP credentials
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

### Cloudways Deployment Fails
- Verify all three FTP secrets are set correctly
- Check that FTP credentials have write permissions to public_html/
- Ensure the FTP host is correct (without ftp:// prefix)
- Confirm the server-dir path matches your Cloudways webroot

---

## Recommended Approach

**Use GitHub Actions if:**
- You need custom build steps
- You want to deploy to multiple platforms
- You need advanced CI/CD workflows
- You want to run tests before deployment
