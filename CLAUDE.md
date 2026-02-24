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

## Обзор проекта
Castar — мобильное приложение для личного, семейного финансового учёта и бухгалтерии.
Платформы: iOS, Android. Стек: Expo SDK 54, React Native 0.81, TypeScript 5.9.

**Main repo: `C:/Users/KDFX Modes/Desktop/castar` — НЕ ТРОГАТЬ без прямого указания.**
**Worktree: `.../.claude/worktrees/blissful-elgamal` — экспериментальная ветка.**

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
│       └── AppProviders.tsx       # NavigationContainer + StatusBar + i18n + auth init + DB migrations
│
├── features/
│   ├── auth/
│   │   ├── screens/               # 11 экранов (Onboarding, Telegram, Email, Phone, SetName, SetPin, etc.)
│   │   ├── services/              # emailAuth, phoneAuth, telegramAuth
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
│   │   ├── api/apiClient.ts       # HTTP stub (ждёт бэкенд)
│   │   ├── analytics/             # PostHog (posthog.ts)
│   │   ├── currency/              # open.er-api.com + SecureStore кэш 24ч
│   │   ├── database/              # ✅ Drizzle ORM
│   │   │   ├── schema/            # 7 таблиц (Drizzle schema definitions)
│   │   │   ├── drizzle/           # auto-generated migrations (.sql + journal)
│   │   │   ├── *Queries.ts        # 7 query modules
│   │   │   ├── connection.ts      # drizzle(expoDb, { schema }) + rawDb
│   │   │   ├── migrations.ts      # bridge from legacy + migrate()
│   │   │   ├── seed.ts            # seedDefaults(userId)
│   │   │   └── index.ts           # barrel: *Repository aliases
│   │   ├── validation/            # ✅ Zod schemas
│   │   ├── sync/syncService.ts    # Stub
│   │   └── voice/                 # voiceParser + cloudRecognition + offlineRecognition + voiceService
│   ├── components/
│   │   ├── GlowImage.tsx          # GPU-accelerated glow backgrounds (PNG <Image>)
│   │   └── svg/AuthSvgs.tsx       # Shared JSX SVG components for auth screens
│   ├── types/                     # common.ts, navigation.ts
│   └── utils/                     # formatCurrency, formatDate
│
└── assets/
    ├── icons/
    └── images/
        ├── glow.png            # 256×256 standard radial gradient (GPU-scaled)
        └── glow-vivid.png      # 256×256 vivid radial gradient (GPU-scaled)
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
│   └── PinLockScreen      ✅ верификация PIN при запуске
│
└── TabNavigator (if isOnboarded && isPinVerified) — 4 таба
    ├── HomeTab → Home, AddTransaction, TransactionDetail
    ├── MonitoringTab → Analytics
    ├── TasksTab → Tasks (stub)
    └── ProfileTab → Profile (встроенные модалки), SubscriptionManagement, Settings, Categories, CreateCategory
```

---

## 3. Auth Flow (полностью реализован на клиенте)

### Auth Services (src/features/auth/services/)
- **telegramAuth.ts** — getTelegramAuthUrl(), parseAuthCallback(), persistAuth/Token/User/Pin, clearAuth, loadPersistedAuth, PIN management (persist, verify, lockout)
- **emailAuth.ts** — sendVerificationCode(email), verifyEmailCode(email, code)
- **phoneAuth.ts** — sendPhoneVerificationCode(phone), verifyPhoneCode(phone, code)

### Auth Store (Zustand + SecureStore)
- `isAuthenticated`, `isOnboarded`, `isLoading`, `isPinVerified`
- `token`, `userId`, `telegramUser`, `displayName`, `hasPin`
- `initializeAuth()` — восстановление сессии из SecureStore
- `loginWithTelegram(token, user)`, `loginWithEmail(token, email)`, `loginWithPhone(token, phone)`
- `setDisplayNameAndContinue(name)`, `setPinAndContinue(pin)`, `verifyPin(pin)`
- `logout()` — сохраняет displayName для returning users

### Auth Flow
```
Onboarding → [Telegram | Email → EmailVerify | Phone → PhoneVerify]
           → SetName → SetPin → Main App

При повторном запуске: PinLock → Main App
При returning user: Auth → (skip SetName/SetPin) → Main App
```

### Backend endpoints
- Worker URL: `https://castar-auth.ivcswebofficial.workers.dev`
- `GET  /auth/telegram?bot=castar_bot` — ✅ Telegram Login Widget page
- `GET  /auth/telegram/callback` — ✅ HMAC-SHA256 → JWT → deep link + HTML fallback
- `POST /auth/email/send-code` — ✅ in-memory OTP + Resend.com + rate limit
- `POST /auth/email/verify-code` — ✅ verify OTP → JWT
- `POST /auth/phone/send-code` — ✅ in-memory OTP + console.log + rate limit
- `POST /auth/phone/verify-code` — ✅ verify OTP → JWT
- `POST /api/voice/recognize` — ✅ Google Cloud STT V2 proxy

### CRUD endpoints (protected, JWT required)
- `GET    /categories` — List user categories (default + custom, ordered by sort_order)
- `POST   /categories` — Create custom category (max 20 per user)
- `PUT    /categories/:id` — Update
- `DELETE /categories/:id` — Hard delete + nullify refs in transactions/budgets

- `GET    /accounts` — List (?include_archived=1)
- `POST   /accounts` — Create
- `PUT    /accounts/:id` — Update
- `DELETE /accounts/:id` — Soft archive (is_archived = 1)

- `GET    /transactions` — List (filters: type, category_id, date_from, date_to, limit max 200, offset)
- `GET    /transactions/summary` — Aggregated income/expense/net for period
- `POST   /transactions` — Create + auto adjust account balance
- `GET    /transactions/:id` — Get single
- `PUT    /transactions/:id` — Update + revert/reapply balance on amount/type change
- `DELETE /transactions/:id` — Delete + revert balance

- `GET    /budgets` — List active (?include_inactive=1), enriched: spent/remaining/percentage
- `POST   /budgets` — Create
- `PUT    /budgets/:id` — Update
- `DELETE /budgets/:id` — Soft delete (is_active = 0)

- `GET    /recurrings` — List all recurring rules
- `POST   /recurrings` — Create
- `PUT    /recurrings/:id` — Update
- `PATCH  /recurrings/:id/pause` — Toggle is_active
- `DELETE /recurrings/:id` — Hard delete

- `GET    /settings` — User settings (defaults if no row)
- `PUT    /settings` — Upsert (create user row if missing)

### Backend architecture
```
backend/
├── src/
│   ├── index.ts            # Hono entry + CORS + health + route mounting + auth middleware
│   ├── types.ts            # Env (DB, JWT_SECRET, RESEND_API_KEY, ESKIZ_TOKEN, etc.)
│   ├── middleware/auth.ts  # JWT verify → userId in context
│   ├── services/
│   │   ├── jwt.ts          # sign/verify (jose, HS256, 30d)
│   │   ├── telegram.ts     # HMAC-SHA256 validation + Login Widget + Authorized callback
│   │   ├── email.ts        # Resend.com API
│   │   └── sms.ts          # stub (console.log)
│   └── routes/
│       ├── auth.ts         # Telegram + Email OTP + Phone OTP
│       ├── voice.ts        # Google STT V2 proxy
│       ├── transactions.ts # ✅ Full CRUD + balance adjustment
│       ├── categories.ts   # ✅ Full CRUD + batch cleanup
│       ├── accounts.ts     # ✅ Full CRUD + soft archive
│       ├── budgets.ts      # ✅ Full CRUD + enriched GET (spent/remaining/%)
│       ├── recurrings.ts   # ✅ Full CRUD + pause toggle
│       ├── settings.ts     # ✅ GET/PUT upsert
│       └── sync.ts         # 🔲 501 stub
├── migrations/0001_initial.sql  # ✅ APPLIED (7 tables, 15 indexes)
├── wrangler.toml
└── package.json
```

---

## 4. Database Layer (Drizzle ORM + expo-sqlite)

### Schema (src/shared/services/database/schema/)
7 таблиц: categories, accounts, transactions, budgets, recurrings, syncQueue, exchangeRates.
- camelCase keys (TypeScript) → snake_case columns (SQLite)
- Booleans: `integer('...', { mode: 'boolean' })`
- Enums: `text('...', { enum: [...] })`
- Nullable поля: `string | null` (не `undefined`)

### Query Modules (src/shared/services/database/*Queries.ts)
- `categoryQueries` — findByUser, findByType, countByUser, insert, update, delete
- `accountQueries` — findByUser, adjustBalance, insert, update, delete
- `transactionQueries` — findByUser, findByFilters, getSummary, sumByCategory, insert, update, delete
- `budgetQueries` — findByUser, findByCategory, findActive, deactivate, insert, update, delete
- `recurringQueries` — findByUser, findDue, pause, resume, updateNextDate, insert, update, delete
- `syncQueueQueries` — enqueue, findPending, markSynced, recordFailure, pendingCount, clearAll
- `exchangeRateQueries` — для будущей SQLite интеграции курсов валют

### Barrel (index.ts)
Query modules экспортируются как `categoryRepository`, `accountRepository`, etc. — backward compat со сторами.

### Connection
`export const db = drizzle(expoDb, { schema })` — singleton, WAL mode, foreign keys.

### Migrations
- Bridge: если есть старая `schema_migrations` → записать baseline в `__drizzle_migrations`
- `migrate(db, migrations)` из `drizzle-orm/expo-sqlite/migrator`

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
- `updateUser()`, `updateSettings()`, `setDefaultCurrency()`, `setLanguage()`
- `language`, `currency`, `initializeSettings()` — персистентность через SecureStore

---

## 6. Дизайн-система

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

## 7. Зависимости (реальный package.json)

### Core
- expo ~54.0.33, react 19.1.0, react-native 0.81.5, typescript ~5.9.2

### Navigation
- @react-navigation/native, bottom-tabs, native-stack (**v7**)

### State & Validation
- zustand ^5.0.11, zod ^4.3.6

### Database
- drizzle-orm ^0.45.1, expo-sqlite ~16.0.10
- drizzle-kit ^0.31.9 (dev), babel-plugin-inline-import ^3.0.0 (dev)

### i18n
- i18next ^25.8.8, react-i18next ^16.5.4, expo-localization

### UI & Animation
- expo-linear-gradient, react-native-svg, @expo-google-fonts/inter
- expo-haptics, react-native-reanimated, react-native-gesture-handler
- expo-blur

### Auth & Security
- expo-secure-store (JWT + PIN + user persistence)
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

## 8. Текущий статус

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

#### Фаза 2 (частично) — Profile UI + Subscription + Tasks + HomeScreen
- [x] ProfileScreen — полный Figma UI (2500+ строк)
- [x] SubscriptionManagementScreen — полный Figma UI, perf optimized
- [x] TasksScreen — stub
- [x] 4 таба (Home, Monitoring, Tasks, Profile) + кастомный таб-бар
- [x] Currency picker (26 валют, live курсы, radio selection)
- [x] Language picker (11 языков, radio selection)
- [x] Settings модалка (Name, Telegram, Phone, Email, Save, Delete account)
- [x] OTP верификация телефона/email из настроек
- [x] Персистентность: язык + валюта в SecureStore
- [x] HomeScreen — layout по Figma (дата с i18n, приветствие, budget card, period pills с анимацией, spent/remaining, action кнопки)
- [x] Tab bar: flex layout + ellipsis для длинных названий (вместо фиксированной ширины)
- [x] Date i18n: все 11 date-fns локалей для перевода названия месяца
- [x] Баг-фикс: язык сбрасывался на русский при logout → fallback English
- [x] Баг-фикс: добавлены недостающие языки (pl, ka, zh) в OnboardingScreen
- [x] Modal animation fix: double requestAnimationFrame для устранения visual "jump"

#### Фаза 3 — Локальная БД (Drizzle ORM)
- [x] expo-sqlite + Drizzle ORM (7 schema, 7 query modules)
- [x] Zustand сторы интегрированы с SQLite
- [x] Zod validation schemas
- [x] SyncQueue для будущей синхронизации

#### Фаза 4 — Backend ✅
- [x] Cloudflare Worker `castar-auth` задеплоен
- [x] D1 база `castar-db` создана (WEUR) — **миграция ПРИМЕНЕНА** (7 таблиц, 15 индексов)
- [x] JWT service + middleware (jose, 30 дней)
- [x] Telegram auth — полный цикл (Login Widget → HMAC-SHA256 → JWT → deep link)
- [x] Email OTP — Resend.com (реальная отправка)
- [x] Phone OTP — console.log (Eskiz.uz ещё не подключён)
- [x] Voice route — Google Cloud STT V2 proxy
- [x] CRUD routes — полная реализация с Zod валидацией:
  - `categories.ts` — GET, POST, PUT, DELETE (batch cleanup transactions + budgets)
  - `accounts.ts` — GET (?include_archived), POST, PUT, DELETE (soft archive)
  - `transactions.ts` — GET (filters), GET /summary, POST, GET/:id, PUT, DELETE + auto balance adjustment
  - `budgets.ts` — GET (enriched: spent/remaining/%), POST, PUT, DELETE (soft)
  - `recurrings.ts` — GET, POST, PUT, PATCH /:id/pause (toggle), DELETE
  - `settings.ts` — GET (defaults if no row), PUT (upsert)
- [x] Root-level auth middleware для всех protected routes
- [x] Worker задеплоен с CRUD routes

#### Сервисы (клиент)
- [x] Currency service (open.er-api.com + SecureStore кэш 24ч + fallback)
- [x] Voice: voiceParser + cloudRecognition (Google STT) + offlineRecognition (VOSK) + voiceService
- [x] PostHog analytics (EU instance, screen tracking)

#### Performance Optimization ✅ (13 коммитов)
- [x] Quick wins: `useShallow`, `React.memo`, `useCallback`/`useMemo` — меньше ре-рендеров
- [x] SvgXml → JSX SVG: ProfileScreen (16 иконок), 11 auth screens — **0 SvgXml** в проекте
- [x] Shared SVG: `src/shared/components/svg/AuthSvgs.tsx` + `scaling.ts` (`scale()` утилита)
- [x] Lazy i18n: при старте грузится 1 язык, остальные 10 — `InteractionManager.runAfterInteractions`
- [x] SVG RadialGradient → GPU PNG: pre-rendered 256×256 PNG через `sharp` → `<Image>` (GPU-scaled)
  - `glow.png` (4.6KB) + `glow-vivid.png` (7.9KB) → `GlowCircle1`, `GlowCircle2` в `GlowImage.tsx`
  - Заменены glows в SubscriptionManagement, Profile, AuthSvgs
- [x] Modal animation: double `requestAnimationFrame` для mount → animate (устранение "jump" при открытии)
- [x] Анимации модалок/попапов (финальные значения):
  - Picker sheet: overlay 500ms, spring stiffness 150, damping 32, mass 1
  - Popup (logout/delete): fade 500ms, scale 0.94→1, spring stiffness 110, damping 24, mass 1
  - FadeIn полей: 200ms
- [x] `experimentalBlurMethod="dimezisBlurView"` — обязателен для blur на Android (expo-blur)

### Экраны — UI статус
- [x] HomeScreen — layout готов (дата, приветствие, budget card, period pills, spent/remaining, кнопки)
- [ ] AddTransaction, TransactionDetail, Transactions — stubs
- [ ] Budgets, BudgetDetail, CreateBudget, FamilyBudget — stubs
- [ ] Analytics — stub
- [ ] Categories, CreateCategory — stubs

### TODO 📋

#### Фаза 2 (продолжение) — UI основных экранов
- [ ] Home экран (карточка баланса, доход/расход, список транзакций)
- [ ] AddTransaction экран (форма + voice input)
- [ ] TransactionDetail экран
- [ ] Budgets + BudgetDetail + CreateBudget
- [ ] Analytics экран (графики) — нужен `react-native-gifted-charts`
- [ ] Categories + CreateCategory
- [ ] Shared UI компоненты

#### Фаза 4 (остаток) — Бэкенд
- [ ] SMS через Eskiz.uz (заменить console.log → реальный API)
- [ ] OTP хранение в D1 (заменить in-memory Map → persistent storage)
- [ ] Sync endpoint (bulk operations для offline → online)
- [ ] React Query (@tanstack/react-query) для серверных данных
- [ ] apiClient.ts — заполнить baseUrl и методы (подключить к backend)
- [ ] `wrangler secret put GOOGLE_CLOUD_STT_KEY`
- [ ] `wrangler secret put ESKIZ_TOKEN`

#### Фаза 5 — Продвинутые фичи
- [ ] Семейные бюджеты
- [ ] Повторяющиеся транзакции
- [ ] Push-уведомления
- [ ] Биометрия (expo-local-authentication)
- [ ] Экспорт (CSV/PDF)
- [ ] Тёмная/светлая тема

---

## 9. Конфигурация

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
- **Plugins:** expo-localization, expo-secure-store, expo-sqlite

> **ВАЖНО:** Название пишется **Castar** или **castar**. Никогда не писать "CaStar" (s с большой буквы).
