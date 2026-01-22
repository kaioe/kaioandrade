# Production Deployment Guide (Cloudways)

This project is configured for a **unified deployment** on Cloudways.
- **Frontend**: React (Vite) Single Page Application.
- **Backend**: A lightweight PHP script (`api/send-email.php`) handling form submissions.

Because both run on the same server, you avoid Cross-Origin (CORS) issues and complex multi-service orchestration.

## Architecture

| Environment | Frontend | Backend | API URL |
| :--- | :--- | :--- | :--- |
| **Local (Dev)** | `localhost:5173` (Vite) | `localhost:3000` (Node.js) | `http://localhost:3000/api/send-email` |
| **Production** | Cloudways (Apache/Nginx) | Cloudways (PHP) | `/api/send-email.php` |

*Note: The frontend code automatically detects if it's in production (`import.meta.env.PROD`) and switches the API endpoint accordingly.*

## Deployment Pipeline (GitHub Actions)

We use a GitHub Action (`.github/workflows/deploy.yml`) to automate deployment to Cloudways.

### How it works:
1.  **Push to `main` branch**: Triggers the workflow.
2.  **Build**: Runs `npm run build` to generate the `dist/` folder.
3.  **Config Injection**: Creates a `dist/api/config.php` file on the fly, injecting your `GMAIL_USER` secret.
4.  **Rsync**: Uploads the entire `dist/` folder to your Cloudways application folder (`public_html`).

## Configuration Requirements

For the deployment to work, ensure these **Secrets** are set in your GitHub Repository settings:

| Secret Name | Description |
| :--- | :--- |
| `CLOUDWAYS_FTP_HOST` | Your Cloudways Server IP Address. |
| `CLOUDWAYS_FTP_USERNAME` | Your Master (or App) Username. |
| `CLOUDWAYS_APP_PATH` | Full path to `public_html`, e.g., `/home/master/applications/APP_NAME/public_html/`. |
| `CLOUDWAYS_SSH_KEY` | Your Private SSH Key (ensure Public Key is added to Cloudways). |
| `GMAIL_USER` | The email address to receive contact form submissions (e.g., `dev@kaioandrade.com`). |

## Monitoring & Logs

- **Frontend Updates**: Check the "Actions" tab in GitHub to see deployment status.
- **Email Delivery**: Since we use PHP's `mail()` function, ensure your Cloudways server has the **Elastic Email** add-on enabled (or another SMTP service configured) to guarantee email delivery.
