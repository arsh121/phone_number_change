# SMS Proxy Service for Render

This is a simple proxy service to bypass Render's network restrictions when calling SMSGupshup API.

## Quick Deploy to Railway (Recommended)

1. **Go to [Railway](https://railway.app)**
2. **Sign up/login**
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"** (or just drag and drop this folder)
5. **Add environment variable (optional):**
   ```
   PORT=3000
   ```
6. **Deploy!**

Your proxy will be live at: `https://your-app-name.up.railway.app`

## How to Use in Your Main App

1. Add this environment variable in Render:
   ```
   SMS_PROXY_URL=https://your-railway-app.up.railway.app/proxy/sms
   ```

2. I'll update your main app to use this proxy when calling SMS API.

## Alternative: Heroku (Free Tier Ending Soon)

Similar process as Railway, but Heroku has better docs.

## Why This Works

- Railway/Heroku don't have the same network restrictions as Render
- Your proxy can reach SMSGupshup from these platforms
- Render can easily call your proxy
- Simple GET request forwarding

## Cost

- **Railway**: Free tier with $5 credit/month
- **Heroku**: Free tier ending, but paid tier is $7/month
- **Alternatives**: Render itself could work if they whitelist SMSGupshup domains

