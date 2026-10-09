/**
 * Central Public Configuration for Qrinova (Expo / React Native App)
 * 
 * IMPORTANT:
 * - Only PUBLIC configuration is placed in this file.
 * - This file ensures the standalone production APK works reliably out-of-the-box
 *   without runtime .env dependency issues.
 * - NEVER put private/secret keys (e.g. service_role, secret tokens, db passwords) here.
 */

export const CONFIG = {
  // Supabase Public Storage Configuration
  SUPABASE_URL: 'https://vzjdeqayeprupupwtdin.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable__FEnEK7g-x3DLrJIg6Gkvg_Lhqn_nbY',
  SUPABASE_BUCKET: 'qr-files',

  // Public Backend & Threat Intelligence Endpoints (HTTPS only)
  API_BASE_URL: 'https://vzjdeqayeprupupwtdin.supabase.co',
  SECURITY_API_BASE_URL: 'https://vzjdeqayeprupupwtdin.supabase.co',

  // App Metadata
  APP_NAME: 'Qrinova',
  VERSION: '1.0.0',
};

export default CONFIG;
