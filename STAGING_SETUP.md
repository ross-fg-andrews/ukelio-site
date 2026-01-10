# Staging Environment Setup - Troubleshooting

## Issue: "Variable already exists" Error

If you see the error:
> "A variable with the name `VITE_INSTANTDB_APP_ID` already exists for the target production,preview,development"

This means the variable was added with all environments selected. Here's how to fix it:

## Solution: Edit Existing Variables First

### Step 1: Edit Existing Variables (Make them Production-only)

1. Go to **Settings** → **Environment Variables** in your Vercel project
2. Find the existing `VITE_INSTANTDB_APP_ID` variable
3. Click the **edit/pencil icon** (or click on the variable row)
4. In the edit dialog:
   - Make sure the **Value** is: `f5937544-d918-4dc7-bb05-5f4a8cae65b3` (Production App ID)
   - Under "Environment" or "Apply to", check ✅ **Production ONLY**
   - Uncheck ❌ **Preview** and **Development** (if they're checked)
   - Click "Save" or "Update"
5. Repeat for `VITE_ENVIRONMENT`:
   - Edit the existing variable
   - Make sure **Value** is: `production`
   - Check ✅ **Production ONLY**
   - Uncheck ❌ **Preview** and **Development**
   - Click "Save" or "Update"

### Step 2: Add New Variables for Preview Environment

After editing existing variables to be Production-only, add new entries for Preview:

1. Click "Add New" or "+" button
2. Add first variable for Preview:
   - **Key:** `VITE_INSTANTDB_APP_ID`
   - **Value:** `fdb09c88-e5eb-4d54-a09c-dd8cc5cef020` (Staging App ID)
   - **Environment:** Check ✅ **Preview** (and optionally Development)
   - ⚠️ **Important:** Make sure **Production is NOT checked**
   - Click "Save" or "Add"
3. Add second variable for Preview:
   - Click "Add New" or "+" button again
   - **Key:** `VITE_ENVIRONMENT`
   - **Value:** `staging`
   - **Environment:** Check ✅ **Preview** (and optionally Development)
   - ⚠️ **Important:** Make sure **Production is NOT checked**
   - Click "Save" or "Add"

## Expected Result

After this setup, you should have:

**Production Environment Variables:**
- `VITE_INSTANTDB_APP_ID` = `f5937544-d918-4dc7-bb05-5f4a8cae65b3` (Production only)
- `VITE_ENVIRONMENT` = `production` (Production only)

**Preview Environment Variables:**
- `VITE_INSTANTDB_APP_ID` = `fdb09c88-e5eb-4d54-a09c-dd8cc5cef020` (Preview only)
- `VITE_ENVIRONMENT` = `staging` (Preview only)

## Next Steps

After adding Preview environment variables:

1. **Redeploy the preview deployment:**
   - Go to Deployments tab
   - Find the deployment from `develop` branch
   - Click the three dots (⋯) menu
   - Click "Redeploy"
   - Or push to `develop` again to trigger a new deployment

2. **Test staging deployment:**
   - Visit the preview/staging URL
   - Sign in (will create account in staging database - separate from production)
   - Verify it's using staging database (empty, no production songs)
