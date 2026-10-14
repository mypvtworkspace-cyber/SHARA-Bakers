/**
 * Sahara Bakers – Production & Dev Full-Stack Launcher
 * 
 * Pre-loads tsx TypeScript ESM loader so that both "node server.ts" (Production / Cloud Run)
 * and "tsx server.ts" (Development) execute cleanly with zero module resolution errors.
 */
import 'tsx';

await import('./src/server/serverCore');
