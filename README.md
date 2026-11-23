# KaiCheck

Daily food log and allergy tracker for early childhood education centres. Staff log what was served at each
meal; the app flags children with a clash and records that each got a safe option.

React + Vite on the front end, Supabase (Postgres, auth, row-level security) behind it.

## First-time setup

1. **Create the database tables.** In the Supabase dashboard open SQL Editor, paste the whole of
   `supabase/migrations/20261122000000_init.sql` and run it once.
2. **Add your keys.** Copy `.env.example` to `.env.local`. In Supabase open Project Settings, then API Keys,
   and paste the publishable key into `VITE_SUPABASE_PUBLISHABLE_KEY`. Never use a secret or service_role key here.
3. **Run it.**
   ```
   npm install
   npm run dev
   ```
4. Create an account, choose "Set up a centre" and you become the centre manager. As manager, the page footer
   shows a join code for staff and a button to add sample children and dishes.

If email confirmation is on in Supabase (Authentication, Sign In / Providers), new accounts must click the link
in their email before signing in.

## Roles

- **Teacher** (default for people who join with a code): log food, tick "safe option given".
- **Cook**: everything a teacher does, plus add and edit dishes.
- **Manager**: everything, plus add and edit children and their allergies, change the join code.

Rules are enforced in the database (row-level security), not just hidden in the interface. A manager can promote
a teacher by changing `role` in the `profiles` table until a staff screen exists.

## Structure

- `supabase/migrations/` database schema, security policies and sign-up functions
- `src/supabase.js` the client, built from the two env variables
- `src/api.js` every database call, and the conversion from database rows to the shapes the screens use
- `src/store.jsx` app state and actions. Changes show immediately and are saved in the background; a failed save reloads from the database
- `src/logic.js` pure functions: clash detection, per-entry and per-day allergy status, role permissions
- `src/data.js` constants, date helpers and the sample data
- `src/components/` one file per screen

## Data model

`centres`, `profiles` (role), `children` (allergies as JSON), `dishes` (allergen list, `checked` flag),
`food_log` (date, meal, dish, who logged it), `food_log_confirmations` (which child got a safe option).
Every row carries `centre_id`, so one centre can never see another's data.

Children are stored as first name and last initial only. Add no photos or other identifying details without
reviewing the Privacy Act 2020 obligations for children's health information.
