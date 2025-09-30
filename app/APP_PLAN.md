# Neurolancer Mobile App (React Native + Expo + Tailwind) – Product & Engineering Plan

Version: 1.0
Owner: Mobile Platform
Status: Draft (ready to implement)

## 0) Objectives
- Deliver a high-quality Neurolancer mobile app (Android/iOS) that reuses the existing Django backend.
- Provide a fast, reliable experience with strong UI/UX parity to the web app while respecting mobile patterns.
- Avoid the prior “dev-only” problem: enforce strict type checks, lint, and reproducible builds from day one.

## 1) Tech Stack & Key Decisions
- Runtime: React Native via Expo (managed workflow). Hermes enabled.
- Styling: Tailwind via NativeWind (className on RN components).
- Navigation: React Navigation (Bottom Tabs + Native Stack + Drawer).
- Data fetching: Axios + @tanstack/react-query (with MMKV persistence for offline cache).
- Auth: Token-based (JWT via DRF SimpleJWT recommended) or cookie+session with react-native-cookies (fallback plan). Tokens stored in expo-secure-store.
- i18n: i18next + expo-localization; languages mirrored from web LangContext.
- Theming: Light/Dark using NativeWind + context tokens; user preference persisted.
- Currency: app-wide currency context; FX rates cached & updated on schedule.
- Notifications: Expo Notifications (push); in-app real-time polling or websockets for critical events.
- Forms: react-hook-form + zod (schema validation); reusable Field components.
- Media: Expo Image (fast image); File picker via expo-document-picker/image-picker.
- Animations/Micro-interactions: react-native-reanimated + react-native-gesture-handler + expo-haptics.
- Testing: Jest + React Native Testing Library; E2E Detox (optional later); QA checklist + manual device tests.

## 2) Design System & Theming
- Primary color: Teal (same as web navbar): #0D9E86
- Secondary palette: Purples/Blues used on CTA on web (e.g., #5B21B6, #2563EB). Use sparingly.
- Neutrals: Gray-50..900 mapped to Tailwind defaults.
- Tokens (examples):
  - color.primary = #0D9E86
  - color.primary.dim = #0a7e6b
  - color.accent = #5B21B6
  - text.primary = gray-900 (light) / gray-100 (dark)
  - bg.app = white (light) / gray-900 (dark)
  - border.default = gray-200 (light) / gray-700 (dark)
- Typography: System fonts, consistent sizes (xs..2xl), strict line-height, letter spacing.
- Components adhere to 8pt spacing grid; tap targets >= 44pt.

## 3) Navigation Structure (Two navigations + SideNav)
- Root: Drawer (SideNav) – opens from left, contains global sections and settings
  - Items: Home, Explore, Messages, Notifications, Orders, Projects (client), My Gigs (freelancer), Referrals, Settings (Theme/Language/Currency), Help/Support, About, Privacy, Terms, Logout
- Primary Nav: Bottom Tabs (5): Home, Explore, Messages, Notifications, Profile
- Secondary Nav: Top tabs inside Explore (or segmented controls): Gigs | Jobs | Experts
- Screen stacks:
  - HomeStack: Home, Onboarding, Announcements
  - ExploreStack: Search, Filters, GigDetail, JobDetail, FreelancerDetail
  - MessagesStack: Conversations, Chat, Group modals
  - NotificationsStack: Feed, NotificationDetail
  - ProfileStack: Profile, EditProfile, Settings (Theme/Language/Currency), Verification, Skill Tests (if later), Admin (if role)

## 4) Screen Inventory & Flows
- Auth:
  - Splash → Login/Signup (Email/Password, Google optional)
  - Email verification gate
  - Phone verification (optional phase 2; native reCAPTCHA or SMS provider)
- Home: Hero, categories (AI Dev/Data/Integration/Ethics/Creative/Ops), featured gigs/jobs, CTA buttons
- Explore: Search (free text), filters (category/subcategory, price, rating, likes), results list with infinite scroll
- Gigs: GigDetail (author info, pricing tiers, likes, CTA to message/order)
- Jobs: JobDetail (client info, budget, proposals CTA)
- Experts: Freelancers list + detail
- Messages: List (with unread counts), chat (rich messages, attachments, quick action cards, AI Assistant)
- Notifications: Feed + quick actions (Accept/Decline task assignment, View order, etc.)
- Orders/Projects (role-based): lists, detail, CTAs, progress
- Profile: View & edit; currency/language/theme in Settings
- Admin (if email matches admin): link to admin features (basic read-only in v1)
- Help/Support: tickets (view/create), FAQ

## 5) Component Inventory (from web, mapped for mobile)
Reusable RN Components (to be built, adapted from web feature parity):
- Navigation
  - AppHeader (replacing web Navigation)
  - BottomTabs
  - SideDrawer
  - TopTabs/SegmentedControl (Explore)
- Identity/UI
  - Avatar (src, avatarType: upload|avatar|google, selectedAvatar, googlePhotoUrl)
  - VerificationBadge
  - LikeButton
  - ThreeDotsMenu → ActionSheet
  - PriceDisplay (currency-aware)
  - Pagination → InfiniteList controls
  - SimpleChart (optional)
- Content & Cards
  - CategoryCard (AIDev, DataModel, AIEthics, AIIntegration, CreativeAI, AIOperations)
  - GigCard, JobCard, ExpertCard
  - TaskCard
  - RecommendationTile (RecommendationsSection)
- Forms/Inputs
  - ControlledTextInput, NumberInput, Select (modal picker), DatePicker
  - PhoneInput (phase 2), FilePicker
  - FormSection + ValidatedField
- Modals & Sheets (ported from web)
  - EmailVerificationGate
  - OnboardingModal / OnboardingReminderModal
  - CreateProjectModal
  - CreateTaskModal / TaskProposalModal
  - FileUploadModal
  - GroupChatModal / GroupInviteModal / GroupDiscoveryModal
  - ProfileCompletionModal
  - WithdrawalModal / OrderModal / ReviewModal / ReportModal
- Messaging
  - MessageBubble, MessageAttachment, MessageComposer
  - EmojiPicker (lightweight), AI Assistant Widget (FloatingChatbot → Floating FAB + Assistant screen)
- System
  - NotificationBell + NotificationList (as screen, not tiny dropdown)
  - CookieConsent (N/A on native; show Privacy note on first run)
  - LanguageSwitcher → Settings picker
  - CurrencySwitcher → Settings picker
  - ThemeToggle → Settings
  - RoleGuard → use on protected screens
- Visual polish
  - NeuralNetworkBackground → optional animated header background
  - Skeleton loaders, shimmer placeholders

Source reference from web/components (for parity planning):
- AdminLayout, AppTranslator, Avatar, AvatarSelector, ClientProfileForm, CookieConsent, CreateProjectModal, CreateTaskModal, CurrencySwitcher, DeleteButton, EditJobModal, EmailVerificationGate, FileUploadModal, FirebasePhoneAuth, FirebasePhoneVerification, FloatingChatbot, Footer, FreelancerProfileForm, GroupChatModal, GroupDiscoveryModal, GroupInviteModal, LanguageSwitcher, LikeButton, LocationSelector, MessageAttachment, MessageContent, Navigation, NeuralNetworkBackground, NotificationCenter, OnboardingModal, OnboardingReminderModal, OrderModal, Pagination, PhoneVerification, PhoneVerificationModal, PriceDisplay, ProfileCompletionModal, ProjectTeamModal, RecommendationsSection, ReportModal, ReviewModal, RoleGuard, RoleSelectionModal, SimpleChart, TaskCard, TaskProposalModal, ThreeDotsMenu, VerificationBadge, WithdrawalModal

Note: UI will be redesigned to mobile-first while keeping features and branding.

## 6) Data & Backend Integration
- Base URL: use the same Django API (configure per env)
- Auth options:
  1) Preferred: JWT (DRF SimpleJWT) endpoints: /auth/jwt/create, /auth/jwt/refresh
  2) Alt: Session cookie with react-native-cookies and axios withCredentials
- API client: axios instance with interceptors (auth header, 401 handling → refresh token or logout)
- react-query: caching, retries, mutations; persist cache to MMKV for offline reads; optimistic updates for likes, read flags
- Endpoints parity: notifications, messages, gigs, jobs, freelancers, projects, orders, payments, verification, referrals, settings
- File uploads: presigned URLs or multipart with correct headers

## 7) Settings (Language, Theme, Currency, Region)
- Language: i18next resources from LANGUAGES used on web (mirror); default from device locale; user override stored to secure store
- Theme: light/dark/system; NativeWind + context; persist choice
- Currency: select (KES, USD, EUR, GBP, NGN, INR); FX retrieval schedule (daily), fallback to last cached rates; PriceDisplay consumes

## 8) Notifications
- Push: Expo Notifications (device push token), backend push via Expo’s service
- In-app: react-query polling (10–30s) or websockets (phase 2)
- Actionable notifications: accept task, view order/proposals/messages

## 9) UX & Accessibility
- Touch targets ≥ 44pt; large tap areas for critical controls
- Bottom sheets for filters & pickers; consistent gesture handling
- Haptics on key actions (like, submit, success/failure)
- Empty states, skeleton loaders, error toasts with retry
- Keyboard-aware scrollviews for forms
- Accessibility: labels, roles, color contrast, dynamic font size support

## 10) Reliability & Quality Gates (to avoid “build has 100 errors”)
- TypeScript strict; noImplicitAny; isolatedModules
- Linting: eslint + @react-native/eslint-config; prettier
- expo-doctor checks in CI; tsc --noEmit in CI; eslint . in CI
- Branded error boundary & logging to Sentry (phase 2)
- Feature flags for risky modules

## 11) Performance
- Hermes; FlatList with keyExtractor, getItemLayout where possible
- Image caching; thumbnails first; avoid large SVGs
- Memoize components; avoid heavy re-renders
- Batch API calls; paginate everywhere

## 12) Security
- Secure token storage (expo-secure-store)
- HTTPS only; certificate pinning (phase 2)
- No secrets committed; env via app.config.ts + dotenv

## 13) Build & Release
- Expo managed dev with Expo Go; EAS Build for release
- Android first; iOS when available
- Versioning via app.json/app.config.ts

## 14) Project Structure (proposed)
app/
  mobile/
    src/
      api/ (axios, endpoints)
      components/ (from inventory above)
      screens/ (Home, Explore, Messages, Notifications, Profile, Settings, Auth, Detail screens)
      navigation/ (Drawer, Tabs, Stacks)
      contexts/ (Auth, Theme, Language, Currency)
      hooks/ (useAuth, useNotifications, useCurrencyRates)
      utils/ (format, dates, validators)
      assets/ (images, icons)
    app.config.ts
    tailwind.config.js
    babel.config.js
    tsconfig.json
    package.json

## 15) Milestones
- M0 (Day 0–1): Repo bootstrap, navigation, theme, Tailwind setup, CI checks
- M1 (Week 1): Auth, Home, Explore list, Settings (Theme/Language/Currency)
- M2 (Week 2): Detail pages (Gig/Job/Expert), Messages list + chat MVP, Notifications
- M3 (Week 3): Projects/Orders (role-based), uploads, modals/sheets
- M4 (Week 4): Polish, performance, test coverage, EAS preview build

## 16) Risks & Mitigations
- Session auth on mobile: prefer JWT; if not feasible, use RN cookie lib
- Push notification delivery: require backend job to send; plan fallback polling
- Design drift: define tokens & component library early; storybook-native (optional)

## 17) Acceptance Criteria (v1)
- Users can login, browse gigs/jobs/experts, message, receive notifications, change theme/language/currency, and view/edit profile
- Production build passes CI (tsc, lint, expo-doctor) and runs on physical Android device
