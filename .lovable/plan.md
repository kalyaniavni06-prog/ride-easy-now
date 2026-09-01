# Stabilize Ride Easy Now deployment and refine auth/assistant

## Goal
Fix the deployed runtime failure without redesigning or removing features, then make focused improvements to the existing authentication and travel-assistant experiences.

## Implementation
1. **Production runtime fix**
   - Reproduce the deployed failure against the current source and isolate the failing server/SSR path.
   - Harden `assistant-server` so request validation, missing AI configuration, upstream failures, and timeouts cannot crash page rendering.
   - Keep all AI credentials inside the server-function handler and preserve the existing data-backed demo fallback.
   - Correct any SSR-unsafe environment or browser access found during the route audit.

2. **Authentication reliability and UX**
   - Preserve the existing hosted authentication integration and real login/signup/reset calls.
   - Add consistent email/password validation, show/hide password controls, useful non-technical errors, and explicit busy labels on login and signup.
   - Remove the credential-storing browser fallback so passwords are never persisted in local storage; if hosted auth is unavailable, show a safe configuration error instead of fake authentication.
   - Keep forgot-password and reset-password flows intact and verify their recovery states.

3. **Travel assistant refinement**
   - Validate and cap assistant input server-side.
   - Distinguish configured AI responses, intentionally data-backed demo responses, and temporary AI/network failures honestly in the UI.
   - Preserve route-aware recommendations and booking/navigation links while improving retry/error behavior.

4. **Verification**
   - Run TypeScript checks and the production build.
   - Exercise home, search, journey, seats, checkout, confirmation, bookings, pass, dashboard, auth/reset, assistant, navigation, and representative mobile rendering in the local production-like app.
   - Recheck hosted backend health and inspect runtime/console errors.

## Delivery constraints
- No redesign, new dependency, secret exposure, unrelated refactor, destructive backend change, or automatic deployment.
- The workspace manages Git state, so code will be delivered as project changes; external Vercel/GitHub deployment is only possible if an available connected deployment tool supports that exact target.
