const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

/**
 * Expo dynamic config
 * - app.json'ı base olarak oku
 * - .env.local'ı enjekte et
 * - extra'ya googleSignInWebClientId ekle (mevcut extra korunur)
 */

// .env.local yükle (varsa)
let envLocal = {};
const envLocalPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  envLocal = dotenv.parse(fs.readFileSync(envLocalPath, 'utf8'));
}

// app.json'ı base olarak oku
const appJsonPath = path.join(__dirname, 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8')).expo;

// Mevcut extra'yı koru, googleSignInWebClientId ekle
appJson.extra = appJson.extra || {};
appJson.extra.googleSignInWebClientId = envLocal.GOOGLE_SIGNIN_WEB_CLIENT_ID || null;

module.exports = () => ({ expo: appJson });
