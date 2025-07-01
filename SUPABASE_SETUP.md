# Supabase Setup Guide

## Why Supabase?
- **Reliable**: Works perfectly with Node.js 23 (no SSL issues)
- **Free Tier**: 500MB database, 50MB file storage, 2GB bandwidth
- **PostgreSQL**: Powerful, reliable database
- **Real-time**: Built-in real-time subscriptions
- **Auth**: Built-in authentication system
- **Dashboard**: Beautiful web interface for data management

## Step 1: Create Supabase Account

1. Go to [Supabase](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub or email
4. Create a new organization (if needed)

## Step 2: Create New Project

1. Click "New Project"
2. Choose your organization
3. Enter project details:
   - **Name**: `number-change-portal`
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait for setup to complete (2-3 minutes)

## Step 3: Get Your Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Step 4: Create Database Tables

### Option A: Using SQL Editor (Recommended)

1. Go to **SQL Editor** in your Supabase dashboard
2. Run this SQL to create the tables:

```sql
-- Create agents table
CREATE TABLE agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'agent',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create logs table
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    action TEXT NOT NULL,
    details JSONB,
    agent_id TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_agents_email ON agents(email);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX idx_logs_agent_id ON logs(agent_id);
```

### Option B: Using Table Editor

1. Go to **Table Editor**
2. Create `agents` table with columns:
   - `id` (text, primary key)
   - `name` (text, not null)
   - `email` (text, unique, not null)
   - `phone` (text, not null)
   - `password` (text, not null)
   - `role` (text, default: 'agent')
   - `status` (text, default: 'active')
   - `created_at` (timestamp with time zone, default: now())
   - `last_login` (timestamp with time zone)

3. Create `logs` table with columns:
   - `id` (serial, primary key)
   - `action` (text, not null)
   - `details` (jsonb)
   - `agent_id` (text)
   - `timestamp` (timestamp with time zone, default: now())

## Step 5: Configure Environment Variables

### For Local Development:
Create `.env` file in `backend/` directory:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
PORT=3000
```

### For Render Deployment:
1. Go to your Render dashboard
2. Select your service
3. Go to **Environment** tab
4. Add these variables:
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_ANON_KEY`: Your anon key
   - `PORT`: `3000` (or leave empty)

## Step 6: Test the Setup

```bash
cd backend
npm run setup
```

You should see:
```
Setting up Supabase database...
✅ Supabase connection successful
✅ Default data initialized
🎉 Setup completed successfully!
```

## Step 7: Start the Server

```bash
npm start
```

## Database Schema

### Agents Table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key, agent ID (e.g., AG001) |
| name | TEXT | Full name |
| email | TEXT | Email address (unique) |
| phone | TEXT | Phone number |
| password | TEXT | Hashed password |
| role | TEXT | Role (default: 'agent') |
| status | TEXT | Status (active/inactive) |
| created_at | TIMESTAMP | Creation timestamp |
| last_login | TIMESTAMP | Last login timestamp |

### Logs Table
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Auto-incrementing primary key |
| action | TEXT | Action performed |
| details | JSONB | Additional details |
| agent_id | TEXT | Agent who performed action |
| timestamp | TIMESTAMP | When action occurred |

## Benefits of Supabase

1. **No SSL Issues**: Works perfectly with Node.js 23
2. **Real-time**: Can add real-time features later
3. **Row Level Security**: Built-in security policies
4. **Backups**: Automatic daily backups
5. **Monitoring**: Built-in performance monitoring
6. **API**: Auto-generated REST API
7. **Dashboard**: Beautiful web interface

## Troubleshooting

### Connection Issues
- Verify your `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Check that your project is active in Supabase dashboard
- Ensure tables are created correctly

### Table Not Found Errors
- Run the SQL commands in the SQL Editor
- Check table names match exactly (case-sensitive)
- Verify column names and types

### Permission Issues
- Supabase uses Row Level Security (RLS)
- For now, RLS is disabled by default
- You can enable it later for better security

## Next Steps

1. **Test locally**: Run `npm start` and test all features
2. **Deploy to Render**: Push changes and set environment variables
3. **Monitor**: Use Supabase dashboard to monitor usage
4. **Scale**: Upgrade to paid plan when needed

Your agents will now persist permanently and survive all deployments! 🎉 