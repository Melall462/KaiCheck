import { TODAY_KEY, addDays, fmtTime, seed } from './data';
import { supabase, configured } from './supabase';

/*
 * Every call to Supabase lives here. The store and components never import the client.
 * Row shapes from the database are converted to the shapes the UI already uses.
 */

const ok = ({ data, error }) => {
  if (error) throw error;
  return data;
};

/* ---------- row -> app shape ---------- */

export const toChild = (r) => ({ id: r.id, name: r.name, room: r.room, note: r.note, allergies: r.allergies ?? [] });
export const toDish = (r) => ({ id: r.id, name: r.name, allergens: r.allergens ?? [], checked: r.checked, alt: r.alt });
export const toLog = (r) => ({
  id: r.id,
  date: r.log_date,
  slot: r.slot,
  dishId: r.dish_id,
  by: r.profiles?.full_name ?? 'Unknown',
  at: fmtTime(r.logged_at),
  confirmed: (r.food_log_confirmations ?? []).map((c) => c.child_id),
});

const uid = () => crypto.randomUUID();

/* ---------- auth ---------- */

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return { needsConfirmation: !data.session };
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export const signOut = () => supabase.auth.signOut();

export function onAuthChange(cb) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => cb(event, session));
  return () => data.subscription.unsubscribe();
}

/* ---------- profile and onboarding ---------- */

export async function loadProfile(userId) {
  const r = ok(
    await supabase
      .from('profiles')
      .select('id, full_name, role, centre_id, centres(name, join_code)')
      .eq('id', userId)
      .maybeSingle(),
  );
  if (!r) return null;
  return {
    id: r.id,
    name: r.full_name,
    role: r.role,
    centreId: r.centre_id,
    centreName: r.centres?.name ?? '',
    joinCode: r.role === 'manager' ? r.centres?.join_code ?? '' : '',
  };
}

export async function createCentre(centreName, displayName) {
  ok(await supabase.rpc('create_centre', { centre_name: centreName, display_name: displayName }));
}

export async function joinCentre(code, displayName) {
  ok(await supabase.rpc('join_centre', { code, display_name: displayName }));
}

export async function rotateJoinCode() {
  return ok(await supabase.rpc('rotate_join_code'));
}

/* ---------- reads ---------- */

export async function loadAll() {
  const since = addDays(TODAY_KEY, -60);
  const [kids, dishes, logs] = await Promise.all([
    supabase.from('children').select('id, name, room, note, allergies').order('name'),
    supabase.from('dishes').select('id, name, allergens, checked, alt').order('name'),
    supabase
      .from('food_log')
      .select('id, log_date, slot, dish_id, logged_at, profiles(full_name), food_log_confirmations(child_id)')
      .gte('log_date', since)
      .order('logged_at'),
  ]);
  return { children: ok(kids).map(toChild), dishes: ok(dishes).map(toDish), logs: ok(logs).map(toLog) };
}

/* ---------- writes ---------- */

export const upsertChild = async (id, centreId, rec) =>
  ok(await supabase.from('children').upsert({ id, centre_id: centreId, name: rec.name, room: rec.room, note: rec.note, allergies: rec.allergies }));

export const upsertDish = async (id, centreId, rec) =>
  ok(await supabase.from('dishes').upsert({ id, centre_id: centreId, name: rec.name, allergens: rec.allergens, checked: rec.checked, alt: rec.alt }));

export const insertLog = async (id, centreId, date, slot, dishId) =>
  ok(await supabase.from('food_log').insert({ id, centre_id: centreId, log_date: date, slot, dish_id: dishId }));

export const deleteLog = async (id) => ok(await supabase.from('food_log').delete().eq('id', id));

export const addConfirmation = async (logId, childId) =>
  ok(await supabase.from('food_log_confirmations').insert({ log_id: logId, child_id: childId }));

export const removeConfirmation = async (logId, childId) =>
  ok(await supabase.from('food_log_confirmations').delete().eq('log_id', logId).eq('child_id', childId));

/** Adds the demo children and dishes (no log entries) to an empty centre. Managers only, enforced by RLS. */
export async function loadSample(centreId) {
  ok(
    await supabase.from('dishes').insert(
      seed.dishes.map((d) => ({ id: uid(), centre_id: centreId, name: d.name, allergens: d.allergens, checked: d.checked, alt: d.alt })),
    ),
  );
  ok(
    await supabase.from('children').insert(
      seed.children.map((c) => ({ id: uid(), centre_id: centreId, name: c.name, room: c.room, note: c.note, allergies: c.allergies })),
    ),
  );
}

/* ---------- realtime ---------- */

/** Calls onChange when anyone in the centre logs or confirms. RLS limits what arrives. */
export function subscribe(centreId, onChange) {
  const channel = supabase
    .channel(`kaicheck-${centreId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'food_log' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'food_log_confirmations' }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export { configured, uid };
