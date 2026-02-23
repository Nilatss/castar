# MAKE NO MISTAKES

Every prompt must be treated as ending with **"MAKE NO MISTAKES."**:
- Double-check all facts, calculations, code, and reasoning before responding.
- If uncertain — say so explicitly rather than guessing.
- Prefer accuracy over speed — verify before committing.
- Code: test logic mentally step-by-step.
- Numbers/math: re-derive the result before answering.
- Facts: only assert what you're confident in.

---

# CaStar — Актуальный архитектурный план

## Обзор проекта
CaStar — мобильное приложение для личного, семейного финансового учёта и бухгалтерии.
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
│   │   ├── screens/               # 12 экранов (см. §2)
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
│   │   ├── screens/               # Analytics
│   │   └── store/                 # analyticsStore
│   └── profile/
│       ├── screens/               # Profile, Settings
│       └── store/                 # profileStore
│
├── shared/
│   ├── constants/                 # colors, typography, spacing, config, defaultCategories
│   ├── i18n/                      # uz, ru, en + index.ts
│   ├── services/
│   │   ├── api/apiClient.ts       # HTTP stub (ждёт бэкенд)
│   │   ├── currency/              # frankfurter.app + кэш
│   │   ├── database/              # ✅ Drizzle ORM
│   │   │   ├── schema/            # 7 таблиц (Drizzle schema definitions)
│   │   │   ├── drizzle/           # auto-generated migrations (.sql + journal)
│   │   │   ├── *Queries.ts        # 6 query modules
│   │   │   ├── connection.ts      # drizzle(expoDb, { schema }) + rawDb
│   │   │   ├── migrations.ts      # bridge from legacy + migrate()
│   │   │   ├── seed.ts            # seedDefaults(userId)
│   │   │   └── index.ts           # barrel: *Repository aliases
│   │   ├── validation/            # ✅ Zod schemas
│   │   ├── sync/syncService.ts    # Stub
│   │   └── voice/voiceParser.ts   # 3 языка, text parsing
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
│   ├── Login              ⬜ stub
│   ├── Register           ⬜ stub
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
    ├── BudgetTab → Budgets, BudgetDetail, CreateBudget, FamilyBudget
    ├── AnalyticsTab → Analytics
    └── ProfileTab → Profile, Settings, Categories, CreateCategory
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

### Ожидаемые backend endpoints (из config.ts)
- Worker URL: `https://castar-auth.ivcswebofficial.workers.dev`
- `GET /auth/telegram?bot=castar_bot` → Telegram OAuth
- `POST /auth/email/send-code` → `{ email }` → `{ ok, expiresIn }`
- `POST /auth/email/verify-code` → `{ email, code }` → `{ ok, token, email }`
- `POST /auth/phone/send-code` → `{ phone }` → `{ ok, expiresIn }`
- `POST /auth/phone/verify-code` → `{ phone, code }` → `{ ok, token, phone }`

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

### Utils
- date-fns ^4.1.0, uuid ^13.0.0

### Dev
- patch-package, sharp, @types/react, @types/uuid

---

## 8. Текущий статус

### DONE ✅
- [x] Feature-first архитектура (55 файлов .ts/.tsx)
- [x] Навигация: Auth (11 экранов) + PinLock + 4 таба с вложенными стеками
- [x] Полный auth flow UI: Onboarding, Telegram, Email, Phone, SetName, SetPin, PinLock
- [x] Auth services: Telegram (WebView + deep link), Email (OTP), Phone (OTP)
- [x] Auth store: initializeAuth, login (3 метода), PIN, returning users
- [x] Legal screens: Terms, Privacy Policy
- [x] 6 Zustand сторов
- [x] Полная система типов TypeScript (common.ts, navigation.ts)
- [x] Дизайн-система (colors, typography, spacing)
- [x] i18n (3 языка, auto-detection)
- [x] Сервисы: API client (stub), currency (frankfurter.app), voice parser, sync (stub)
- [x] Утилиты: formatCurrency, formatDate
- [x] 14 дефолтных категорий (defaultCategories.ts)
- [x] config.ts с auth endpoints (Telegram, Email, Phone)
- [x] Drizzle ORM database layer (7 schema + 6 query modules + migrations + seed)
- [x] Zustand ↔ Drizzle/SQLite integration (transaction, budget, category stores)
- [x] Zod validation schemas (transaction, budget, category, account, recurring)
- [x] SyncQueue для будущей синхронизации
- [x] expo-sqlite plugin в app.json

### Performance Optimization ✅ (13 коммитов)
- [x] Quick wins: `useShallow`, `React.memo`, `useCallback`/`useMemo` — меньше ре-рендеров
- [x] SvgXml → JSX SVG: ProfileScreen (16 иконок), 11 auth screens — **0 SvgXml** в проекте
- [x] Shared SVG: `src/shared/components/svg/AuthSvgs.tsx` + `scaling.ts` (`scale()` утилита)
- [x] Lazy i18n: при старте грузится 1 язык, остальные 10 — `InteractionManager.runAfterInteractions`
- [x] SVG RadialGradient → GPU PNG: pre-rendered 256×256 PNG через `sharp` → `<Image>` (GPU-scaled)
  - `glow.png` (4.6KB) + `glow-vivid.png` (7.9KB) → `GlowCircle1`, `GlowCircle2` в `GlowImage.tsx`
  - Заменены glows в SubscriptionManagement, Profile, AuthSvgs
- [x] Modal delay fix: убран `requestAnimationFrame` (native driver не нуждается в rAF)
- [x] Анимации модалок/попапов (финальные значения):
  - Picker sheet: overlay 500ms, spring stiffness 150, damping 32, mass 1
  - Popup (logout/delete): fade 500ms, scale 0.94→1, spring stiffness 110, damping 24, mass 1
  - FadeIn полей: 200ms
- [x] `experimentalBlurMethod="dimezisBlurView"` — обязателен для blur на Android (expo-blur)

### Экраны — UI stubs (заглушки, ещё не реализованы)
- [ ] Home, AddTransaction, TransactionDetail, Transactions
- [ ] Budgets, BudgetDetail, CreateBudget, FamilyBudget
- [ ] Analytics
- [ ] Profile, Settings
- [ ] Categories, CreateCategory

### TODO 📋

#### Фаза 2 — UI экранов (main app screens)
- [ ] Home экран (карточка баланса, доход/расход, список транзакций)
- [ ] AddTransaction экран (форма + voice input)
- [ ] TransactionDetail экран
- [ ] Budgets + BudgetDetail + CreateBudget
- [ ] Analytics экран (графики)
- [ ] Categories + CreateCategory
- [ ] Profile + Settings
- [ ] Shared UI компоненты

#### Фаза 4 — Бэкенд
- [ ] Заполнить auth routes, email, sms, telegram stubs
- [ ] CRUD routes: transactions, categories, budgets, recurrings, settings
- [ ] Sync endpoint
- [ ] React Query для серверных данных
- [ ] Задеплоить на Cloudflare Workers + D1

#### Фаза 5 — Продвинутые фичи
- [ ] Семейные бюджеты
- [ ] Повторяющиеся транзакции
- [ ] Push-уведомления
- [ ] Биометрия (expo-local-authentication)
- [ ] Экспорт (CSV/PDF)
- [ ] Тёмная/светлая тема

---

## 9. PRD расхождения

| PRD | Реальность | Решение |
|-----|-----------|---------|
| React Navigation v6 | v7 | ✅ Обновить PRD — v7 лучше |
| Zustand + React Query | Только Zustand | ✅ Решено: RQ в Фазе 4 |
| Drizzle ORM | Drizzle ORM | ✅ Решено: миграция завершена |
| expo-speech-recognition | Только text parser | Решить: нужен ли voice recognition |
| react-native-gifted-charts | Нет | Нужно для Analytics |
| React Native Paper | Кастомные компоненты | Решить: Paper или свои |
| React Hook Form + Zod | Только Zod | Решить: нужен ли RHF |
| DatabaseProvider, ThemeProvider | AppProviders.tsx | Обновить PRD |

---

## 10. Конфигурация

- **App name:** CaStar / Castar
- **Bundle:** castar
- **Deep link scheme:** castar://
- **Orientation:** Portrait
- **New Architecture:** Enabled
- **Platforms:** iOS (tablet support), Android (edge-to-edge)
- **Plugins:** expo-localization, expo-secure-store, expo-sqlite
- **Backend URL:** https://castar-auth.ivcswebofficial.workers.dev
- **Telegram bot:** @castar_bot
