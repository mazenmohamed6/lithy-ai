# LITHY AI — OAuth Provider Setup

## Supabase Project
- **URL:** https://pobeisftgpkbgpnspser.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/pobeisftgpkbgpnspser
- **Auth Settings:** Authentication → Providers

---

## 1. Google
1. https://console.cloud.google.com/apis/credentials
2. أنشئ مشروع → **OAuth consent screen** (External)
3. في **Authorized domains** أضف: `pobeisftgpkbgpnspser.supabase.co`
4. **Credentials** → **Create Credentials** → **OAuth client ID** → **Web application**
5. **Authorized redirect URIs:**
   ```
   https://pobeisftgpkbgpnspser.supabase.co/auth/v1/callback
   ```
6. انسخ **Client ID** و **Client Secret**
7. ادخلهم في Supabase Dashboard: Authentication → Providers → Google

---

## 2. GitHub
1. https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**
2. Homepage URL: `https://pobeisftgpkbgpnspser.supabase.co`
3. **Authorization callback URL:**
   ```
   https://pobeisftgpkbgpnspser.supabase.co/auth/v1/callback
   ```
4. انسخ **Client ID** → **Generate a new client secret**
5. ادخلهم في Supabase Dashboard: Authentication → Providers → GitHub

---

## 3. LinkedIn
1. https://www.linkedin.com/developers/apps → **Create app**
2. اسمه مثلاً `LITHY AI`
3. **Products:** اختر **Sign In with LinkedIn**
4. **Auth Redirect URLs:**
   ```
   https://pobeisftgpkbgpnspser.supabase.co/auth/v1/callback
   ```
5. انسخ **Client ID** و **Client Secret**
6. ادخلهم في Supabase Dashboard: Authentication → Providers → LinkedIn

---

## 4. Apple (محتاج Apple Developer $99/year)
1. https://developer.apple.com/account → **Certificates, Identifiers & Profiles**
2. **Identifiers** → **+** → **Services IDs**
3. **Register a Services ID** (مثلاً `com.lithyai.auth`)
4. **Sign In with Apple** → **Configure**
5. **Return URLs:**
   ```
   https://pobeisftgpkbgpnspser.supabase.co/auth/v1/callback
   ```
6. حمل **Private Key** (p8 file) — هتحتاجه لعمل Client Secret
7. Service ID هو Client ID
8. الـ Client Secret بتتولد من Private Key

---

## بعد التفعيل
1. Sign in to LITHY AI: http://localhost:3000/login
2. اختار Google/GitHub/LinkedIn
3. هتتعمل OAuth → هتتعمل redirect لـ `/auth/callback`
4. الـ callback بيعمل `syncUser` → بيسجل المستخدم في Prisma

## لو عايز تختبر OAuth بدون ما تفعل providers:
استخدم email/password signup العادي: http://localhost:3000/signup
