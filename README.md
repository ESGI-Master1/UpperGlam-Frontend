# Upper Glam Mobile App

[![CI](https://github.com/ESGI-Master1/UpperGlam-Frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/ESGI-Master1/UpperGlam-Frontend/actions/workflows/ci.yml)

React Native mobile application for Upper Glam, built with Expo and TypeScript.

## Tech Stack

- **React Native** with Expo (~55.0.9)
- **TypeScript** (strict mode)
- **React Navigation** (Stack + Bottom Tabs)
- **Axios** for API calls
- **React Hook Form** for form management
- **PostHog** for analytics (to be integrated)

## Project Structure

```
src/
├── app/              # App-level configuration
├── screens/          # Navigation screens
├── components/       # Business components
├── ui/               # Design system components
├── hooks/            # Custom React hooks
├── services/         # Business logic layer
├── api/              # HTTP client and API calls
├── store/            # State management (if needed)
├── utils/            # Utility functions
├── types/            # TypeScript type definitions
├── analytics/        # PostHog analytics layer
└── theme/            # Design tokens (colors, spacing, typography)
```

## Design System

### Colors

- Background: `#0B0B0C`
- Surface: `#111114`
- Primary Text: `#F5F5F5`
- Secondary Text: `#B9B9B9`
- Accent Champagne: `#D6B36A`
- Accent Hover: `#E2C27D`

### Typography

- **Headings**: Playfair Display
- **Body**: Inter

### Spacing Scale

`4, 8, 12, 16, 24, 32`

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Android Studio (SDK + Android Emulator)
- JDK 17
- Expo account (for cloud APK builds with EAS)

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Pour Android Emulator, utiliser `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3333`. Pour un appareil physique, utiliser l'IP LAN de la machine qui execute l'API. La matrice local/preview/production est documentee dans le guide infrastructure du backend.

### Run on Android (without Expo Go)

```bash
# Check Android toolchain (Java/SDK/AVD)
npm run android:check

# Build + install native app on emulator (no Expo Go)
npm run android

# Next launches (after app is already installed)
npm run android:dev-client

# Run on iOS
npm run ios

# Run on web
npm run web
```

### Build APK for a tester

```bash
# One-time login
npx eas-cli login

# One-time project link, required before non-interactive cloud builds
npx eas-cli init

# Build installable APK (internal distribution)
npm run android:apk
```

At the end of the build, EAS provides a download URL for the `.apk` that you can send directly to testers.

If `java` or `adb` is not detected right after installing Android/JDK tools on Windows, close and reopen your terminal once.

## Demo Procedure

### Client flow

1. Log in with a client account.
2. Search for a provider from the `Search` tab, then open the provider details page.
3. Start a booking, select appointment mode, date, slot, address if home service, and optional note.
4. Continue to payment, open the Mollie checkout, then return to the app and validate the payment.
5. Open `Bookings` and verify the booking status, payment status, confirmation code, amount, address, and refund information if present.
6. Open the booking detail screen, test a valid modification, then test cancellation.

### Provider flow

1. Log in with a provider account and switch to the provider experience.
2. Check `Activity`, `Agenda`, `Ops`, and `Profile pro`.
3. In `Agenda`, accept/reject/propose a slot for a booking and update recurring availability or closures.
4. In `Profile pro`, update profile details, service zones, services catalog, and gallery.
5. In `Ops`, verify clients, internal notes, revenue, payouts, transactions, and CSV exports.

### Edge cases to test

- Network disabled during provider search, booking creation, payment validation, booking update, and cancellation.
- Payment refused or abandoned in Mollie, then retry from the payment screen.
- Slot already taken or draft expired before payment validation.
- Small Android screen and standard Android screen.

## Development

### Linting & Formatting

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check
```

### CI & Branch Protection

- `CI` (`.github/workflows/ci.yml`): lint + type-check + tests + prettier check
- `PR Conventions` (`.github/workflows/pr-conventions.yml`): semantic PR title + branch/commit naming conventions
- `Dependency Audit` (`.github/workflows/dependency-audit.yml`): `npm audit` sur deps de prod (PR lockfile + weekly)

To apply protection on `main`, run the workflow `Apply Main Branch Protection` after adding
`ADMIN_GITHUB_TOKEN` (admin PAT) in repository secrets.

### Architecture Guidelines

- ✅ **DO**: Keep components under 200 lines
- ✅ **DO**: Use TypeScript strict mode (no `any`)
- ✅ **DO**: Use absolute imports (`@components`, `@ui`, etc.)
- ✅ **DO**: Separate business logic from UI
- ❌ **DON'T**: Make API calls directly in components
- ❌ **DON'T**: Use inline styles (use `StyleSheet`)
- ❌ **DON'T**: Add random dependencies without approval

### Analytics

All user interactions should be tracked using the centralized analytics layer:

```typescript
import { trackEvent, trackScreenView, ANALYTICS_EVENTS } from '@analytics';

// Track screen view
trackScreenView('Home', { entrypoint: 'app_launch' });

// Track CTA click
trackEvent(ANALYTICS_EVENTS.CTA_CLICK_LOGIN, {
  cta_name: 'login_button',
  screen_name: 'Home',
});
```

## UI Components

Available components in `src/ui/`:

- `<Text>` - Styled text component
- `<Container>` - Layout container
- `<Button>` - Button with variants
- `<Input>` - Form input with validation
- `<Card>` - Surface card component
- `<Loader>` - Loading indicator
- `<EmptyState>` - Empty state placeholder

## License

Private - Upper Glam
