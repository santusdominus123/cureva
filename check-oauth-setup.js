#!/usr/bin/env node

/**
 * Quick OAuth Setup Checker
 * Verifies Google OAuth configuration for DJI Tello app
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Checking Google OAuth Setup...\n');

let hasErrors = false;

// Check 1: .env file exists
console.log('1️⃣ Checking .env file...');
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('   ❌ .env file not found!');
  console.log('   → Copy .env.example to .env and fill in your credentials');
  hasErrors = true;
} else {
  console.log('   ✅ .env file exists');

  // Check 2: Read .env content
  const envContent = fs.readFileSync(envPath, 'utf8');

  // Check 3: VITE_GOOGLE_CLIENT_ID exists
  console.log('\n2️⃣ Checking VITE_GOOGLE_CLIENT_ID...');
  const clientIdMatch = envContent.match(/VITE_GOOGLE_CLIENT_ID=(.+)/);

  if (!clientIdMatch) {
    console.log('   ❌ VITE_GOOGLE_CLIENT_ID not found in .env');
    console.log('   → Add: VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com');
    hasErrors = true;
  } else {
    const clientId = clientIdMatch[1].trim();

    if (clientId === '' || clientId === 'YOUR_CLIENT_ID' || clientId === 'your-client-id') {
      console.log('   ❌ VITE_GOOGLE_CLIENT_ID is not set correctly');
      console.log('   → Current value: ' + clientId);
      console.log('   → Get real Client ID from: https://console.cloud.google.com/apis/credentials');
      hasErrors = true;
    } else if (!clientId.includes('.apps.googleusercontent.com')) {
      console.log('   ⚠️  VITE_GOOGLE_CLIENT_ID format looks incorrect');
      console.log('   → Current value: ' + clientId);
      console.log('   → Expected format: [numbers]-[string].apps.googleusercontent.com');
      hasErrors = true;
    } else {
      console.log('   ✅ VITE_GOOGLE_CLIENT_ID is set');
      console.log('   → Client ID: ' + clientId.substring(0, 30) + '...');
    }
  }

  // Check 4: Firebase config
  console.log('\n3️⃣ Checking Firebase configuration...');
  const firebaseKeys = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  let firebaseComplete = true;
  firebaseKeys.forEach(key => {
    const match = envContent.match(new RegExp(`${key}=(.+)`));
    if (!match || match[1].trim() === '' || match[1].includes('your_') || match[1].includes('your-')) {
      console.log(`   ⚠️  ${key} not configured`);
      firebaseComplete = false;
    }
  });

  if (firebaseComplete) {
    console.log('   ✅ All Firebase keys configured');
  } else {
    console.log('   ⚠️  Some Firebase keys missing (optional for Google Drive)');
  }
}

// Check 5: OAuth redirect configuration
console.log('\n4️⃣ OAuth Redirect URIs to configure in Google Cloud Console:');
console.log('   📍 Development:');
console.log('      http://localhost:5173/drone-camera');
console.log('      http://localhost:3000/drone-camera');
console.log('\n   📍 Production (add your domain):');
console.log('      https://your-domain.com/drone-camera');

console.log('\n5️⃣ Required Google Cloud APIs:');
console.log('   • Google Drive API');
console.log('   • Google+ API (for userinfo)');

console.log('\n6️⃣ OAuth Consent Screen Scopes:');
console.log('   • .../auth/drive.file');
console.log('   • .../auth/userinfo.email');

// Summary
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.log('❌ Setup incomplete - please fix the issues above');
  console.log('\n📖 See GOOGLE_OAUTH_TROUBLESHOOTING.md for detailed instructions');
  process.exit(1);
} else {
  console.log('✅ Basic setup looks good!');
  console.log('\n📝 Next steps:');
  console.log('   1. Verify redirect URIs in Google Cloud Console');
  console.log('   2. Ensure APIs are enabled');
  console.log('   3. Add test users if app is in Testing mode');
  console.log('   4. Restart dev server: npm run dev');
  console.log('   5. Test OAuth: Click "☁️ GDRIVE" button in app');
  console.log('\n📖 Troubleshooting: GOOGLE_OAUTH_TROUBLESHOOTING.md');
  process.exit(0);
}
