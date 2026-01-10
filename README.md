# Strumkey - Ukulele Group Web App

A web application for ukulele group organizers and members to create, share, and manage songs, songbooks, and group meetings.

## Tech Stack

- **Frontend**: React 18 with Vite
- **Backend/Database**: InstantDB (real-time data, auth, permissions)
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Hosting**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- InstantDB account (get your App ID from [InstantDB Dashboard](https://instantdb.com))

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your InstantDB App ID:
```
VITE_INSTANTDB_APP_ID=your_app_id_here
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Initial Setup

1. **Configure InstantDB Schema**: 
   - The schema is defined in `src/instant.schema.ts`
   - After making schema changes, sync them to InstantDB:
     ```bash
     npm run sync-schema
     ```
   - This will push your schema changes to your InstantDB app
   - Set up permissions from `src/db/permissions.md` (configure in InstantDB dashboard)

2. **Seed Chord Library**:
   - Once authenticated, you can run the chord seeding function
   - Import and call `seedChords(db)` from `src/data/chord-seed.js`

## Project Structure

```
src/
├── components/       # Reusable UI components
├── contexts/         # React contexts (Auth, etc.)
├── db/              # InstantDB schema and queries
├── pages/           # Page components
├── utils/           # Utility functions
├── data/            # Seed data and static data
└── App.jsx          # Main app component with routing
```

## Features

- ✅ User authentication with magic links
- ✅ Create and edit songs with chord notation
- ✅ Share songs with groups
- ✅ Create songbooks (private and group)
- ✅ Group management
- ✅ Schedule meetings with RSVP
- ✅ Real-time data synchronization

## Development Roadmap

See the comprehensive plan document for detailed feature roadmap and implementation timeline.

## Environment Variables

For local development, see `.env.example` for required variables:

- `VITE_INSTANTDB_APP_ID`: Your InstantDB application ID
- `VITE_ENVIRONMENT`: Set to `development` for local development (Vercel sets this automatically for deployments)

**Important:** Never commit `.env` file to Git. Copy `.env.example` to `.env` and add your actual values.

## Available Commands

- `npm run dev` - Start development server (automatically clears cache when config files change)
- `npm run dev:clean` - Force clear cache and start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run sync-schema` - Sync schema changes to InstantDB (run after modifying `src/instant.schema.ts`)
- `npm run sync-perms` - Sync permissions changes to InstantDB (run after modifying `src/instant.perms.ts`)
- `npm run sync-all` - Sync both schema and permissions to InstantDB
- `npm run watch-sync` - Automatically watch and sync schema/permissions on file changes
- `npm run clean:cache` - Clear Vite cache (fixes most stale code issues)
- `npm run clean:all` - Clear all caches (Vite, node_modules cache, dist)

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready to deploy to Vercel or any static hosting service.

## Deployment

This app is configured for deployment to Vercel with separate staging and production environments.

### Quick Start

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

**Summary:**
- **Production**: Deployed from `main` branch → Production domain
- **Staging**: Deployed from `develop` branch → Staging URL (vercel.app subdomain)
- **Separate databases**: Staging and production use different InstantDB apps for complete isolation

### Environment Variables

For deployment, configure these environment variables in Vercel:

- `VITE_INSTANTDB_APP_ID`: Your InstantDB App ID (different for staging and production)
- `VITE_ENVIRONMENT`: Set to `production` for production, `staging` for staging

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup instructions.

### Deployment Workflow

1. **Test in staging:**
   ```bash
   git checkout develop
   # Make changes
   git add .
   git commit -m "Add new feature"
   git push origin develop
   # Automatically deploys to staging
   ```

2. **Deploy to production (when ready):**
   ```bash
   git checkout main
   git merge develop
   git push origin main
   # Automatically deploys to production
   ```

For more details, troubleshooting, and database update procedures, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Schema Changes

When you modify the schema in `src/instant.schema.ts` or permissions in `src/instant.perms.ts`, you need to sync them to InstantDB.

### Manual Sync

```bash
npm run sync-schema  # Sync schema changes
npm run sync-perms   # Sync permissions changes
npm run sync-all     # Sync both schema and permissions
```

### Automatic Sync (Recommended for Development)

For automatic syncing during development, you can run the watch script:

```bash
npm run watch-sync
```

This will watch for changes to `instant.schema.ts` and `instant.perms.ts` and automatically sync them to InstantDB whenever you save the files. You can run this in a separate terminal alongside your dev server.

Make sure your `.env` file contains your `VITE_INSTANTDB_APP_ID`.

## Troubleshooting

### Dev Server Showing Stale Code

The dev server now automatically clears cache when configuration files (`vite.config.js`, `package.json`, `.env`) are modified. If you're still experiencing stale code issues:

1. **Force clear cache and restart**:
   ```bash
   npm run dev:clean
   ```
   This forces cache clearing before starting the dev server.

2. **Manual cache clear**:
   ```bash
   npm run clean:cache
   npm run dev
   ```

3. **Hard refresh browser**:
   - Chrome/Edge: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Firefox: `Ctrl+F5` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Safari: `Cmd+Option+R` (Mac)

4. **Clear browser cache**:
   - Open DevTools (F12)
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

5. **If issues persist**:
   ```bash
   npm run clean:all
   npm install
   npm run dev
   ```

### Environment Variable Changes Not Reflecting

Vite caches environment variables. After changing `.env`:
- Stop the dev server
- Restart with `npm run dev` or `npm run dev:clean`

### HMR (Hot Module Replacement) Not Working

- Check browser console for errors
- Ensure you're accessing `http://localhost:3000` (not a cached IP)
- Try clearing cache: `npm run clean:cache`
- Restart dev server

### "Cannot find module" Errors

- Clear all caches: `npm run clean:all`
- Reinstall dependencies: `rm -rf node_modules package-lock.json && npm install`

## License

MIT

