---
apply: always
---

# 🔒 Upper Glam — Strict React Native Guidelines (IA Ultra Cadrée)

## ⚠️ PROJECT CONTEXT

Upper Glam Mobile App is the **main product experience**.

Technology stack:

- React Native (Expo)
- TypeScript (strict mode)
- React Navigation

This project is:

- NOT the marketing website
- CONNECTED to backend API (clean architecture required)
- Mobile-first ONLY (no web adaptation)

Primary goals:

- Premium UI/UX
- Smooth performance (60 FPS minimum)
- Clean architecture
- Scalable codebase
- Excellent Developer Experience (DX)

---

# 🏗 ARCHITECTURE RULES

## Folder Structure (Mandatory)

src/
app/
screens/
components/
ui/
hooks/
services/
api/
store/
utils/
types/
assets/
theme/

Rules:

- screens = navigation pages
- components = business components
- ui = design system
- services = business logic
- api = HTTP layer

❌ No mixing UI and business logic  
❌ No direct API calls in components

---

# 📦 DEPENDENCY RULES

Allowed:

- react-native
- expo
- react-navigation
- axios (or fetch wrapper)
- react-hook-form

Forbidden:

- Redux (initial phase)
- MobX / Zustand
- UI kits (NativeBase, Paper, etc.)
- Heavy animation libraries

---

# 🎨 DESIGN SYSTEM RULES (STRICT)

## Color Palette (Do Not Modify)

- Background: #0B0B0C
- Surface: #111114
- Primary Text: #F5F5F5
- Secondary Text: #B9B9B9
- Accent Champagne: #D6B36A
- Accent Hover: #E2C27D

❌ No additional colors allowed.

## Typography

- Titles: Playfair Display
- Body: Inter

---

# 📐 UI RULES

- Mobile-first ALWAYS
- Flexbox only
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32

---

# 🧩 COMPONENT RULES

Mandatory components:

- Button
- Input
- Card
- Text
- Container
- Loader
- EmptyState

Rules:

- Max 200 lines
- No inline styles → StyleSheet
- Typed props only

---

# 📱 NAVIGATION RULES

- React Navigation (Stack + Tabs)
- Typed routes
- Central config

---

# 🌐 API RULES

Flow:
UI → service → API

❌ No API in components

---

# 🧠 TYPESCRIPT RULES

- strict true
- no any
- DTO required

---

# ⚡ PERFORMANCE RULES

- Optimize re-renders
- FlatList for lists
- Lazy load screens

---

# 📊 PRODUCT ANALYTICS & MCP POSTHOG RULES

A dedicated **PostHog MCP** is available for this project.

This means every new feature, screen, funnel, CTA, form, or sensitive UX step must trigger a **systematic product analytics reflection** before implementation.

Mandatory rule:

> Before coding a feature, always ask:
>
> - Should this behavior be tracked?
> - Is this step important for conversion, retention, drop-off analysis, or UX quality?
> - Will this event help understand user behavior or diagnose friction?

## When tracking should be considered

Tracking must be evaluated for:

- onboarding steps
- authentication steps
- pre-registration funnel
- role selection
- booking flow
- payment flow
- form submission
- important CTA clicks
- feature discovery
- screen abandonment
- errors shown to the user
- empty states
- retry actions

## If tracking is relevant

Then the implementation must include:

- the PostHog event itself
- a clear event name
- typed event payload properties
- the required screen/user/context metadata
- a documented place where the team can read and reuse this information

## Mandatory architecture for analytics

Add and maintain:

```
src/
  analytics/
    events.ts
    track.ts
    screen.ts
    types.ts
```

### Responsibilities

- `events.ts` = central event names/constants
- `track.ts` = shared tracking helpers
- `screen.ts` = screen view tracking helpers
- `types.ts` = typed event payload contracts

❌ No raw PostHog calls scattered everywhere  
❌ No hardcoded event names inside components  
❌ No untyped tracking payloads

## Reading the information

Tracking is only useful if the information is readable.

So the project must also include:

- a documented event naming convention
- a stable list of events
- clear payload fields
- enough metadata to analyze funnels and drop-offs
- consistent screen naming

Recommended minimum metadata when relevant:

- `screen_name`
- `user_role`
- `entrypoint`
- `step`
- `status`
- `error_code`
- `cta_name`

## Event naming convention

Use explicit snake_case event names, for example:

- `screen_view_home`
- `cta_click_pre_registration_start`
- `form_submit_pre_registration`
- `form_error_pre_registration`
- `booking_step_completed`
- `payment_intent_started`

Rules:

- event names must describe a user action or state
- avoid vague names like `clicked_button`
- avoid duplicates with slightly different names

## DX rule for AI coding

When generating code for a new feature, the AI must:

1. evaluate whether tracking is useful,
2. propose the relevant PostHog events,
3. integrate the tracking if justified,
4. use the shared analytics layer,
5. ensure the tracked information will be understandable later.

If tracking is intentionally not added, that choice should be explicit and justified.

# 🔐 SECURITY RULES

- No API keys
- Secure storage for tokens

---

# 🧪 DX RULES

- ESLint + Prettier
- Absolute imports
- Clean commits

---

# 🚫 PROHIBITIONS

❌ Business logic in UI  
❌ Inline styles  
❌ Random dependencies

---

# 🎯 FINAL OBJECTIVE

- Premium
- Smooth
- Scalable
- Maintainable
