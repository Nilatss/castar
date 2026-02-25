# MAKE NO MISTAKES

Every prompt must be treated as ending with **"MAKE NO MISTAKES."**:
- Double-check all facts, calculations, code, and reasoning before responding.
- If uncertain — say so explicitly rather than guessing.
- Prefer accuracy over speed — verify before committing.
- Code: test logic mentally step-by-step.
- Numbers/math: re-derive the result before answering.
- Facts: only assert what you're confident in.

---

# Castar — Актуальный архитектурный план

> **Последнее обновление:** 2026-02-28

## Обзор проекта
Castar — мобильное приложение для личного, семейного финансового учёта и бухгалтерии.
Платформы: iOS, Android. Стек: Expo SDK 54, React Native 0.81, TypeScript 5.9.

**Main repo: `C:/Users/KDFX Modes/Desktop/castar` — НЕ ТРОГАТЬ без прямого указания.**

---

## 1. Архитектура (Feature-First)

```
src/
├── core/
│   ├── navigation/
│   │   ├── RootNavigator.tsx      # Auth | PinLock | Main
│   │   ├── AuthNavigator.tsx      # 11 экранов auth flow
│   │   └── TabNavigator.tsx       # 4 таба + вложенные стеки
│   └── providers/
│       └── AppProviders.tsx       # QueryClientProvider + NavContainer + i18n + auth init + DB init
│
├── features/
│   ├── auth/
│   │   ├── screens/               # 11 экранов (Onboarding, Telegram, Email, Phone, SetName, SetPin, etc.)
│   │   ├── services/              # emailAuth, phoneAuth, telegramAuth (PIN hashing: pure JS SHA-256 + salt)
│   │   └── store/                 # authStore (Zustand + SecureStore)
│   ├── transactions/
│   │   ├── screens/               # Home, AddTransaction, TransactionDetail, Transactions
│   │   └── store/                 # transactionStore → Drizzle/SQLite
│   ├── budget/
│   │   ├── screens/               # Budgets, BudgetDetail, CreateBudget, FamilyBudget
│   │   └── store/                 # budgetStore → Drizzle/SQLite
│   ├── categories/
│   │   ├── screens/               # Categories, CreateCategory
│   │   └── store/                 # categoryStore → Drizzle/SQLite
│   ├── analytics/
│   │   ├── screens/               # Analytics (→ Monitoring tab)
│   │   └── store/                 # analyticsStore
│   ├── tasks/
│   │   └── screens/               # Tasks (stub)
│   └── profile/
│       ├── screens/               # Profile (встроенная Settings модалка), SubscriptionManagement
│       └── store/                 # profileStore
│
├── shared/
│   ├── constants/                 # colors, typography, spacing, config, defaultCategories, scaling
│   ├── i18n/                      # uz, ru, en, be, uk, kk, de, az, pl, ka, zh (11 языков)
│   ├── services/
│   │   ├── api/                   # ✅ apiClient + queryClient + RQ hooks (7 entity modules)
│   │   ├── analytics/             # ✅ PostHog (posthog.ts)
│   │   ├── currency/              # ✅ open.er-api.com + SecureStore кэш 24ч
│   │   ├── database/              # ✅ Drizzle ORM (7 schema, 7 query modules)
│   │   │   ├── schema/            # 7 таблиц (Drizzle schema definitions)
│   │   │   ├── drizzle/           # auto-generated migrations (.sql + journal)
│   │   │   ├── *Queries.ts        # 7 query modules
│   │   │   ├── connection.ts      # async initDb() + WAL mode + foreign keys (initEncryptedDb kept as alias)
│   │   │   ├── migrations.ts      # bridge from legacy + migrate()
│   │   │   ├── seed.ts            # seedDefaults(userId)
│   │   │   └── index.ts           # barrel: *Repository aliases + initDb
│   │   ├── biometric.ts           # ✅ Safe wrapper for expo-local-authentication (Expo Go fallback)
│   │   ├── validation/            # ✅ Zod schemas
│   │   ├── sync/syncService.ts    # Stub (backend sync fully implemented)
│   │   └── voice/                 # ✅ voiceParser + cloudRecognition + offlineRecognition + voiceService
│   ├── components/
│   │   ├── GlowImage.tsx          # GPU-accelerated glow backgrounds (PNG <Image>)
│   │   └── svg/AuthSvgs.tsx       # Shared JSX SVG components for auth screens
│   ├── types/                     # common.ts, navigation.ts
│   └── utils/                     # formatCurrency, formatDate
│
└── assets/
    └── images/
        ├── glow.png            # 256x256 standard radial gradient (GPU-scaled)
        └── glow-vivid.png      # 256x256 vivid radial gradient (GPU-scaled)

backend/
├── src/
│   ├── index.ts            # Hono entry + CORS (blocks browser origins) + health + route mounting
│   ├── types.ts            # Env (DB, JWT_SECRET, RESEND_API_KEY, ESKIZ_TOKEN, TELEGRAM_BOT_TOKEN, GOOGLE_CLOUD_STT_KEY)
│   ├── middleware/auth.ts  # ✅ JWT verify middleware
│   ├── services/
│   │   ├── jwt.ts          # ✅ sign/verify (jose)
│   │   ├── telegram.ts     # ✅ HMAC-SHA256 валидация + Login Widget HTML + Authorized callback HTML
│   │   ├── email.ts        # ✅ Resend.com API (реальная отправка)
│   │   └── sms.ts          # ✅ Eskiz.uz API (реальная отправка SMS)
│   └── routes/
│       ├── auth.ts         # ✅ 702 строк: Telegram, Email OTP (D1+Resend), Phone OTP (D1+Eskiz), upsertUser(), rate limiting, JWT refresh
│       ├── voice.ts        # ✅ POST /api/voice/recognize (Google STT V2 proxy, JWT protected)
│       ├── transactions.ts # ✅ Full CRUD + balance adjustment + summary
│       ├── categories.ts   # ✅ Full CRUD + batch cleanup
│       ├── accounts.ts     # ✅ Full CRUD + soft archive
│       ├── budgets.ts      # ✅ Full CRUD + enriched GET (spent/remaining/%)
│       ├── recurrings.ts   # ✅ Full CRUD + pause toggle
│       ├── settings.ts     # ✅ GET/PUT upsert
│       └── sync.ts         # ✅ Push/Pull/Full sync (bulk operations, 500 ops max)
├── migrations/
│   ├── 0001_initial.sql         # ✅ APPLIED (7 таблиц, 15 индексов)
│   └── 0002_rate_limits.sql     # ✅ APPLIED (rate_limits таблица)
├── wrangler.toml
└── package.json
```

---

## 2. Навигация (реальная, из кода)

```
RootNavigator (conditional)
├── AuthNavigator (if !isOnboarded)
│   ├── Onboarding         ✅ полный UI
│   ├── TermsOfUse         ✅ полный UI
│   ├── PrivacyPolicy      ✅ полный UI
│   ├── TelegramAuth       ✅ WebView → Worker → deep link callback
│   ├── EmailAuth          ✅ ввод email → send code
│   ├── EmailVerify        ✅ ввод 4-digit кода → verify → JWT
│   ├── PhoneAuth          ✅ ввод телефона → send SMS
│   ├── PhoneVerify        ✅ ввод 4-digit кода → verify → JWT
│   ├── SetName            ✅ ввод имени (persists across logout)
│   └── SetPin             ✅ установка PIN-кода
│
├── PinLock (if isOnboarded && !isPinVerified)
│   └── PinLockScreen      ✅ верификация PIN при запуске (SHA-256 hash) + биометрия (опционально)
│
└── TabNavigator (if isOnboarded && isPinVerified) — 4 таба
    ├── HomeTab → Home, AddTransaction, TransactionDetail
    ├── MonitoringTab → Analytics
    ├── TasksTab → Tasks (stub)
    └── ProfileTab → Profile (встроенные модалки), SubscriptionManagement, Settings, Categories, CreateCategory
```

---

## 3. Auth Flow

### Auth Services (src/features/auth/services/)
- **telegramAuth.ts** — getTelegramAuthUrl(), parseAuthCallback(), PIN hashing (pure JS SHA-256 + salt, no native modules), persistPin(), verifyPersistedPin(), hasPersistedPin(), clearAuth, loadPersistedAuth, lockout
- **emailAuth.ts** — sendVerificationCode(email), verifyEmailCode(email, code)
- **phoneAuth.ts** — sendPhoneVerificationCode(phone), verifyPhoneCode(phone, code)

### Auth Store (Zustand + SecureStore)
- `isAuthenticated`, `isOnboarded`, `isLoading`, `isPinVerified`
- `token`, `userId`, `telegramUser`, `displayName`, `hasPin`
- `initializeAuth()` — восстановление сессии из SecureStore
- `loginWithTelegram(token, user)`, `loginWithEmail(token, email)`, `loginWithPhone(token, phone)`
- `setDisplayNameAndContinue(name)`, `setPinAndContinue(pin)`, `verifyPin(pin)` — uses verifyPersistedPin (hash comparison)
- `setPinVerified()` — synchronous, marks PIN as verified this session (used by PinLockScreen after successful local verify)
- `logout()` — сохраняет displayName для returning users

### Auth Flow
```
Onboarding → [Telegram | Email → EmailVerify | Phone → PhoneVerify]
           → SetName → SetPin → Main App

При повторном запуске: PinLock → Main App
При returning user: Auth → (skip SetName/SetPin) → Main App
```

### Backend endpoints (полный список)
Worker URL: `https://castar-auth.ivcswebofficial.workers.dev`

**Auth (public, no JWT):**
- `GET  /auth/telegram?bot=castar_bot` — Telegram Login Widget page
- `GET  /auth/telegram/callback` — HMAC-SHA256 → JWT → deep link + HTML fallback → upsertUser(telegram_id)
- `POST /auth/email/send-code` — D1 OTP + Resend.com + rate limit 60s + per-IP rate limit
- `POST /auth/email/verify-code` — verify OTP (D1) → JWT → upsertUser(email)
- `POST /auth/phone/send-code` — D1 OTP + Eskiz.uz SMS + rate limit 60s + per-IP rate limit
- `POST /auth/phone/verify-code` — verify OTP (D1) → JWT → upsertUser(phone)
- `POST /auth/refresh` — JWT refresh (valid JWT → new 30d JWT)

**Voice (protected, JWT required):**
- `POST /api/voice/recognize` — Google Cloud STT V2 proxy

**CRUD (protected, JWT required):**
- `GET/POST /transactions`, `GET/PUT/DELETE /transactions/:id`, `GET /transactions/summary`
- `GET/POST /categories`, `PUT/DELETE /categories/:id`
- `GET/POST /accounts`, `PUT/DELETE /accounts/:id`
- `GET/POST /budgets`, `PUT/DELETE /budgets/:id`
- `GET/POST /recurrings`, `PUT/DELETE /recurrings/:id`, `PATCH /recurrings/:id/pause`
- `GET/PUT /settings`

**Sync (protected, JWT required):**
- `POST /sync/push` — bulk push (до 500 операций)
- `POST /sync/pull` — pull changes since last_synced_at
- `POST /sync/full` — push + pull в одном запросе

---

## 4. Database Layer (Drizzle ORM + expo-sqlite)

### Schema (src/shared/services/database/schema/)
7 таблиц: categories, accounts, transactions, budgets, recurrings, syncQueue, exchangeRates.
- camelCase keys (TypeScript) → snake_case columns (SQLite)
- Booleans: `integer('...', { mode: 'boolean' })`
- Enums: `text('...', { enum: [...] })`
- Nullable поля: `string | null` (не `undefined`)

### Encryption (SQLCipher) — DEFERRED
- SQLCipher **отложен** до создания кастомного нативного билда (expo prebuild / EAS Build)
- `app.json` plugins: `"expo-sqlite"` (без `useSQLCipher`)
- `connection.ts` использует стандартный expo-sqlite без шифрования
- Стандартный expo-sqlite работает в Expo Go и dev builds
- **Будет восстановлено:** `["expo-sqlite", { "useSQLCipher": true }]` + PRAGMA key + SecureStore ключ

### Query Modules (src/shared/services/database/*Queries.ts)
- `categoryQueries` — findByUser, findByType, countByUser, insert, update, delete
- `accountQueries` — findByUser, adjustBalance, insert, update, delete
- `transactionQueries` — findByUser, findByFilters, getSummary, sumByCategory, insert, update, delete
- `budgetQueries` — findByUser, findByCategory, findActive, deactivate, insert, update, delete
- `recurringQueries` — findByUser, findDue, pause, resume, updateNextDate, insert, update, delete
- `syncQueueQueries` — enqueue, findPending, markSynced, recordFailure, pendingCount, clearAll
- `exchangeRateQueries` — для будущей SQLite интеграции курсов валют

### Connection (async init)
`initDb()` → WAL mode → foreign keys → `drizzle(expoDb, { schema })`
`initEncryptedDb()` kept as backward-compatible alias for `initDb()`.
Backward-compatible Proxy exports: `db` and `rawDb` forward to initialized instance.
`reopenDb()` — force re-open on NativeDatabase deallocation (dev builds / hot reload).
`withDbRetry(fn)` — auto-retry on "deallocated" errors.

### Data Persistence (app restart)
AppProviders startup sequence:
1. `initEncryptedDb()` — open SQLite file
2. `runMigrations()` — create tables if missing
3. `initializeAuth()` + `initializeSettings()` — restore auth/settings from SecureStore
4. **Load SQLite → Zustand stores** (if userId available):
   - `budgetQueries.findByUser(userId)` → `useBudgetStore.setBudgets()`
   - `transactionQueries.findByUser(userId)` → `useTransactionStore.setTransactions()`
   - `categoryQueries.findByUser(userId)` → `useCategoryStore.setCategories()`

All user data (budgets, transactions, categories) persists across app restarts via SQLite.

---

## 5. State Management (Zustand)

### authStore — см. §3

### transactionStore → Drizzle/SQLite
- `transactions[]`, `isLoading`, `filters`
- `addTransaction()`, `updateTransaction()`, `removeTransaction()`
- `setFilters()`, `resetFilters()`

### budgetStore → Drizzle/SQLite
- `budgets[]`, `isLoading`
- `addBudget()`, `updateBudget()`, `removeBudget()`
- `enrichBudget()` — автоматический расчёт spent/remaining/% через sumByCategory

### categoryStore → Drizzle/SQLite
- `categories[]`, `isLoading`
- `addCategory()`, `updateCategory()`, `removeCategory()`

### analyticsStore
- `period`, `summary`, `isLoading`
- `setPeriod()`, `setSummary()`

### profileStore
- `user`, `settings` (theme, notifications, biometricLock)
- `updateUser()`, `updateSettings()`, `setDefaultCurrency()`, `setLanguage()`, `setBiometricLock()`
- `language`, `currency`, `initializeSettings()` — персистентность через SecureStore (вкл. biometric)

---

## 6. React Query (Server State)

- `@tanstack/react-query` v5.90
- `apiClient.ts` — HTTP клиент с auto-JWT из authStore, snake↔camel конвертеры, ApiError, `{ ok, data }` envelope parsing
- `queryClient.ts` — staleTime 5мин, gcTime 10мин, retry 2x (5xx only), query key factories
- `types.ts` — Server types + Request DTOs + Sync types (все в camelCase)
- **7 hook-модулей:**
  - `useTransactions` — list(filters), detail(id), summary(period), create, update, delete
  - `useCategories` — list, create, update, delete (invalidates transactions + budgets)
  - `useAccounts` — list(includeArchived?), create, update, delete
  - `useBudgets` — list (enriched), create, update, delete
  - `useRecurrings` — list, create, update, pause(toggle), delete
  - `useSettings` — current (staleTime 24ч), update (optimistic cache)
  - `useSync` — push, pull, full (invalidates all entities)
- `AppProviders.tsx` — обёрнут в `<QueryClientProvider>`

---

## 7. Дизайн-система

### Цвета (Dark Theme)
- Background: `#101010`, Surface: `#1A1A1A`, Surface elevated: `#242424`
- White: 100% → 4% (8 уровней прозрачности)
- Semantic: warning `#FAAD14`, error `#F55858`, info `#4B8DF5`, success `#17E56C`
- Aliases: text (white.90), textSecondary (white.60), textTertiary (white.40), border (white.8)

### Типографика (Inter)
- Weights: Regular (400), Medium (500), SemiBold (600), Bold (700)
- Sizes: xs(12) → 4xl(40)
- Стили: heading1-5, bodyLarge*, body*, small*, caption*

### Spacing
- xs(4), sm(8), md(12), base(16), lg(20), xl(24), 2xl(32), 3xl(40), 4xl(48), 5xl(64)
- Grid: 6 колонок, margin 24, gutter 20
- Border Radius: sm(4), md(8), lg(12), xl(16), 2xl(20), 3xl(24), full(9999)

---

## 8. Зависимости (реальный package.json)

### Core
- expo ~54.0.33, react 19.1.0, react-native 0.81.5, typescript ~5.9.2

### Navigation
- @react-navigation/native, bottom-tabs, native-stack (**v7**)

### State & Data
- zustand ^5.0.11, @tanstack/react-query ^5.90
- zod ^4.3.6

### Database
- drizzle-orm ^0.45.1, expo-sqlite ~16.0.10 (standard, SQLCipher deferred)
- drizzle-kit ^0.31.9 (dev), babel-plugin-inline-import ^3.0.0 (dev)

### i18n
- i18next ^25.8.8, react-i18next ^16.5.4, expo-localization

### UI & Animation
- expo-linear-gradient, react-native-svg, @expo-google-fonts/inter
- expo-haptics, react-native-reanimated, react-native-gesture-handler
- expo-blur

### Auth & Security
- expo-secure-store (JWT + PIN hash + user persistence)
- expo-local-authentication (biometric unlock — fingerprint / Face ID)
- Pure JS SHA-256 (FIPS 180-4 implementation in telegramAuth.ts — no native crypto modules needed)
- crypto.getRandomValues (salt generation — built into Hermes since RN 0.73, Math.random fallback)
- react-native-webview (Telegram OAuth)
- expo-linking (deep link callback: castar://)

### Voice
- expo-av (аудио запись), react-native-vosk (offline STT)
- @react-native-community/netinfo (online/offline detection)

### Analytics
- posthog-react-native (EU instance, screen tracking)

### Utils
- date-fns ^4.1.0, uuid ^13.0.0

### Dev
- patch-package, sharp, @types/react, @types/uuid

---

## 9. Безопасность

| Мера | Статус | Детали |
|------|--------|--------|
| PIN hashing | ✅ | Pure JS SHA-256 (FIPS 180-4) + random salt, stored in SecureStore. No native crypto modules needed. |
| SQLite encryption | ⏳ | SQLCipher deferred — will be enabled with custom native build (expo prebuild / EAS Build) |
| JWT auth | ✅ | Bearer token, 30d expiry, jose HS256 |
| JWT refresh | ✅ | `POST /auth/refresh` — new 30d token |
| CORS | ✅ | Blocks all browser origins, allows mobile (no Origin header) |
| Voice route | ✅ | JWT auth middleware (moved from public to protected) |
| Per-IP rate limit | ✅ | D1 `rate_limits` table, 10 OTP sends / 15min per IP |
| OTP storage | ✅ | D1 persistent (not in-memory), 5min expiry, 3 attempts, 60s cooldown |
| Biometric unlock | ✅ | expo-local-authentication + safe wrapper (Expo Go fallback), toggle in Profile, auto-prompt on PinLock |
| OTP CSPRNG | ⏳ | TODO: replace Math.random() with crypto.getRandomValues() |
| OTP console.log | ⏳ | TODO: remove in production |

---

## 10. Текущий статус

### Прогресс по фазам
| Фаза | Статус | Прогресс |
|------|--------|----------|
| 1. Фундамент | ✅ Завершена | 100% |
| 1.5. Auth Flow | ✅ Завершена | 100% |
| 2. UI экранов | 🟡 В процессе | ~20% (Home + Profile + Subscription готовы) |
| 3. Локальная БД | ✅ Завершена | 100% |
| 4. Backend | 🟡 В процессе | ~98% (остались: секреты Eskiz/STT + OTP hardening) |
| 5. Продвинутые фичи | 🟡 В процессе | ~10% (биометрия готова) |
| 6. Кастомизация | ⬜ Не начата | 0% |

### DONE ✅

#### Фаза 1 — Фундамент
- [x] Feature-first архитектура
- [x] React Navigation v7: Auth (11 screens) + PinLock + 4 таба
- [x] 6 Zustand сторов (auth, transaction, budget, category, analytics, profile)
- [x] TypeScript типы (common.ts, navigation.ts)
- [x] Дизайн-система: colors (dark #101010), typography (Inter), spacing
- [x] i18n: 11 языков (uz, ru, en, be, uk, kk, de, az, pl, ka, zh), auto-detection
- [x] config.ts с backend URL + bot username

#### Фаза 1.5 — Auth Flow
- [x] 11 auth screens — полный Figma UI
- [x] Auth services: telegramAuth, emailAuth, phoneAuth
- [x] Auth store: initializeAuth, 3 login метода, PIN verify, SecureStore persistence

#### Фаза 2 (частично) — UI
- [x] ProfileScreen — полный Figma UI (2500+ строк)
- [x] SubscriptionManagementScreen — полный Figma UI, perf optimized
- [x] HomeScreen — layout по Figma (дата i18n, приветствие, budget card, period pills, spent/remaining, action кнопки, GPU glow)
- [x] TasksScreen — stub
- [x] 4 таба (Home, Monitoring, Tasks, Profile) + кастомный таб-бар
- [x] Currency picker (26 валют, live курсы, radio selection)
- [x] Language picker (11 языков, radio selection)
- [x] Settings модалка (Name, Telegram, Phone, Email, Save, Delete account)
- [x] OTP верификация телефона/email из настроек
- [x] Персистентность: язык + валюта в SecureStore

#### Фаза 3 — Локальная БД (Drizzle ORM)
- [x] expo-sqlite + Drizzle ORM (7 schema, 7 query modules)
- [ ] SQLCipher encryption — deferred until custom native build (expo prebuild / EAS Build)
- [x] Zustand сторы интегрированы с SQLite
- [x] Zod validation schemas
- [x] SyncQueue для будущей синхронизации
- [x] Migrations run on app start (AppProviders → runMigrations())
- [x] Data persistence: SQLite → Zustand stores loaded on app start (budgets, transactions, categories)
- [x] reopenDb() + withDbRetry() for NativeDatabase deallocation recovery
- [x] Budget auto-conversion on profile currency change (convertCurrency → update DB + store)

#### Фаза 4 — Backend
- [x] Cloudflare Worker задеплоен
- [x] D1 миграции ПРИМЕНЕНЫ (8 таблиц: users, otp_codes, categories, accounts, transactions, budgets, recurrings, rate_limits)
- [x] JWT service + middleware + refresh endpoint
- [x] Telegram auth — полный цикл
- [x] Email OTP — D1 + Resend.com
- [x] Phone OTP — D1 + Eskiz.uz
- [x] User creation при регистрации (upsertUser)
- [x] CRUD routes — полная реализация с Zod валидацией
- [x] Sync endpoint — push/pull/full (390 строк)
- [x] React Query — 7 hook-модулей + apiClient + queryClient
- [x] Безопасность: PIN hash, CORS, voice auth, JWT refresh, rate limiting

#### Performance Optimization ✅
- [x] useShallow, React.memo, useCallback/useMemo
- [x] SvgXml → JSX SVG (0 SvgXml в проекте)
- [x] Lazy i18n (1 язык при старте, 10 отложены)
- [x] SVG RadialGradient → GPU PNG (glow.png + glow-vivid.png)
- [x] Анимации модалок/попапов оптимизированы
- [x] experimentalBlurMethod="dimezisBlurView" (Android)

#### Биометрия (2026-02-28) ✅
- [x] expo-local-authentication + app.json plugin (faceIDPermission)
- [x] Safe wrapper `biometric.ts` — lazy require, Expo Go fallback (все функции → false/fail)
- [x] profileStore: `setBiometricLock()` + SecureStore persistence (`castar_biometric_lock`)
- [x] PinLockScreen: системный промпт на mount (300ms delay) + shield-кнопка на keypad + fallback на PIN
- [x] ProfileScreen: тоггл биометрии (IOSSwitch) с проверкой hardware/enrollment + auth для подтверждения
- [x] i18n: 6 ключей (biometricPrompt, usePin, biometricLock, biometricLockSubtitle, biometricNotAvailable, biometricNotEnrolled) × 11 языков

#### Bug Fixes (2026-02-27) ✅
- [x] PIN SetPinScreen: не переходил после подтверждения — ReferenceError из-за crypto.subtle/TextEncoder
  - Решение: заменён Web Crypto API → pure JS SHA-256 (FIPS 180-4), 0 нативных зависимостей
  - hashPin() теперь синхронный, salt через crypto.getRandomValues с Math.random fallback
- [x] PIN PinLockScreen: не переходил после верификации — redundant async verifyPin()
  - Решение: добавлен синхронный setPinVerified() в authStore, PinLockScreen использует его напрямую
- [x] GlowImage tintColor: не работал на New Architecture (Fabric)
  - Решение: tintColor перенесён из style prop в Image component prop
- [x] SetPinScreen confirm phase: ненадёжные animation callbacks
  - Решение: заменён showSuccessState(callback) → setTimeout(800ms) + await setPinAndContinue(pin)

### TODO 📋

#### Фаза 2 (продолжение) — UI экранов (ждёт дизайн)
- [ ] AddTransactionScreen (калькулятор + voice input)
- [ ] TransactionDetailScreen
- [ ] TransactionsScreen (список с фильтрами)
- [ ] BudgetsScreen + BudgetDetailScreen + CreateBudgetScreen
- [ ] AnalyticsScreen (нужен react-native-gifted-charts)
- [ ] CategoriesScreen + CreateCategoryScreen
- [ ] Shared UI компоненты (Button, Input, Card, etc.)

#### Фаза 4 (остаток)
- [ ] `wrangler secret put ESKIZ_TOKEN` (нужен реальный токен)
- [ ] `wrangler secret put GOOGLE_CLOUD_STT_KEY`
- [ ] OTP: Math.random() → crypto.getRandomValues()
- [ ] OTP: убрать console.log кода

#### Фаза 5 — Продвинутые фичи
- [x] Биометрия (expo-local-authentication) ✅
- [ ] Семейные бюджеты
- [ ] Повторяющиеся транзакции
- [ ] Push-уведомления
- [ ] Экспорт (CSV/PDF)

#### Фаза 6 — Кастомизация
- [ ] Тёмная/светлая тема
- [ ] Смена иконки приложения

---

## 11. Конфигурация

- **App:** Castar (bundle: castar)
- **Deep link:** castar://
- **Portrait only, New Architecture enabled**
- **iOS** (tablet support) + **Android** (edge-to-edge)
- **Backend:** https://castar-auth.ivcswebofficial.workers.dev
- **D1 Database:** castar-db (WEUR, id: e658fde0-7bbe-46ad-a52e-0c528bfba242)
- **Telegram bot:** @castar_bot
- **Языки (i18n):** uz, ru, en, be, uk, kk, de, az, pl, ka, zh — 11 языков, auto-detection, fallback: en
- **Валюты:** UZS (default), USD, EUR, RUB, GBP, TRY, KZT, CNY, JPY, KRW, CHF, AED, INR, BRL, CAD, AUD, PLN, UAH, GEL, BYN, AZN, AMD, KGS, TJS, MDL, TMT — 26 валют (open.er-api.com, кэш 24ч)
- **Resend.com:** from `Castar <onboarding@resend.dev>` (бесплатный план)
- **Plugins:** expo-localization, expo-secure-store, expo-sqlite, expo-asset, expo-local-authentication

> **ВАЖНО:** Название пишется **Castar** или **castar**. Никогда не писать "CaStar" (s с большой буквы).
