# 16TypeTalk — Mobil Uygulama

MBTI tabanlı kişilik danışmanlığı uygulaması. Expo SDK 51 + React Native + TypeScript.

## Gereksinimler

- Node.js 20+
- npm veya yarn
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- iOS: Xcode 15+ (sadece macOS)
- Android: Android Studio + SDK

## Kurulum

```bash
cd mobile
npm install
```

## Geliştirme

```bash
# Expo dev server başlat
npm start

# iOS simulator'da çalıştır
npm run ios

# Android emulator'da çalıştır
npm run android
```

## Proje Yapısı

```
mobile/
├── app/                          # expo-router file-based routing
│   ├── _layout.tsx               # Root layout (SafeAreaProvider)
│   ├── (tabs)/                   # Tab navigator
│   │   ├── _layout.tsx           # 4 tab: Meclis, Geçmiş, Rapor, Profil
│   │   ├── index.tsx             # Ana sayfa
│   │   ├── gecmis.tsx            # Geçmiş oturumlar
│   │   ├── rapor.tsx             # Raporlar
│   │   └── profil.tsx            # Profil + streak
│   ├── meclis-kur.tsx            # Persona seçim ekranı
│   ├── tartisma/[id].tsx         # Chat/tartışma ekranı
│   ├── yanita-derinles.tsx       # Derinleştirme ekranı
│   └── meclis-karar.tsx          # Final rapor ekranı
├── components/
│   └── ShareCard.tsx             # Paylaşılabilir kart (react-native-view-shot)
├── store/
│   └── sessionStore.ts           # Zustand + AsyncStorage
├── types/
│   ├── index.ts                  # Temel tipler
│   └── conversation.ts           # State machine tipleri
├── lib/
│   ├── characterVisuals.ts       # 16 MBTI emoji/renk config
│   └── analytics.ts              # Event tracking
├── app.json                      # Expo config
├── eas.json                      # EAS Build profilleri
└── package.json
```

## Build & Deploy

### 1. EAS'e Giriş

```bash
eas login
# Expo hesabınızla giriş yapın
```

### 2. Proje Kaydı

```bash
eas init
# expo.dev'de proje otomatik oluşturulur
```

### 3. Preview Build (TestFlight / Internal Testing)

```bash
# Her iki platform
npm run build:preview

# Sadece iOS
eas build --platform ios --profile preview

# Sadece Android
eas build --platform android --profile preview
```

### 4. Production Build

```bash
# iOS — App Store
npm run build:ios

# Android — Play Store APK
npm run build:android
```

### 5. Store'a Gönder

```bash
# iOS → App Store Connect
npm run submit:ios

# Android → Google Play Console
npm run submit:android
```

## App Store Connect Kurulumu

1. [App Store Connect](https://appstoreconnect.apple.com)'e gidin
2. "My Apps" → "+" → "New App"
3. Platform: iOS, Name: "16TypeTalk", Bundle ID: `com.typetalk16.app`
4. Primary Language: Turkish
5. SKU: `16typetalk-ios-001`
6. App oluşturduktan sonra `eas.json`'daki `ascAppId`'yi güncelleyin

## Google Play Console Kurulumu

1. [Google Play Console](https://play.google.com/console)'a gidin
2. "Create app" → 16TypeTalk
3. Service account key oluşturup `google-service-account.json` olarak kaydedin
4. `eas.json`'daki `serviceAccountKeyPath` yolunu doğrulayın

## GitHub Actions (CI/CD)

`.github/workflows/eas-build.yml` dosyası otomatik olarak:
- **PR'larda**: TypeScript check + iOS simulator build
- **main push'ta**: Preview build (TestFlight + Android Internal)

### Secret'lar
GitHub repo Settings → Secrets → Actions:
- `EXPO_TOKEN`: [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens) adresinden oluşturun

## Ortam Değişkenleri

```bash
# .env (opsiyonel, API entegrasyonu için)
EXPO_PUBLIC_API_URL=https://api.16typetalk.app
EXPO_PUBLIC_SEGMENT_KEY=your-segment-key
```

## Privacy Nutrition Label (iOS)

App Store Connect'te Privacy bölümünde beyannameyi doldurun:
- **Data Not Collected**: Kullanıcı verisi toplanmıyor (analytics hariç)
- **Analytics**: Uygulama kullanım verisi (anonim)
- **Identifiers**: Device ID (analytics için)

## Lisans

Tüm hakları saklıdır.
