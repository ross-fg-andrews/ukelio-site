# Deployment Guide - Staging & Production

This guide walks you through deploying Strumkey to Vercel with separate staging and production environments.

## Overview

- **Production**: Live app on your custom domain (e.g., `strumkey.com`) - deployed from `main` branch
- **Staging**: Testing environment (e.g., `strumkey-staging.vercel.app`) - deployed from `develop` branch
- **Separate databases**: Staging and production use different InstantDB apps to keep test data separate from real users

## Architecture

```
main branch (GitHub) → Production (Vercel) → Production Database (InstantDB)
develop branch (GitHub) → Staging (Vercel) → Staging Database (InstantDB)
```

## Prerequisites

1. ✅ Git repository set up with `main` and `develop` branches
2. ✅ InstantDB account with production app created
3. ✅ Vercel account connected to GitHub
4. ✅ Environment variables configured (see below)

## Step-by-Step Setup

### Step 1: Git Repository Setup (Complete ✅)

The Git repository has been set up with:
- `main` branch for production deployments
- `develop` branch for staging deployments

### Step 2: InstantDB Setup

**What you need to do:**

1. **Keep your existing InstantDB app for production:**
   - This is your current app with all your production data
   - Note down your **Production App ID** (you'll need it for Vercel environment variables)
   - 🔒 **This data is completely safe** - staging will never touch it

2. **Create a new InstantDB app for staging:**
   - Go to [InstantDB Dashboard](https://instantdb.com)
   - Click "Create New App" or similar button
   - Name it something like "Strumkey Staging"
   - Copy the **Staging App ID** (you'll need this for Vercel environment variables)
   - 📝 **Note:** This app starts completely empty - no users, no songs, no data

3. **Sync schema to staging app:**
   - Once you have the Staging App ID, update your `.env` file temporarily:
     ```bash
     VITE_INSTANTDB_APP_ID=your_staging_app_id_here
     ```
   - Run the sync command:
     ```bash
     npm run sync-all
     ```
   - This copies your database **structure** (not data) to staging
   - Restore your original `.env` file with production App ID

**Important:** This syncs the **structure only**, not the data. Your production database is never touched.

### Step 3: Vercel Project Setup

**What you need to do in Vercel dashboard:**

1. **Import your GitHub repository:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Find your `strumkey-site` repository and click "Import"
   - Vercel will automatically detect it's a Vite project

2. **Configure project settings:**
   - **Framework Preset:** Vite (should auto-detect) ✓
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run build` (should auto-detect) ✓
   - **Output Directory:** `dist` (should auto-detect) ✓
   - **Install Command:** `npm install` (should auto-detect) ✓

3. **Set up production deployment:**
   - In "Production Branch" setting, select `main`
   - This means pushing to `main` will deploy to production

4. **Configure environment variables for production:**
   - In project settings, go to "Environment Variables"
   - Add the following variables for **Production** environment:
     - `VITE_INSTANTDB_APP_ID` = your **Production** InstantDB App ID
     - `VITE_ENVIRONMENT` = `production`
   - ⚠️ **Important:** Make sure "Production" environment is selected when adding these

5. **Deploy production:**
   - Click "Deploy" button
   - Wait for deployment to complete (usually 1-2 minutes)
   - You'll get a URL like `strumkey-site.vercel.app` - this is your production site

6. **Test production deployment:**
   - Visit your production URL
   - Sign in and verify it connects to your production database
   - Test basic functionality

### Step 4: Staging Environment Setup

**What you need to do in Vercel dashboard:**

1. **Enable automatic preview deployments:**
   - In your Vercel project dashboard, go to Settings → Git
   - Under "Production Branch", make sure `main` is selected (should already be set)
   - Under "Preview Deployments", enable "Automatic Preview Deployments"
   - This means every branch (including `develop`) will automatically get its own preview URL when pushed

2. **Configure environment variables for staging:**
   - In your Vercel project, go to Settings → Environment Variables
   - Add the same variables again, but this time select **Preview** environment:
     - `VITE_INSTANTDB_APP_ID` = your **Staging** InstantDB App ID
     - `VITE_ENVIRONMENT` = `staging`
   - ⚠️ **Important:** When adding these, select "Preview" environment (this applies to all non-production branches, including `develop`)
   - You can also select "Development" if you want these variables available locally

3. **Deploy staging:**
   - Push to `develop` branch:
     ```bash
     git checkout develop
     git push origin develop
     ```
   - Vercel will automatically detect the push and create a deployment
   - Visit the deployment URL (shown in Vercel dashboard or in GitHub) to test

4. **Test staging deployment:**
   - Visit your staging URL
   - Verify it connects to your staging database (should be empty)
   - Test basic functionality

### Step 5: Domain Configuration

**What you need to do:**

1. **Purchase domain through Vercel** (recommended - easiest):
   - In your Vercel project dashboard, go to Settings → Domains
   - Click "Add Domain" or "Buy Domain"
   - Search for your desired domain name (e.g., `strumkey.com`)
   - Follow Vercel's checkout process to purchase
   - Vercel will automatically configure DNS records for you
   - Vercel automatically provides SSL certificate (HTTPS)

2. **OR if you already have a domain** (purchased elsewhere):
   - In Vercel project dashboard, go to Settings → Domains
   - Click "Add Domain"
   - Enter your domain name
   - Vercel will show you DNS records to add
   - Go to your domain registrar (where you bought the domain) and add these DNS records:
     - A record: `@` → Vercel IP (shown in Vercel)
     - CNAME record: `www` → `cname.vercel-dns.com`
   - After DNS records are added, Vercel automatically provides SSL certificate

3. **Wait for DNS propagation:**
   - DNS changes can take a few minutes to 48 hours
   - Vercel dashboard will show you when the domain is connected (green checkmark)
   - Once connected, your site will automatically be live at `yourdomain.com` with HTTPS

4. **(Optional) Set up subdomain for staging:**
   - You can add `staging.yourdomain.com` pointing to your staging deployment
   - Or just use the Vercel preview URL for staging (no setup needed)

## Deployment Workflow

### Making Changes and Testing

1. **Work on staging:**
   ```bash
   git checkout develop
   # Make your changes
   git add .
   git commit -m "Add new feature"
   git push origin develop
   ```
   - ⚡ Automatically deploys to staging URL
   - 👤 Test on staging site to verify everything works

2. **Deploy to production (when ready):**
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```
   - ⚡ Automatically deploys to production (yourdomain.com)

3. **For urgent fixes:**
   ```bash
   git checkout main
   # Make fix
   git commit -m "Fix urgent bug"
   git push origin main
   # Then merge fix back to develop:
   git checkout develop
   git merge main
   git push origin develop
   ```

**Best Practice:** Always test in staging first. Only merge to `main` when you're confident the changes work.

## Testing Database Updates Safely

### Example: Adding/Updating Chords in Database

**🔒 Your Production Data is Always Safe**

When you want to update the chord database (or any database structure) and test it before deploying to production:

1. **Make your code changes:**
   - Update chord data/changes in your code
   - Commit to `develop` branch and push
   - ⚡ Staging site automatically deploys

2. **Sync schema to staging database (if needed):**
   - If you've changed the chord database structure (e.g., added new fields), sync it to staging:
     ```bash
     # Temporarily update .env with staging App ID
     VITE_INSTANTDB_APP_ID=your_staging_app_id_here
     npm run sync-all
     # Then restore production App ID
     ```
   - This updates staging database structure, **not production**
   - 🔒 **Production database is never touched**

3. **Test in staging:**
   - Visit your staging site
   - Test the chord updates:
     - Create a new song with the new chords
     - Verify chord diagrams display correctly
     - Test chord autocomplete with new chords
     - Check that existing functionality still works
   - 🔒 **All testing happens in empty staging database** - your production users never see these changes

4. **Deploy to production (when ready):**
   - Once you're satisfied with testing in staging:
   - Merge `develop` to `main` and push
   - ⚡ Production automatically deploys
   - Sync the schema to production database:
     ```bash
     # With production App ID in .env
     npm run sync-all
     ```
   - ✅ Now production has the updated chord database
   - 🔒 **All your existing user data, songs, and chord references remain intact**

### Important Safety Points

- ✅ **Staging database is completely separate** - starts empty, stays separate
- ✅ **Production database is never modified** until you explicitly deploy
- ✅ **User data is always safe** - production users' songs, chord references, and data remain untouched during staging tests
- ✅ **You can test extensively** in staging without any risk to production
- ✅ **Chord updates are safe** - updating chord database structure in staging doesn't affect production chords or songs that reference them

### What Gets Tested vs. What's Safe

**Tested in Staging (Safe to Modify):**
- Chord database structure (new fields, new chord types)
- Chord data (adding/updating chord definitions)
- Schema changes (new tables, relationships)
- Code changes (features, UI, functionality)
- All with zero impact on production

**Always Safe in Production (Never Touched):**
- Real users' accounts and data
- Real users' songs and chord references
- Real groups and memberships
- All production data remains completely isolated and safe

## Environment Variables

### Required Variables

Both staging and production need these variables, but with different values:

- `VITE_INSTANTDB_APP_ID`: Your InstantDB App ID (different for staging and production)
- `VITE_ENVIRONMENT`: Set to `production` for production, `staging` for staging

### Setting Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add variables for the appropriate environment:
   - **Production**: Select "Production" when adding variables (applies to `main` branch)
   - **Preview**: Select "Preview" when adding variables (applies to `develop` and other branches)
   - **Development**: Select "Development" if you want variables available locally

## Troubleshooting

### "Build failed" error

- Check that `npm run build` works locally
- Verify all dependencies are in `package.json`
- Check Vercel build logs for specific errors

### "Environment variable not found"

- Make sure you added variables in Vercel project settings
- Verify variable names match exactly (case-sensitive)
- Check that you selected the correct environment (Production vs Preview)
- Redeploy after adding variables

### "Database connection error"

- Verify `VITE_INSTANTDB_APP_ID` is correct for each environment
- Production uses production App ID, staging uses staging App ID
- Check InstantDB dashboard that apps are active
- Verify environment variables are set for the correct environment in Vercel

### "Domain not connecting"

- DNS propagation can take up to 48 hours
- Verify DNS records are correct in your domain registrar
- Use online DNS checker tools to verify propagation
- Check Vercel dashboard for domain status (green checkmark when connected)

### Staging and Production using same database

- Verify environment variables are set correctly in Vercel
- Production should use Production App ID (Production environment)
- Staging should use Staging App ID (Preview environment)
- Check Vercel deployment logs to see which environment variables are being used

## Security Best Practices

✅ **Environment variables:** Never committed to Git, stored securely in Vercel
✅ **Separate databases:** Staging and production completely isolated
✅ **Branch protection:** Test in staging before production
✅ **HTTPS:** Vercel automatically provides SSL certificates for your domain

## Next Steps

1. ✅ Set up staging and production deployments (complete)
2. ✅ Configure environment variables (complete)
3. 📋 Purchase domain through Vercel (when ready)
4. 📋 Set up staging subdomain (optional): `staging.yourdomain.com`
5. 📋 Add monitoring/analytics (optional - for later)
6. 📋 Set up email notifications for deployments (optional - in Vercel settings)

## Support

If you run into any issues during setup:

1. Check Vercel deployment logs (in Vercel dashboard)
2. Check browser console for errors
3. Verify environment variables are set correctly
4. Refer to this troubleshooting section
5. Check InstantDB dashboard for database status
