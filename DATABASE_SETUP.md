# Database Migration Guide

## Problem
The application was using JSON files for data storage, which caused data loss when deployed to cloud platforms like Render due to ephemeral file systems.

## Solution
Migrated to MongoDB Atlas for persistent data storage.

## Setup Instructions

### 1. Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a new cluster (M0 Free tier is sufficient)
4. Set up database access:
   - Create a database user with username and password
   - Note down the credentials
5. Set up network access:
   - Add IP address `0.0.0.0/0` to allow connections from anywhere
   - Or add your specific IP addresses

### 2. Get Connection String

1. In your MongoDB Atlas dashboard, click "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<username>`, `<password>`, and `<dbname>` with your actual values

Example connection string:
```
mongodb+srv://your_username:your_password@cluster0.mongodb.net/number_change_portal?retryWrites=true&w=majority
```

### 3. Set Environment Variables

#### For Local Development:
Create a `.env` file in the `backend` directory:

```env
MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.mongodb.net/number_change_portal?retryWrites=true&w=majority
DB_NAME=number_change_portal
PORT=3000
```

#### For Render Deployment:
1. Go to your Render dashboard
2. Select your service
3. Go to "Environment" tab
4. Add these environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `DB_NAME`: `number_change_portal`
   - `PORT`: `3000` (or leave empty for Render to set)

### 4. Install Dependencies

```bash
cd backend
npm install
```

### 5. Test Locally

```bash
npm start
```

The application will:
- Connect to MongoDB Atlas
- Initialize default agents if the database is empty
- Create necessary indexes for performance

### 6. Deploy to Render

1. Push your changes to GitHub
2. Render will automatically redeploy
3. Check the logs to ensure MongoDB connection is successful

## Data Migration (if needed)

If you have existing data in JSON files that you want to migrate:

1. Export your existing data from `backend/data/agents.json`
2. Use MongoDB Compass or the MongoDB shell to import the data
3. Or create a migration script to transfer the data

## Benefits of MongoDB Atlas

1. **Persistent Storage**: Data survives server restarts and redeployments
2. **Scalability**: Can handle more data and concurrent users
3. **Backup & Recovery**: Automatic backups and point-in-time recovery
4. **Security**: Built-in security features and encryption
5. **Monitoring**: Built-in monitoring and alerting
6. **Free Tier**: 512MB storage and shared RAM (sufficient for most use cases)

## Troubleshooting

### Connection Issues
- Verify your connection string is correct
- Check that your IP is whitelisted in MongoDB Atlas
- Ensure your database user has the correct permissions

### Data Not Persisting
- Verify environment variables are set correctly
- Check that the database name matches in your connection string
- Look for errors in the application logs

### Performance Issues
- The application creates indexes automatically for better performance
- Monitor your MongoDB Atlas dashboard for usage metrics

## Security Notes

1. Never commit your `.env` file to version control
2. Use strong passwords for your database user
3. Consider using MongoDB Atlas's built-in security features
4. Regularly rotate your database credentials

## Cost Considerations

- MongoDB Atlas M0 (Free tier) includes:
  - 512MB storage
  - Shared RAM
  - 500 connections
  - Sufficient for most small to medium applications

- Upgrade to paid tiers if you need:
  - More storage
  - Dedicated resources
  - Advanced features 