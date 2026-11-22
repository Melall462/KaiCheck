# KaiCheck

Daily food log and allergy tracker for early childhood education centres. Staff log what was served at each meal; the app flags children with a clash and records that each got a safe option. React + Vite, no backend yet.
Data is saved in the browser (localStorage). "Reset sample data" in the footer restores the demo data.

## Run

```
npm install
npm run dev
```

## Structure

- `src/data.js` constants (allergens, meal slots, rooms, roles) and sample data
- `src/logic.js` pure functions: clash detection, per-entry and per-day allergy status, role permissions
- `src/store.jsx` state, persistence and every action. This is the one file to replace when adding Supabase
- `src/components/` one file per screen, plus `Modals.jsx`

## Adding Supabase later

Tables: `centres`, `profiles` (role), `children`, `child_allergies`, `dishes`, `dish_allergens`,
`food_log` (date, slot, dish, logged_by, logged_at), `food_log_confirmations` (log entry, child). Every table carries `centre_id` with row-level security.
Swap the reducer and localStorage in `store.jsx` for queries and mutations; components read through `useStore()`.
# KaiCheck
