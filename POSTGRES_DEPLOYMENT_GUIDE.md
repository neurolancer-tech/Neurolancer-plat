# 🗄️ PostgreSQL Database Deployment Guide

## 1. Create Database on Render

### Steps:
1. **Go to Render Dashboard** → [render.com](https://render.com)
2. **Click "New"** → **"PostgreSQL"**
3. **Configure Database:**
   ```
   Name: neurolancer-db
   Database: neurolancer
   User: neurolancer_user
   Region: Oregon (US West) or closest to you
   PostgreSQL Version: 15 (latest)
   Plan: Free (for testing) or Starter ($7/month)
   ```

4. **Click "Create Database"**

## 2. Get Database Credentials

After creation, Render will provide:
```
Internal Database URL: postgresql://neurolancer_user:password@hostname:5432/neurolancer
External Database URL: postgresql://neurolancer_user:password@external-hostname:5432/neurolancer
```

## 3. Connect to Backend

### Option A: Use Internal URL (Recommended)
- Copy the **Internal Database URL**
- Add to your backend service environment variables:
```
DATABASE_URL=postgresql://neurolancer_user:password@hostname:5432/neurolancer
```

### Option B: Use External URL
- Copy the **External Database URL** 
- Use if backend is not on Render

## 4. Database Migration

After deployment, your backend will automatically:
1. Connect to PostgreSQL using DATABASE_URL
2. Run migrations via build.sh
3. Create all tables and populate initial data

## 5. Verify Connection

Check backend logs for:
```
✅ Database connection successful
✅ Migrations applied
✅ Initial data populated
```

## 6. Database Management

### Access Database:
- **Render Dashboard** → Your Database → **Connect**
- Use provided connection details with pgAdmin or similar tools

### Backup/Restore:
- Render provides automatic backups
- Manual backups available in dashboard

## 🔧 Next Steps After Database Creation

1. **Copy the DATABASE_URL** from Render
2. **Add to backend environment variables**
3. **Deploy backend service**
4. **Verify connection in logs**

## 📋 What to Provide Me

After creating the database, share:
- ✅ Database creation status (success/error)
- ✅ Any connection issues in backend logs
- ✅ If you need help with specific database operations