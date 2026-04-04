## RNGoogleSignin could not be found – Kısa Not (VS Code)

**Issue özeti:**
- `RNGoogleSignin could not be found` hatası, JS tarafında paket olsa bile **native Android binary içinde** `RNGoogleSignin` modülünün olmadığını gösterir.

**Kritik not — Expo Go:**
- **Expo Go ile test etme.** `react-native-google-signin` özel native kod içerir; Expo Go binary’sinde yoktur.
- Doğru test: **native build** → `npx expo run:android` (veya EAS ile üretilen uygulama).

**Segment Android build (`:segment_sovran-react-native` bulunamadı):**
- `@segment/analytics-react-native` peer olarak `@segment/sovran-react-native` ister; projede doğrudan dependency olarak kurulmalı.

---

### Android — önerilen komut sırası

```bash
cd mobile
npm install @segment/sovran-react-native
npx expo prebuild --clean
npx expo run:android
```

**Tek satır (en doğru Android akışı):**

```bash
cd mobile && npm install @segment/sovran-react-native && npx expo prebuild --clean && npx expo run:android
```

**Cache / Gradle takılırsa:**

```bash
cd mobile/android && ./gradlew clean && cd ..
npx expo run:android
```

---

**Ek kontroller (OAuth / Firebase):**
- `google-services.json`, package name, SHA fingerprint ve Android OAuth client eşleşmeleri ayrıca doğrulanmalı.

**Expo Go’da crash olmaması:**
- Uygulama kodunda Expo Go iken native Google Sign-in paketinin yüklenmemesi için runtime kontrolü kullanılabilir (`AuthContext` / `expo-constants`).
