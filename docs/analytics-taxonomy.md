# Analytics taxonomy

## Activation

Mobile PostHog capture is enabled only when:

- `EXPO_PUBLIC_APP_ENV=production`
- a PostHog key is configured
- the authenticated user preference `analyticsEnabled` is `true`

In development, events are logged to the console for debugging but are not sent to PostHog.

## Mobile critical events

- Auth: `auth_login_success`, `auth_login_failed`, `auth_register_success`, `auth_register_failed`
- Search: `screen_view_search`, `cta_click_search_tag`, `cta_click_provider_card`
- Provider detail: `screen_view_provider_details`, `cta_click_book_now`
- Booking: `screen_view_booking`, `booking_draft_created`, `booking_step_completed`
- Payment: `screen_view_payment`, `payment_intent_started`, `payment_completed`, `payment_failed`
- Cancellation: `booking_cancelled`

## Provider events

- `screen_view_provider_dashboard`
- `screen_view_provider_agenda`
- `screen_view_provider_operations`
- `screen_view_provider_profile`
- `provider_booking_action`
- `provider_availability_updated`
- `provider_profile_updated`
- `provider_service_updated`
- `provider_gallery_updated`

## Marketing

Marketing analytics are gated by cookie consent. Public page and pre-signup events are sent only
after consent is accepted. Admin routes are filtered before sending and must not appear in the
public PostHog project.

## QA results

- Mobile consent gating is enforced before PostHog capture.
- Marketing consent gating is covered by `src/lib/analytics.consent.test.ts`.
- Real PostHog reception still requires a deployed environment with production keys.
