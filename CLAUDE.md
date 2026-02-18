# CaStar — Полный архитектурный план

## Обзор проекта
CaStar — мобильное приложение для личного и семейного финансового учёта.
Платформы: iOS, Android. Стек: Expo SDK 54, React Native 0.81, TypeScript 5.9.

---

## 1. Архитектура

### Feature-First структура
```
src/
├── core/                         # App-level инфраструктура
│   ├── navigation/              # Навигация (Root → Auth/Main)
│   │   ├── RootNavigator.tsx    # Условный рендер Auth или Main
│   │   ├── AuthNavigator.tsx    # Onboarding → Login → Register
│   │   └── TabNavigator.tsx     # 4 таба + вложенные стеки
│   └── providers/
│       └── AppProviders.tsx     # NavigationContainer + StatusBar + i18n
│
├── features/                    # Фичи (самодостаточные модули)
│   ├── auth/                   # Аутентификация
│   │   ├── screens/            # Onboarding, Login, Register
│   │   └── store/              # authStore (Zustand)
│   ├── transactions/           # Транзакции (Главная)
│   │   ├── screens/            # Home, AddTransaction, TransactionDetail, Transactions
│   │   └── store/              # transactionStore
│   ├── budget/                 # Бюджеты
│   │   ├── screens/            # Budgets, BudgetDetail, CreateBudget, FamilyBudget
│   │   └── store/              # budgetStore
│   ├── categories/             # Категории
│   │   ├── screens/            # Categories, CreateCategory
│   │   └── store/              # categoryStore
│   ├── analytics/              # Аналитика
│   │   ├── screens/            # Analytics
│   │   └── store/              # analyticsStore
│   └── profile/                # Профиль и настройки
│       ├── screens/            # Profile, Settings
│       └── store/              # profileStore
│
├── shared/                     # Переиспользуемое
│   ├── constants/              # Дизайн-токены
│   │   ├── colors.ts           # 64 цветовых токена, тёмная тема (#101010)
│   │   ├── typography.ts       # Inter font, 20+ стилей текста
│   │   ├── spacing.ts          # Spacing, grid (6 колонок), borderRadius, iconSize
│   │   ├── config.ts           # APP_CONFIG (валюты, языки, версия)
│   │   └── defaultCategories.ts # 14 дефолтных категорий (10 расход, 4 доход)
│   ├── i18n/                   # Интернационализация
│   │   ├── uz.json             # Узбекский
│   │   ├── ru.json             # Русский
│   │   ├── en.json             # Английский
│   │   └── index.ts            # i18next init + auto-detection
│   ├── services/               # Бизнес-логика
│   │   ├── api/apiClient.ts    # HTTP клиент (Bearer auth, GET/POST/PUT/DELETE)
│   │   ├── currency/           # Конвертация валют (frankfurter.app + кэш 1ч)
│   │   ├── sync/syncService.ts # Offline-first синхронизация (stub)
│   │   └── voice/voiceParser.ts # Парсинг голосового ввода (3 языка)
│   ├── types/
│   │   ├── common.ts           # Все entity типы (User, Transaction, Budget...)
│   │   └── navigation.ts       # Типы навигации
│   └── utils/
│       ├── formatCurrency.ts   # Форматирование сумм (compact: K/M)
│       └── formatDate.ts       # Форматирование дат (date-fns, 3 локали)
│
└── assets/
    └── icons/logo.svg
```

---

## 2. Навигация

```
RootNavigator (conditional)
├── AuthNavigator (if !isOnboarded)
│   ├── Onboarding   ← стартовый экран, полный UI реализован
│   ├── Login         ← заглушка
│   └── Register      ← заглушка
│
└── TabNavigator (if isOnboarded) — 4 таба
    ├── HomeTab (HomeStack)
    │   ├── Home               ← список транзакций, баланс
    │   ├── AddTransaction     ← форма + голосовой ввод
    │   └── TransactionDetail  ← детали транзакции
    ├── BudgetTab (BudgetStack)
    │   ├── Budgets            ← список бюджетов
    │   ├── BudgetDetail       ← детали бюджета
    │   ├── CreateBudget       ← создание бюджета
    │   └── FamilyBudget       ← семейный бюджет
    ├── AnalyticsTab (AnalyticsStack)
    │   └── Analytics          ← графики, тренды
    └── ProfileTab (ProfileStack)
        ├── Profile            ← профиль пользователя
        ├── Settings           ← настройки приложения
        ├── Categories         ← управление категориями
        └── CreateCategory     ← создание категории
```

---

## 3. State Management (Zustand)

### authStore
- `isAuthenticated`, `isOnboarded`, `token`, `userId`
- `setOnboarded()`, `setAuthenticated()`, `logout()`, `skipAuth()`

### transactionStore
- `transactions[]`, `isLoading`, `filters`
- `addTransaction()`, `updateTransaction()`, `removeTransaction()`
- `setFilters()`, `resetFilters()`

### budgetStore
- `budgets[]`, `isLoading`
- `addBudget()`, `updateBudget()`, `removeBudget()`

### categoryStore
- `categories[]`, `isLoading`
- `addCategory()`, `updateCategory()`, `removeCategory()`

### analyticsStore
- `period` (week/month/quarter/year), `summary`, `isLoading`
- `setPeriod()`, `setSummary()`

### profileStore
- `user`, `settings` (theme, notifications, biometricLock)
- `updateUser()`, `updateSettings()`, `setDefaultCurrency()`, `setLanguage()`

---

## 4. Система типов (TypeScript)

### Основные сущности
- **User** — id, name, email, phone, defaultCurrency, language, avatar, familyGroupId
- **Transaction** — id, type (income/expense/transfer), amount, currency, categoryId, accountId, description, timestamp, isRecurring, voiceInputText
- **Budget** — id, name, amount, spent, currency, categoryId, period (daily/weekly/monthly/yearly), startDate, endDate, isFamilyBudget, familyGroupId
- **Category** — id, nameKey, icon, color, type (income/expense), parentId, isDefault
- **Account** — id, name, type (cash/card/bank/savings), balance, currency, color, icon
- **FamilyGroup** — id, name, members[], inviteCode
- **FamilyMember** — userId, role (owner/admin/member), joinedAt
- **ExchangeRate** — from, to, rate, fetchedAt
- **RecurringTransaction** — id, transactionId, frequency, nextDate, isActive

### DTOs
- CreateTransactionDTO, UpdateTransactionDTO
- CreateBudgetDTO, UpdateBudgetDTO
- CreateCategoryDTO, UpdateCategoryDTO

### Фильтры
- TransactionFilters — type, categoryId, accountId, dateFrom, dateTo, amountMin, amountMax, currency

### Аналитика
- AnalyticsPeriod — 'week' | 'month' | 'quarter' | 'year' | 'custom'
- AnalyticsSummary — totalIncome, totalExpense, balance, byCategory[], trend[]
- VoiceParseResult — amount, currency, type, categoryHint, description, confidence, rawText

---

## 5. Дизайн-система

### Цвета (Dark Theme)
- **Background:** `#101010`
- **Surface:** `#1A1A1A`
- **Surface elevated:** `#242424`
- **White:** 100% `#FFFFFF` → 4% `#FFFFFF0A` (8 уровней)
- **Warning:** `#FAAD14` (500)
- **Error:** `#F55858` (500)
- **Info:** `#4B8DF5` (500)
- **Success:** `#17E56C` (500)
- **Semantic aliases:** text (`white.90`), textSecondary (`white.60`), textTertiary (`white.40`), border (`white.8`), divider (`white.6`)

### Типографика (Inter)
- Weights: Regular (400), Medium (500), SemiBold (600), Bold (700)
- Sizes: xs(11) → 4xl(32)
- Стили: heading1-5, bodyLarge*, body*, small*, caption*

### Spacing
- xs(4), sm(8), md(12), base(16), lg(20), xl(24), 2xl(32), 3xl(40), 4xl(48), 5xl(64)
- Grid: 6 колонок, margin 24, gutter 20

### Border Radius
- sm(4), md(8), lg(12), xl(16), 2xl(20), 3xl(24), full(9999)

---

## 6. Сервисы

### API Client
- Bearer token auth
- GET, POST, PUT, DELETE
- Stub — ждёт бэкенд

### Currency Service
- frankfurter.app API (бесплатный, без ключа)
- Кэширование курсов (1 час TTL)
- 7 валют: UZS, USD, EUR, RUB, GBP, TRY, KZT

### Voice Parser
- Парсинг суммы, валюты, типа транзакции, подсказки категории
- 3 языка: русский, узбекский, английский
- Множители: ming/тысяч (×1000), million/миллион (×1M)
- Confidence scoring (0-1)

### Sync Service (stub)
- Offline-first архитектура
- sync_queue для изменений
- Last-write-wins для конфликтов

---

## 7. i18n

- **Языки:** uz (по умолчанию), ru, en
- **Auto-detection** через expo-localization
- **Разделы переводов:** common, auth, tabs, home, transactions, budget, analytics, profile, categories

---

## 8. Зависимости

### Core
- expo ~54.0.33, react 19.1.0, react-native 0.81.5, typescript ~5.9.2

### Navigation
- @react-navigation/native, bottom-tabs, native-stack (v7)

### State & Validation
- zustand ^5.0.11, zod ^4.3.6

### i18n
- i18next ^25.8.8, react-i18next ^16.5.4, expo-localization

### UI
- expo-linear-gradient, react-native-svg, @expo-google-fonts/inter
- expo-haptics, react-native-reanimated, react-native-gesture-handler

### Utils
- date-fns ^4.1.0, uuid ^13.0.0

### Security
- expo-secure-store (для токенов)

---

## 9. Текущий статус

### DONE ✅
- [x] Feature-first архитектура
- [x] Навигация (Auth + 4 таба с вложенными стеками)
- [x] 6 Zustand сторов
- [x] Полная система типов TypeScript
- [x] Дизайн-система (colors, typography, spacing)
- [x] i18n (3 языка, auto-detection)
- [x] Onboarding экран (полный UI по Figma)
- [x] Сервисы: API client, currency, voice parser, sync (stubs)
- [x] Утилиты: formatCurrency, formatDate

### TODO 📋

#### Фаза 2 — UI экранов
- [ ] Home экран (карточка баланса, доход/расход, список последних транзакций)
- [ ] AddTransaction экран (форма: сумма, категория, счёт, дата, описание + voice input)
- [ ] TransactionDetail экран (просмотр/редактирование)
- [ ] Budgets экран (список бюджетов с прогресс-барами)
- [ ] BudgetDetail экран (расходы по бюджету, progress)
- [ ] CreateBudget экран (форма создания)
- [ ] FamilyBudget экран
- [ ] Analytics экран (графики: доход vs расход, по категориям, тренды)
- [ ] Categories экран (список с иконками и цветами)
- [ ] CreateCategory экран (форма с выбором иконки и цвета)
- [ ] Profile экран (аватар, имя, навигация к настройкам)
- [ ] Settings экран (язык, валюта, тема, уведомления, биометрия)
- [ ] Login/Register экраны (Telegram, Phone, Email)
- [ ] Shared UI компоненты (Button, Input, Card, BottomSheet, Modal, etc.)

#### Фаза 3 — Данные и хранение
- [ ] SQLite интеграция (expo-sqlite)
- [ ] Таблицы: transactions, budgets, categories, accounts, sync_queue
- [ ] CRUD операции через repository pattern
- [ ] Валидация форм (Zod schemas)
- [ ] Миграции БД
- [ ] Загрузка дефолтных категорий при первом запуске

#### Фаза 4 — Бэкенд
- [ ] Cloudflare Workers API (или другой бэкенд)
- [ ] Аутентификация (Telegram OAuth, SMS OTP, Email)
- [ ] REST API: /auth, /transactions, /budgets, /categories, /accounts
- [ ] Синхронизация (offline-first + sync_queue)
- [ ] Live курсы валют (CBU API для UZS)

#### Фаза 5 — Продвинутые фичи
- [ ] Семейные бюджеты (FamilyGroup, приглашения)
- [ ] Повторяющиеся транзакции
- [ ] Push-уведомления (превышение бюджета, напоминания)
- [ ] Биометрическая аутентификация (expo-local-authentication)
- [ ] Экспорт данных (CSV/PDF)
- [ ] Виджеты (iOS/Android)
- [ ] Тёмная/светлая тема (переключение)

---

## 10. Конфигурация

- **App name:** CaStar
- **Bundle:** castar
- **Orientation:** Portrait
- **New Architecture:** Enabled
- **Platforms:** iOS (tablet support), Android (edge-to-edge), Web
- **Plugins:** expo-localization, expo-secure-store
