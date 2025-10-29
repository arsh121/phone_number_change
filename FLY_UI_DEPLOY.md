# Fly.io Web UI Deployment Guide

This guide covers deploying via Fly.io's web dashboard. Note: Some initial setup may require the CLI, but most management can be done via the web UI.

## Step 1: Sign Up / Login

1. Go to https://fly.io
2. Click **"Sign Up"** or **"Log In"**
3. Sign up with:
   - **Email + Password**, OR
   - **GitHub** (recommended - easier to connect repos)

## Step 2: Connect GitHub Repository (Recommended)

If you signed up with GitHub:

1. In Fly.io dashboard, go to **"Get Started"** or click **"New App"**
2. Select **"Deploy with GitHub"**
3. Authorize Fly.io to access your GitHub
4. Select your repository: `arsh121/phone_number_change` (or your repo)
5. Select the branch: `gupshup-fix`
6. Click **"Deploy"**

## Step 3: Configure App Settings

After connecting the repo, you'll see the app configuration page:

### Basic Settings:
- **App Name**: Enter a unique name (e.g., `number-change-backend` or auto-generated)
- **Organization**: Select your organization (usually your username for free tier)
- **Region**: Choose closest to your users:
  - `bom` (Mumbai, India) - Best for India users
  - `iad` (Washington D.C.) - US East
  - `sjc` (San Jose) - US West
  - `ams` (Amsterdam) - Europe

### Build Configuration:
Since we have a `backend/` folder with the Fly.io config:

1. **Set Root Directory**: Click **"Advanced Options"** or **"Configure"**
2. Set **Root Directory** to: `backend`
3. **Port**: Set to `3000`
4. **Build Command**: Leave default (auto-detects Node.js) or set:
   ```
   npm install
   ```
5. **Start Command**: Set to:
   ```
   npm start
   ```

## Step 4: Set Environment Variables (Secrets)

1. In your app dashboard, go to **"Secrets"** tab (left sidebar)
2. Click **"Set Secret"** or **"Add Secret"**
3. Add these secrets one by one:

   **Secret 1:**
   - Name: `SUPABASE_URL`
   - Value: `https://your-project-id.supabase.co` (replace with your actual Supabase URL)

   **Secret 2:**
   - Name: `SUPABASE_ANON_KEY`
   - Value: `your_anon_key_here` (replace with your actual Supabase anonymous key)

   **Secret 3 (Optional):**
   - Name: `NODE_ENV`
   - Value: `production`

   **Secret 4 (Optional):**
   - Name: `PORT`
   - Value: `3000`

4. Click **"Save"** after each secret

**Note:** Fly.io handles `PORT` automatically, but setting it explicitly won't hurt.

## Step 5: Initial Deployment

If you connected via GitHub:

1. The app should automatically start deploying
2. Watch the build logs in real-time
3. Wait for deployment to complete

If you created the app manually:

1. Go to **"Machines"** tab
2. Click **"Create Machine"** or **"Deploy"**
3. Select your region
4. Configure:
   - **Image**: Select your app image
   - **VM Size**: `shared-cpu-1x` (256MB RAM) - Free tier compatible
   - **Auto-start**: Enable (so it wakes up on requests)
5. Click **"Create"**

## Step 6: Verify Deployment

1. After deployment completes, go to **"Overview"** tab
2. Your app URL will be shown (e.g., `https://your-app-name.fly.dev`)
3. Click the URL or **"Open App"** to test
4. You should see your Express app running

## Step 7: View Logs

1. Go to **"Monitoring"** or **"Logs"** tab
2. View real-time logs from your app
3. Useful for debugging issues

## Step 8: Configure Auto-Scaling (Optional)

1. Go to **"Scaling"** tab
2. Configure:
   - **Min Machines**: `0` (sleeps when idle - saves money)
   - **Max Machines**: `1` (single instance)
   - **Auto Start**: ✅ Enabled (wakes up on first request)
3. Click **"Save"**

This means:
- App sleeps when not in use (free tier compatible)
- Automatically wakes up when someone makes a request
- First request after sleep may take ~10-15 seconds to respond

## Step 9: Update Frontend to Use Fly.io Backend

Once you have your Fly.io app URL:

1. Get your app URL from Fly.io dashboard (e.g., `https://your-app-name.fly.dev`)
2. Update your frontend code or Netlify environment variables:

   In your frontend deployment (Netlify/Dashboard):
   - Set environment variable:
     - Name: `VITE_API_URL` or `REACT_APP_API_URL` (depending on your setup)
     - Value: `https://your-app-name.fly.dev/api`

   Or update `script.js` directly:
   ```javascript
   const API_BASE_URL = window.location.hostname === 'localhost' 
     ? 'http://localhost:3000/api' 
     : 'https://your-app-name.fly.dev/api';
   ```

## Step 10: Test SMS Functionality

1. Open your frontend
2. Try sending an SMS
3. Check Fly.io logs in the dashboard to see if the SMS API call succeeds
4. Verify SMS is sent successfully

## Managing via Web UI

### View Logs:
- Go to **"Monitoring"** → **"Logs"** tab
- See real-time application logs
- Filter by machine, region, etc.

### Update Environment Variables:
- Go to **"Secrets"** tab
- Click **"Set Secret"** to add/update
- Click **"Remove"** to delete secrets
- Secrets are encrypted and can be updated without redeploying

### Restart App:
- Go to **"Overview"** tab
- Click **"Restart"** button
- App will restart with current code

### Scale Resources:
- Go to **"Scaling"** tab
- Adjust VM size, count, regions
- Click **"Save"**

### View Metrics:
- Go to **"Monitoring"** → **"Metrics"** tab
- See CPU, memory, request metrics
- Monitor app performance

### View Deployments:
- Go to **"Deployments"** tab
- See deployment history
- Rollback to previous deployments if needed

## Troubleshooting via Web UI

### App Not Starting:
1. Go to **"Monitoring"** → **"Logs"**
2. Check for error messages
3. Common issues:
   - Missing environment variables → Go to **"Secrets"** tab
   - Port mismatch → Check app configuration
   - Build failures → Check **"Deployments"** tab

### SMS API Timeout:
1. Check logs in **"Monitoring"** → **"Logs"**
2. Look for connection timeout errors
3. Verify region is correct (try `bom` for India)
4. Check if SMSGupshup API is reachable

### Database Connection Issues:
1. Go to **"Secrets"** tab
2. Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set correctly
3. Check Supabase dashboard to ensure project is active

## Important Notes

⚠️ **GitHub Connection Required**: Fly.io's web UI works best when connected to GitHub. If you can't connect GitHub, you'll need to use CLI for initial setup.

⚠️ **fly.toml File**: The `backend/fly.toml` file in the repo contains important configuration. If deploying via GitHub, Fly.io will use it automatically.

⚠️ **Root Directory**: Make sure to set **Root Directory** to `backend` in the app settings, since your Express app is in the `backend/` folder.

## Alternative: Manual App Creation (If GitHub Connection Fails)

If you can't connect GitHub via web UI:

1. You'll still need to run ONE CLI command to link your local repo:
   ```bash
   cd backend
   fly launch --no-deploy
   ```
2. This creates the app and links it
3. Then you can do everything else via the web UI

## Cost Monitoring

- Go to **"Billing"** tab in Fly.io dashboard
- Monitor usage and costs
- Free tier includes 3 shared VMs
- Set up usage alerts if needed

---

**That's it!** Your backend should now be running on Fly.io and able to connect to SMSGupshup without blocking issues. 🚀

