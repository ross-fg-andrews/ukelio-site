#!/usr/bin/env node

/**
 * Watch script to automatically sync InstantDB schema and permissions on file changes
 */

import { watch, readFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const schemaFile = join(rootDir, 'src', 'instant.schema.ts');
const permsFile = join(rootDir, 'src', 'instant.perms.ts');

const timeouts = {
  schema: null,
  perms: null,
};

function getAppId() {
  try {
    const envPath = join(rootDir, '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const match = envContent.match(/VITE_INSTANTDB_APP_ID=(.+)/);
    return match ? match[1].trim() : null;
  } catch (error) {
    console.error('Error reading .env file:', error.message);
    return null;
  }
}

async function syncSchema() {
  const appId = getAppId();
  if (!appId) {
    console.error('❌ Could not find VITE_INSTANTDB_APP_ID in .env file');
    return;
  }

  console.log('🔄 Syncing schema...');
  try {
    const { stdout, stderr } = await execAsync(
      `npx instant-cli@latest push schema --app ${appId} -y`
    );
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('Planning')) console.error(stderr);
    console.log('✅ Schema synced successfully');
  } catch (error) {
    console.error('❌ Error syncing schema:', error.message);
  }
}

async function syncPerms() {
  const appId = getAppId();
  if (!appId) {
    console.error('❌ Could not find VITE_INSTANTDB_APP_ID in .env file');
    return;
  }

  console.log('🔄 Syncing permissions...');
  try {
    const { stdout, stderr } = await execAsync(
      `npx instant-cli@latest push perms --app ${appId} -y`
    );
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('Planning')) console.error(stderr);
    console.log('✅ Permissions synced successfully');
  } catch (error) {
    console.error('❌ Error syncing permissions:', error.message);
  }
}

function debounceSync(file, syncFn, key) {
  if (timeouts[key]) {
    clearTimeout(timeouts[key]);
  }
  timeouts[key] = setTimeout(() => {
    console.log(`\n📝 Detected change in ${file}`);
    syncFn();
  }, 1000); // Debounce for 1 second
}

// Watch schema file
watch(schemaFile, (eventType) => {
  if (eventType === 'change') {
    debounceSync('instant.schema.ts', syncSchema, 'schema');
  }
}, (error) => {
  if (error) console.error('Error watching schema file:', error);
});

// Watch perms file
watch(permsFile, (eventType) => {
  if (eventType === 'change') {
    debounceSync('instant.perms.ts', syncPerms, 'perms');
  }
}, (error) => {
  if (error) console.error('Error watching perms file:', error);
});

console.log('👀 Watching for changes to instant.schema.ts and instant.perms.ts...');
console.log('   Changes will be automatically synced to InstantDB\n');
