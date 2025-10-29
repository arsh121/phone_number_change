# Fly.io Deployment Guide

This guide will help you deploy the backend to Fly.io, which allows connections to SMSGupshup without blocking.

## Prerequisites

1. **Install Fly CLI**: 
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```
   
   For macOS with Homebrew:
   ```bash
   brew install flyctl
   ```

2. **Login to Fly.io**:
   ```bash
   fly auth login
   ```
   This will open your browser to authenticate.

## Step 1: Initialize Fly.io App

Navigate to the backend directory:
```bash
cd backend
```

Initialize Fly.io (this will use the existing `fly.toml`):
```bash
fly launch
```

When prompted:
- **App name**: Enter a unique name (or press Enter to auto-generate)
- **Region**: Choose closest to your users (e.g., `bom` for Mumbai, `iad` for US East)
- **Postgres/SQLite**: Press Enter to skip (we're using Supabase)
- **Redis**: Press Enter to skip
- **Deploy now**: Type `n` (we'll deploy after setting secrets)

## Step 2: Set Environment Variables

Set your Supabase credentials (replace with your actual values):
```bash
fly secrets set SUPABASE_URL="https://your-project-id.supabase.co"
fly secrets set SUPABASE_ANON_KEY="your_anon_key_here"
fly secrets set PORT="3000"
```

You can also set NODE_ENV if needed:
```bash
fly secrets set NODE_ENV="production"
```

## Step 3: Deploy

Deploy your application:
```bash
fly deploy
```

This will:
1. Build your Node.js application
2. Push it to Fly.io
3. Start your app

## Step 4: Get Your App URL

After deployment, get your app URL:
```bash
fly status
```

Or check the deployment output - it will show something like:
```
https://your-app-name.fly.dev
```

## Step 5: Update Frontend API URL

Update your frontend (Netlify or wherever it's hosted) to point to your Fly.io backend:

In `script.js`, update the `API_BASE_URL`:
```javascript
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : 'https://your-app-name.fly.dev/api';
```

Or better, use an environment variable or config file for production URL.

## Useful Fly.io Commands

- **View logs**: `fly logs`
- **Check status**: `fly status`
- **SSH into app**: `fly ssh console`
- **Open app**: `fly open`
- **Scale**: `fly scale count 1` (for always-on) or `fly scale count 0` (sleeps when idle)
- **View secrets**: `fly secrets list`
- **Update secrets**: `fly secrets set KEY="value"`
- **Restart app**: `fly apps restart your-app-name`

## Troubleshooting

### App not responding
```bash
fly logs  # Check what's happening
fly status # Check app health
```

### Connection timeout to SMSGupshup
Fly.io should NOT block connections, but if you see timeouts:
- Check if the region is correct (try closer to India: `bom`)
- Check logs: `fly logs`
- Verify network from the app: `fly ssh console` then `curl https://enterprise.smsgupshup.com`

### Database connection issues
- Verify Supabase credentials are set correctly
- Check Supabase allows connections from Fly.io IPs (usually allowed by default)

## Cost Considerations

Fly.io free tier:
- 3 shared VMs (256MB RAM each)
- Included data transfer
- Apps can sleep when idle (paid to keep running)

For production with always-on:
- ~$1.94/month per VM (256MB, 1 shared CPU)
- Very affordable for a single backend instance

## Next Steps

1. Test SMS sending from your deployed backend
2. Update frontend to use Fly.io backend URL
3. Test end-to-end flow
4. Monitor with `fly logs`

