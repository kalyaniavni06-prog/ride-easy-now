# Ride Easy Now

Build a modern, responsive web application called "TransitEase" — a unified bus and train travel platform.

IMPORTANT:

- Build a polished, realistic hackathon-ready MVP.

- Do NOT create a generic template.

- Focus on excellent UI/UX, clear navigation, accessibility, responsive design, and functional frontend flows.

- Do not add fake external payment processing.

- Use realistic demo data for buses, trains, routes, schedules, fares and seats.

- Structure the project so Supabase authentication/database can be connected cleanly later.

- Avoid unnecessary features that increase complexity.

CORE IDEA:

Users should be able to search buses and trains, view schedules and fares, select seats, make a demo booking, manage bookings, and apply/manage travel passes.

PAGES AND FEATURES:

1. LANDING / HOME PAGE

- Clean modern transport-themed design.

- Hero section with:

  "One Platform. Every Journey."

  "Search, book and manage your bus and train journeys in one place."

- Search widget with:

  From

  To

  Travel date

  Transport type: Bus / Train / Both

  Number of passengers

- Search button.

- Quick actions:

  Search Buses

  Search Trains

  My Bookings

  Travel Pass

- Popular routes section.

- Why TransitEase section:

  Easy booking

  Transparent fares

  Digital passes

  Centralized journey management

- Mobile responsive navigation.

2. SEARCH RESULTS PAGE

- Show bus/train results based on selected route and date.

- Filters:

  Transport type

  Departure time

  Arrival time

  Price

  AC/Non-AC for buses

  Seat availability

  Direct journey

- Sort by:

  Cheapest

  Fastest

  Earliest departure

- Each result should show:

  Operator/train name

  Departure and arrival time

  Duration

  Fare

  Available seats

  View details / Select button.

- Make the interface feel like a real booking platform.

3. JOURNEY DETAILS

- Detailed route/timeline.

- Boarding and destination information.

- Stops/stations.

- Fare breakdown.

- Available seats.

- Select seat button.

4. SEAT SELECTION

- Visual seat layout.

- Available, selected and unavailable states.

- Passenger count validation.

- Selected seats summary.

- Total fare calculation.

- Continue button.

5. BOOKING CHECKOUT

- Passenger details form.

- Journey summary.

- Selected seats.

- Fare breakdown.

- Demo payment section.

- Use a clearly labelled "Demo Payment" flow instead of real payment integration.

- Booking confirmation after successful demo booking.

6. BOOKING CONFIRMATION

- Generate a realistic booking reference/PNR-style ID.

- Show:

  Passenger

  Route

  Date

  Time

  Transport

  Seat

  Fare

  Booking ID

- QR-code-style visual placeholder.

- Download/print ticket button.

- Add to My Bookings.

7. MY BOOKINGS

- Upcoming bookings.

- Previous bookings.

- Booking cards with status.

- View ticket.

- Cancel booking button for demo purposes.

- Empty state when there are no bookings.

8. TRAVEL PASS

Create a dedicated digital travel pass section.

- Pass types:

  Daily Pass

  Weekly Pass

  Monthly Pass

- Show validity, routes/coverage and price.

- "Get Pass" demo flow.

- Digital pass card after purchase.

- Pass status:

  Active

  Expired

- QR-code-style visual placeholder.

9. USER DASHBOARD

- Profile summary.

- Upcoming journey.

- Active travel pass.

- Recent bookings.

- Quick actions.

- Notifications area.

- Clean dashboard cards.

10. AUTHENTICATION UI

Create:

- Sign up

- Login

- Forgot password

- Logout

- Protected dashboard/bookings/pass pages.

Use an architecture that can later connect directly to Supabase Auth.

11. ERROR HANDLING

This is an important part of the project.

Create polished error and empty states for:

- Invalid route

- No buses/trains found

- Invalid date

- Booking failure

- Network/server error

- Unauthorized page

- Session expired

- Empty bookings

- Empty travel pass

Do NOT show raw technical errors such as "401 Unauthorized" to normal users.

Instead show a friendly message and useful recovery action.

12. NAVIGATION

Navbar:

- Home

- Search

- My Bookings

- Travel Pass

- Dashboard

- Login/Profile

Use a responsive mobile menu.

13. DESIGN

- Premium but simple transport-tech aesthetic.

- Clean white/light interface with a strong blue/indigo accent.

- Good contrast and readable typography.

- Rounded cards but not excessive.

- Subtle animations.

- Professional enough for a college hackathon presentation.

- Avoid excessive gradients, excessive glassmorphism, or clutter.

- Make buttons and important actions visually clear.

14. DEMO DATA

Include realistic demo data for:

- Major Indian cities

- Bus routes

- Train routes

- Different departure times

- Different fares

- Seat availability

Keep demo data separated cleanly so it can later be replaced by Supabase/database data.

15. TECHNICAL REQUIREMENTS

- Use React + TypeScript.

- Component-based architecture.

- Reusable UI components.

- Proper routing.

- Form validation.

- Responsive design.

- Keep the code clean and maintainable.

- Prepare the project for Supabase integration.

- Do not expose secrets or API keys in frontend code.

MOST IMPORTANT:

This is an MVP for a hackathon. Prioritize a smooth end-to-end demo:

Home → Search → Results → Select journey → Select seat → Passenger details → Demo booking → Confirmation → My Bookings.

Make this flow polished and functional before adding secondary features.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9bd4dafe-e044-43b6-8007-01ca8ebbb55e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
