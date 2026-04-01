# Upper Glam Mobile App

React Native mobile application for Upper Glam, built with Expo and TypeScript.

## Tech Stack

- **React Native** with Expo (~55.0.8)
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
- Expo Go app (for mobile testing)

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Run the App

```bash
# Start Expo dev server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

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
