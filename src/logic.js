export const getDish = (dishes, id) => dishes.find((d) => d.id === id);
export const getChild = (children, id) => children.find((c) => c.id === id);

/**
 * Children whose allergies overlap a dish's allergens.
 * A dish that has not been checked returns no clashes; callers must show it as "unchecked", never "safe".
 */
export function dishClashes(dish, children) {
  if (!dish || !dish.checked) return [];
  const out = [];
  for (const child of children) {
    const hit = child.allergies.filter((al) => dish.allergens.includes(al.a));
    if (hit.length) out.push({ child, hit, sev: hit.some((h) => h.sev === 'ana') ? 'ana' : 'int' });
  }
  return out.sort((a, b) => (a.sev === 'ana' ? 0 : 1) - (b.sev === 'ana' ? 0 : 1));
}

/** Allergy status of one logged entry. `open` are affected children not yet marked as given a safe option. */
export function entryStatus(entry, state) {
  const dish = getDish(state.dishes, entry.dishId);
  const clashes = dishClashes(dish, state.children);
  const open = clashes.filter((x) => !entry.confirmed.includes(x.child.id));
  return {
    dish,
    clashes,
    open,
    openSevere: open.filter((x) => x.sev === 'ana').length,
    unchecked: Boolean(dish && !dish.checked),
  };
}

export function daySummary(state, date) {
  const entries = state.logs.filter((l) => l.date === date);
  const affected = new Set();
  let open = 0;
  let openSevere = 0;
  let unchecked = 0;
  for (const e of entries) {
    const s = entryStatus(e, state);
    s.clashes.forEach((x) => affected.add(x.child.id));
    open += s.open.length;
    openSevere += s.openSevere;
    if (s.unchecked) unchecked++;
  }
  return { count: entries.length, affected: affected.size, open, openSevere, unchecked, todo: open + unchecked };
}

export const dishUsage = (logs, dishId) => logs.filter((l) => l.dishId === dishId).length;

export const can = {
  dishes: (role) => role !== 'teacher',
  kids: (role) => role === 'manager',
};
