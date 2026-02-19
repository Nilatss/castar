# Castar — Полный план проекта

> **Назначение:** Мобильное приложение для личного, семейного финансового учёта **и бухгалтерии**.

---

## 🏗 Стек

| Слой | Технология | Версия | Статус |
|------|-----------|--------|--------|
| **Runtime** | Expo SDK | 54 | ✅ |
| **UI** | React Native | 0.81 | ✅ |
| **Язык** | TypeScript | 5.9 | ✅ |
| **Навигация** | React Navigation | **v7** | ✅ |
| **State (клиент)** | Zustand | 5 | ✅ |
| **State (сервер)** | React Query | — | ⏳ добавить в Фазе 4 |
| **ORM** | Drizzle ORM | 0.45 | ✅ |
| **Валидация** | Zod | 4 | ✅ |
| **i18n** | i18next + react-i18next | 25 / 16 | ✅ |
| **Шрифт** | @expo-google-fonts/inter | — | ✅ |
| **Анимации** | react-native-reanimated | 4 | ✅ |
| **Жесты** | react-native-gesture-handler | 2.28 | ✅ |
| **Безопасность** | expo-secure-store | — | ✅ |
| **WebView** | react-native-webview | 13 | ✅ |
| **Deep links** | expo-linking | — | ✅ |
| **Даты** | date-fns | 4 | ✅ |
| **UUID** | uuid | 13 | ✅ |
| **БД (локальная)** | expo-sqlite + Drizzle | 16 + 0.45 | ✅ |
| **Бэкенд** | Cloudflare Workers + Hono | 4.7 | 🔲 scaffold (stubs) |
| **БД (сервер)** | Cloudflare D1 (SQLite) | — | 🔲 миграция готова, не задеплоена |
| **Auth (JWT)** | jose | 6 | ✅ sign/verify работает |
| **Email** | Resend.com | — | 🔲 stub |
| **SMS** | Eskiz.uz | — | 🔲 stub |
| **Voice (cloud)** | Google Cloud STT | V2 | ✅ клиент + бэкенд proxy |
| **Voice (offline)** | VOSK (react-native-vosk) | 2.1.7 | ✅ клиент ready |
| **Аудио запись** | expo-av | 16 | ✅ |
| **Сеть** | @react-native-community/netinfo | 11.4 | ✅ |
| **Графики** | react-native-gifted-charts | — | ⏳ установить (Фаза 2) |
| **User Analytics** | PostHog (posthog-react-native) | — | ✅ Provider + screen tracking |

---

## 📐 Архитектура

### Feature-First структура
```
src/
├── core/
│   ├── navigation/         # RootNavigator → Auth(11) | PinLock | Tabs(4)
│   └── providers/          # AppProviders (PostHogProvider + NavContainer + screen tracking + i18n + auth init + DB migrations)
├── features/
│   ├── auth/               # 12 screens + 3 services + store
│   ├── transactions/       # Home, AddTransaction, TransactionDetail
│   ├── budget/             # Budgets, BudgetDetail, CreateBudget, FamilyBudget
│   ├── categories/         # Categories, CreateCategory
│   ├── analytics/          # Analytics
│   └── profile/            # Profile, Settings
├── shared/
│   ├── constants/          # colors, typography, spacing, config, defaultCategories
│   ├── i18n/               # uz, ru, en
│   ├── services/
│   │   ├── api/            # apiClient (stub)
│   │   ├── currency/       # frankfurter.app + кэш
│   │   ├── database/       # ✅ Drizzle ORM: schema, queries, migrations, seed, connection
│   │   │   ├── schema/     # 7 таблиц (categories, accounts, transactions, budgets, recurrings, syncQueue, exchangeRates)
│   │   │   ├── drizzle/    # auto-generated migrations (.sql + journal)
│   │   │   ├── *Queries.ts # 6 query modules (categoryQueries, accountQueries, ...)
│   │   │   ├── connection.ts  # drizzle(expoDb, { schema }) + rawDb
│   │   │   ├── migrations.ts  # bridge from legacy + migrate()
│   │   │   ├── seed.ts        # seedDefaults(userId)
│   │   │   └── index.ts       # barrel: *Repository aliases для совместимости со сторами
│   │   ├── analytics/      # ✅ PostHog (posthog.ts — API key + EU host)
│   │   ├── sync/           # syncService (stub)
│   │   ├── validation/     # ✅ Zod schemas (transaction, budget, category, account, recurring)
│   │   └── voice/          # ✅ voiceParser + cloudRecognition + offlineRecognition + voiceService
│   ├── types/              # common.ts, navigation.ts
│   └── utils/              # formatCurrency, formatDate
└── assets/

backend/                    # Scaffold — stubs + voice route (рабочий)
├── src/
│   ├── index.ts            # Hono entry + CORS + health + voice route mount
│   ├── types.ts            # Env (+ GOOGLE_CLOUD_STT_KEY), JwtPayload, Variables
│   ├── middleware/auth.ts  # JWT verify (рабочий)
│   ├── services/           # jwt ✅, email 🔲, sms 🔲, telegram 🔲
│   └── routes/             # auth, transactions, categories, budgets, recurrings, settings, sync (501) + voice ✅
├── migrations/0001_initial.sql  # Полная D1 схема (7 таблиц, 15 индексов)
├── wrangler.toml
└── package.json
```

### Auth Flow
```
Onboarding → [Telegram | Email → EmailVerify | Phone → PhoneVerify]
           → SetName → SetPin → Main App

При повторном запуске: PinLock → Main App
При returning user: Auth → (skip SetName/SetPin) → Main App
```

### State Management

**Zustand** — клиентское/локальное состояние (UI, фильтры, offline данные из SQLite):
- **authStore** — isAuthenticated, isOnboarded, isPinVerified, token, userId, displayName, hasPin, telegramUser + SecureStore persistence
- **transactionStore** — transactions[], filters, CRUD → **Drizzle/SQLite** (worktree)
- **budgetStore** — budgets[] + enrichBudget(spent/remaining/%), CRUD → **Drizzle/SQLite** (worktree)
- **categoryStore** — categories[], CRUD → **Drizzle/SQLite** (worktree)
- **analyticsStore** — period, summary (stub)
- **profileStore** — user, settings (in-memory)

**React Query** *(Фаза 4+)* — серверное состояние (данные с API, кэш, refetch):
- Серверные отчёты и бух аналитика (P&L, баланс, обороты)
- Справочники (контрагенты, налоговые ставки) — `staleTime: 24h`
- Поиск пользователей для семейного/бизнес аккаунта
- Shared data между несколькими пользователями (бух + владелец + сотрудники)
- Автоматический retry, dedupe, background refetch

### Backend endpoints (клиент уже ожидает)
- `GET /auth/telegram?bot=castar_bot`
- `POST /auth/email/send-code` → `{ email }` → `{ ok, expiresIn }`
- `POST /auth/email/verify-code` → `{ email, code }` → `{ ok, token }`
- `POST /auth/phone/send-code` → `{ phone }` → `{ ok, expiresIn }`
- `POST /auth/phone/verify-code` → `{ phone, code }` → `{ ok, token }`
- Worker URL: `https://castar-auth.ivcswebofficial.workers.dev`

---

## ✅ Что сделано

### Фаза 1 — Фундамент ✅ (коммит `68a21ec`)
- [x] Feature-first архитектура (55 файлов)
- [x] React Navigation v7: Auth (11 screens) + PinLock + 4 таба
- [x] 6 Zustand сторов (in-memory, без БД)
- [x] TypeScript типы (common.ts — 258 строк, navigation.ts)
- [x] Дизайн-система: colors (dark #101010), typography (Inter), spacing
- [x] i18n: 3 языка (uz, ru, en), auto-detection
- [x] config.ts с backend URL + bot username

### Фаза 1.5 — Auth Flow ✅ (коммит `8ed75c3`)
- [x] OnboardingScreen — полный UI (Telegram/Email/Phone кнопки)
- [x] TelegramAuthScreen — WebView → Worker → deep link callback
- [x] EmailAuthScreen + EmailVerifyScreen — OTP flow
- [x] PhoneAuthScreen + PhoneVerifyScreen — OTP flow
- [x] SetNameScreen — ввод имени, persists across logout
- [x] SetPinScreen — установка PIN
- [x] PinLockScreen — верификация PIN + lockout
- [x] TermsScreen + PrivacyPolicyScreen
- [x] Auth services: telegramAuth.ts, emailAuth.ts, phoneAuth.ts
- [x] Auth store: initializeAuth, 3 login метода, PIN verify, SecureStore
- [x] Telegram auth — полностью работает (клиент + Worker задеплоен)

### Сервисы ✅
- [x] API client (stub — ждёт бэкенд)
- [x] Currency service (frankfurter.app + кэш 1ч)
- [x] Voice parser (3 языка, text only)
- [x] Sync service (stub)
- [x] Утилиты: formatCurrency, formatDate

### Фаза 4 (частично) — Backend Scaffold 🔲 (коммит `12fc595`)
Каркас создан и лежит в git, но логика внутри — stubs (501).
- [x] `backend/package.json` — hono, jose, zod, wrangler (установлены, tsc чистый)
- [x] `backend/tsconfig.json` + `wrangler.toml` — конфигурация готова
- [x] `backend/src/types.ts` — Env, JwtPayload, Variables, API response types
- [x] `backend/migrations/0001_initial.sql` — полная D1 схема (7 таблиц, 15 индексов)
- [x] `backend/src/services/jwt.ts` — **рабочий** sign/verify через jose
- [x] `backend/src/middleware/auth.ts` — **рабочий** JWT verify middleware
- [x] `backend/src/index.ts` — Hono entry, CORS, health check, route mounting
- [x] `backend/src/services/telegram.ts` — widget HTML готов, валидация stub
- [x] `backend/src/services/email.ts` — stub (TODO: Resend.com API)
- [x] `backend/src/services/sms.ts` — stub (TODO: Eskiz.uz API)
- [x] `backend/src/routes/auth.ts` — 5 endpoints, возвращают 501
- [x] `backend/src/routes/transactions.ts` — CRUD stubs (501)
- [x] `backend/src/routes/categories.ts` — CRUD stubs (501)
- [x] `backend/src/routes/budgets.ts` — CRUD stubs (501)
- [x] `backend/src/routes/recurrings.ts` — CRUD stubs (501)
- [x] `backend/src/routes/settings.ts` — GET/PUT stubs (501)
- [x] `backend/src/routes/sync.ts` — bulk sync stub (501)

### Фаза 3 — Локальная БД ✅ (worktree, коммит `8c27984`)
- [x] Полный database layer: connection + migrations + seed + repositories
- [x] Zustand сторы интегрированы с SQLite (transaction, budget, category)
- [x] AppProviders инициализирует БД (миграции + seed) при запуске
- [x] Zod validation schemas для всех форм
- [x] SyncQueue автоматически записывает мутации для будущей синхронизации
- [x] `expo-sqlite ~16.0.10` в package.json (worktree)

### Фаза 3.5 — Миграция на Drizzle ORM ✅ (worktree, коммит `e7a2242`)
Raw SQL + BaseRepository + 6 классов-репозиториев (~500 строк boilerplate) заменены на Drizzle ORM.
- [x] `drizzle-orm`, `drizzle-kit`, `babel-plugin-inline-import` установлены
- [x] `metro.config.js` — `.sql` в sourceExts для Metro bundler
- [x] `babel.config.js` — inline-import плагин для `.sql` файлов
- [x] `drizzle.config.ts` — конфигурация Drizzle Kit
- [x] 7 Drizzle schema файлов (camelCase keys, snake_case columns, boolean mode, enum text)
- [x] Baseline миграция сгенерирована (`drizzle-kit generate` → `0000_strong_ares.sql`)
- [x] `connection.ts` — `export const db = drizzle(expoDb, { schema })` + `rawDb`
- [x] `migrations.ts` — bridge из старой `schema_migrations` + `migrate(db, migrations)`
- [x] `seed.ts` — `db.insert(categories).values([...])` + `db.transaction()`
- [x] 6 query modules: category, account, transaction, budget, recurring, syncQueue
- [x] `index.ts` barrel — query modules как `*Repository` namespace aliases (backward compat)
- [x] `AppProviders.tsx` — `runMigrations()` / `seedDefaults(userId)` без db аргумента
- [x] `common.ts` — nullable поля `string | null` вместо `?: string` (соответствует Drizzle/SQLite)
- [x] Сторы обновлены: `?? null` для nullable полей при создании сущностей
- [x] Удалены: `BaseRepository.ts` + 6 `*Repository.ts` (−585 строк)
- [x] `expo-sqlite` plugin добавлен в `app.json`
- [x] TypeScript — 0 ошибок (`npx tsc --noEmit`)

### Voice Recognition ✅ (worktree, коммиты `d148e22` + `11e39ac`)
Полный service layer для голосового ввода транзакций (cloud + offline + unified).
- [x] `expo-av` установлен — запись аудио (WAV 16kHz mono)
- [x] `react-native-vosk@2.1.7` установлен — offline VOSK recognition
- [x] `@react-native-community/netinfo@11.4.1` установлен — проверка сети
- [x] `app.json` — expo-av plugin с microphonePermission
- [x] `cloudRecognition.ts` — запись через expo-av → отправка на бэкенд proxy → Google Cloud STT V2
- [x] `offlineRecognition.ts` — VOSK on-device, авто-загрузка моделей (~50MB), uz/ru/en
- [x] `voiceService.ts` — auto-select cloud/offline по сети, fallback, state callbacks
- [x] `backend/src/routes/voice.ts` — POST /api/voice/recognize (multipart audio → base64 → Google STT V2 → text+confidence)
- [x] `backend/src/types.ts` — GOOGLE_CLOUD_STT_KEY добавлен в Env
- [x] `backend/src/index.ts` — voice route замаунчен на /api/voice (public, без auth)
- [x] `wrangler.toml` — GOOGLE_CLOUD_STT_KEY в секретах
- [x] Google Cloud аккаунт создан, Speech-to-Text API включён, API key получен
- [x] `tsconfig.json` — exclude backend/ из фронтового tsc (worktree)
- [x] TypeScript — 0 ошибок (frontend + backend)

### PostHog Analytics ✅ (worktree, коммит `1cce887`)
Интеграция PostHog для отслеживания поведения пользователей (EU instance, GDPR).
- [x] `posthog-react-native` установлен (+ expo-file-system, @react-native-async-storage/async-storage)
- [x] `src/shared/services/analytics/posthog.ts` — API key + EU host (`https://eu.i.posthog.com`)
- [x] `PostHogProvider` добавлен в `AppProviders.tsx` (оборачивает всё приложение)
- [x] Screen tracking через `onStateChange` в `NavigationContainer` (React Navigation v7 — ручной capture)
- [x] `getActiveRouteName()` — рекурсивное извлечение активного экрана из вложенных навигаторов
- [x] Autocapture отключён (`captureScreens: false`, `captureTouches: false`) — только ручной tracking
- [x] PostHog аккаунт создан (EU instance, posthog.com)
- [x] TypeScript — 0 ошибок

### Также сделано (коммит `12fc595`, main)
- [x] `expo-sqlite` добавлен в package.json main repo
- [x] `tsconfig.json` — exclude backend/ из фронтового tsc

---

## 📋 Что нужно сделать

### Мерж worktree → main ⏳
- [ ] Когда всё проверено и стабильно — смержить ветку `claude/blissful-elgamal` в main
- [ ] Содержит: Drizzle ORM database layer, Zustand ↔ SQLite, Zod schemas, expo-sqlite, Voice Recognition (cloud+offline+backend), PostHog analytics, project plan

### Фаза 2 — UI основных экранов ⏳ (ждёт дизайн)
- [ ] Shared UI компоненты (Button, Input, Card, SegmentedControl, ProgressBar, CategoryIcon, EmptyState, TransactionItem)
- [ ] HomeScreen (карточка баланса, доход/расход, список транзакций)
- [ ] AddTransactionScreen (калькулятор, категория, дата, описание)
- [ ] TransactionDetailScreen (просмотр + удаление)
- [ ] BudgetsScreen (список + прогресс-бары)
- [ ] BudgetDetailScreen (прогресс, статистика, alerts)
- [ ] CreateBudgetScreen (форма с category picker)
- [ ] AnalyticsScreen (summary, breakdown по категориям)
- [ ] CategoriesScreen (список + фильтр expense/income)
- [ ] CreateCategoryScreen (форма + icon/color picker)
- [ ] ProfileScreen (аватар, меню)
- [ ] SettingsScreen (язык, валюта, тема)

### Фаза 4 — Backend API + React Query (заполнить stubs)
- [x] ~~Scaffold~~ ✅ сделано, лежит в git
- [x] ~~D1 миграция~~ ✅ написана
- [x] ~~JWT service~~ ✅ рабочий
- [x] ~~JWT middleware~~ ✅ рабочий
- [x] ~~CORS, error handler~~ ✅
- [ ] Заполнить auth routes: OTP генерация, сохранение в D1, верификация
- [ ] Заполнить email.ts: реальный вызов Resend.com API
- [ ] Заполнить sms.ts: реальный вызов Eskiz.uz API
- [ ] Заполнить telegram.ts: HMAC-SHA256 валидация
- [ ] Заполнить CRUD routes: transactions, categories, budgets, recurrings, settings
- [ ] Заполнить sync endpoint
- [ ] Rate limiting
- [ ] Задеплоить на Cloudflare Workers + создать D1 базу
- [ ] Добавить `@tanstack/react-query` в клиент
- [ ] Использовать RQ для: серверные отчёты, справочники, shared data, поиск пользователей
- [ ] Zustand остаётся для: offline данные (SQLite), UI state, auth state

### Voice Recognition ✅
Основная фича — голосовой ввод транзакций. Акцент на узбекский язык (самый востребованный).

**Архитектура (гибридная):**
```
Online  → Google Cloud Speech-to-Text V2 (uz-UZ / ru-RU / en-US)
Offline → VOSK react-native-vosk (vosk-model-small-uz / ru / en)
Text    → voiceParser.ts (уже готов — парсинг суммы, валюты, категории)
```

**Почему НЕ expo-speech-recognition / @react-native-voice/voice:**
- Apple SFSpeechRecognizer НЕ поддерживает узбекский (~64 языка, uz нет)
- @react-native-voice/voice — сломана совместимость с Expo SDK 54 (config-plugins@^2 vs @~9)

**Файлы:**
```
src/shared/services/voice/
├── voiceParser.ts          # ✅ text → VoiceParseResult (amount, currency, type, category)
├── voiceService.ts         # ✅ unified interface (auto-select cloud/offline)
├── cloudRecognition.ts     # ✅ Google Cloud STT V2 (запись expo-av → backend proxy)
└── offlineRecognition.ts   # ✅ VOSK (react-native-vosk, on-device)

backend/src/routes/voice.ts # ✅ POST /api/voice/recognize (proxy → Google STT V2)
```

**Задачи:**
- [x] Установить `react-native-vosk` + модели (uz, ru, en — авто-загрузка)
- [x] Установить `expo-av` для записи аудио
- [x] Установить `@react-native-community/netinfo` для проверки сети
- [x] Написать `cloudRecognition.ts` — запись аудио → backend proxy → Google STT
- [x] Написать `offlineRecognition.ts` — VOSK on-device recognition
- [x] Написать `voiceService.ts` — проверка сети → cloud или offline
- [x] Google Cloud API key — через бэкенд proxy (POST /api/voice/recognize)
- [x] Google Cloud аккаунт + Speech-to-Text API включён + API key получен
- [ ] Интегрировать в AddTransactionScreen (кнопка микрофона) — ждёт Фазу 2 (UI)
- [ ] `wrangler secret put GOOGLE_CLOUD_STT_KEY` — при деплое бэкенда

**Стоимость:**
- Google Cloud STT: ~$0.02/мин, 60 мин/мес бесплатно, $300 кредитов на 90 дней
- VOSK: бесплатно (open source, Apache 2.0)
- ~$0.09/мес на активного пользователя (~5 транзакций/день по 5 сек)

### User Analytics (PostHog) ✅
Отслеживание поведения пользователей: экраны, клики, время, воронки, session replay.

**Почему PostHog:**
- Приватность (EU хостинг, GDPR, self-host, open source) — критично для финансового приложения
- 1M событий/мес бесплатно + 5K session replays
- Feature flags, фуннели, retention — всё в одном
- Авто-маскирование чувствительных данных в session replay

**Пакет:** `posthog-react-native`

**Файлы:**
```
src/shared/services/analytics/
└── posthog.ts              # ✅ API key + EU host (https://eu.i.posthog.com)

src/core/providers/
└── AppProviders.tsx         # ✅ PostHogProvider + NavigationWrapper (screen tracking)
```

**Задачи:**
- [x] Установить `posthog-react-native`, `expo-file-system`, `@react-native-async-storage/async-storage`
- [x] Создать `src/shared/services/analytics/posthog.ts` — API key + EU host
- [x] Добавить PostHogProvider в `AppProviders.tsx`
- [x] Screen tracking через `onStateChange` в NavigationContainer (React Nav v7 — ручной capture)
- [x] Создать аккаунт на posthog.com (EU instance) и получить API key
- [ ] Трекать ключевые события: добавление транзакции, создание бюджета, voice input, auth flow — ждёт Фазу 2 (UI)
- [ ] Настроить session replay с маскировкой финансовых данных — ждёт Фазу 2 (UI)

### Фаза 5 — Продвинутые фичи
- [ ] Семейные бюджеты (FamilyGroup, приглашения)
- [ ] Повторяющиеся транзакции
- [ ] Push-уведомления (превышение бюджета)
- [ ] Биометрия (expo-local-authentication)
- [ ] Экспорт (CSV/PDF)
- [ ] Тёмная/светлая тема (переключение)

---

## 📦 Git коммиты

| Ветка | Коммит | Описание |
|-------|--------|----------|
| main | `68a21ec` | Initial project scaffold: Expo + RN + navigation + stores + types + design system |
| main | `8ed75c3` | feat: complete auth flow UI with all screens and backend scaffold |
| main | `12fc595` | feat: add backend API scaffold (stubs) + expo-sqlite dep |
| worktree | `8c27984` | feat: add SQLite database layer, all main screens, and Zustand DB integration |
| worktree | `e7a2242` | feat: migrate database layer from raw SQL to Drizzle ORM |
| worktree | `5df47d5` | docs: add comprehensive project plan with all architectural decisions |
| worktree | `d148e22` | feat: add voice recognition service layer (Google Cloud STT + VOSK) |
| worktree | `11e39ac` | feat: add voice recognition backend route (Google Cloud STT V2 proxy) |
| worktree | `421915f` | docs: update project plan with completed voice recognition |
| worktree | `1cce887` | feat: add PostHog analytics integration (EU instance) |

---

## ⚠️ PRD расхождения

| PRD говорит | В коде реально | Решение |
|------------|---------------|---------|
| React Navigation v6 | v7 | ✅ Обновить PRD — v7 лучше |
| Zustand + React Query | Только Zustand | ✅ Решено: RQ добавить в Фазе 4 для серверных данных (отчёты, справочники, shared data) |
| Drizzle ORM | Drizzle ORM | ✅ Решено: миграция завершена |
| expo-speech-recognition | Google Cloud STT + VOSK | ✅ Решено (см. таблицу ниже) |
| react-native-gifted-charts | Нет | ✅ Решено: обязательно установить. Графики на каждом этапе — сколько, где, динамика расходов/доходов |
| Нет аналитики поведения | PostHog ✅ | ✅ Решено: PostHog (posthog-react-native) — EU хостинг, GDPR, screen tracking, 1M событий/мес бесплатно |
| React Native Paper | Кастомные компоненты | ✅ Решено: кастомные. Своя дизайн-система (dark #101010, Inter, spacing), Paper будет мешать |
| React Hook Form + Zod | Только Zod | ✅ Решено: только Zod + useState. RHF добавить точечно если появятся сложные формы (15+ полей) |
| DatabaseProvider, ThemeProvider | AppProviders.tsx | ✅ Решено: всё в AppProviders.tsx (NavContainer + StatusBar + i18n + auth init + DB migrations) |

### 🎤 Voice Recognition — сравнение решений

| Решение | Узбекский | iOS | Android | Expo SDK 54 | On-Device | Real-Time | Стоимость/мин | Качество UZ | Выбрано |
|---------|-----------|-----|---------|-------------|-----------|-----------|---------------|-------------|---------|
| **expo-speech-recognition** | НЕТ (iOS), Возможно (Android) | Частично | Частично | Config plugin | Частично | Да | Бесплатно | N/A на iOS | НЕТ |
| **@react-native-voice/voice** | НЕТ (iOS), Возможно (Android) | Частично | Частично | СЛОМАНО (SDK несовместим) | Частично | Да | Бесплатно | N/A на iOS | НЕТ |
| **Google Cloud STT** | ДА (uz-UZ) | через API | через API | Любой workflow | Нет | Да (streaming) | ~$0.016-0.024 | Среднее | ✅ ДА |
| **OpenAI Whisper API** | ДА (uz) | через API | через API | Любой workflow | Нет | Нет streaming | $0.006 | Очень низкое (~90% WER) | НЕТ |
| **whisper.rn (on-device)** | ДА (uz) | Да | Да | Config plugin + prebuild | Да | Да | Бесплатно | Очень низкое без fine-tune | НЕТ |
| **Azure Speech STT** | ДА (uz-UZ) | через API | через API | Любой workflow | Нет | Да (streaming) | ~$0.017 | Среднее | Резерв |
| **ElevenLabs Scribe** | ДА (uzb) | через API | через API | Любой workflow | Нет | Да (150ms WS) | ~$0.007 | Хорошее (10-25% WER) | Резерв |
| **VOSK** | ДА (uz) | Да | Да | Встроенный Expo plugin | Да | Да | Бесплатно | Базовое/Удовл. | ✅ ДА (offline) |
| **UzbekVoice.ai** | ДА (спец. для UZ) | через API | через API | Любой workflow | Нет | Неизвестно | Неизвестно | Вероятно лучшее | Исследовать |

> **Решено:** Google Cloud STT (cloud, uz/ru/en) + VOSK (offline fallback) + voiceParser.ts (text parsing).
> expo-speech-recognition НЕ подходит — нет узбекского на iOS.

---

## 🔧 Конфигурация

- **App:** Castar (bundle: castar)
- **Deep link:** castar://
- **Portrait only, New Architecture enabled**
- **iOS** (tablet support) + **Android** (edge-to-edge)
- **Backend:** https://castar-auth.ivcswebofficial.workers.dev
- **Telegram bot:** @castar_bot
- **Языки:** uz (default), ru, en
- **Валюты:** UZS (default), USD, EUR, RUB

> **ВАЖНО:** Название пишется **Castar** или **castar**. Никогда не писать "CaStar" (s с большой буквы).
