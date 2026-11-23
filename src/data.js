export const ALLERGENS = ['milk', 'egg', 'peanut', 'tree nut', 'wheat', 'soy', 'fish', 'shellfish', 'sesame'];

export const SLOTS = [
  { id: 'bf', name: 'Breakfast', time: '8:15' },
  { id: 'mt', name: 'Morning tea', time: '9:45' },
  { id: 'ln', name: 'Lunch', time: '11:45' },
  { id: 'at', name: 'Afternoon tea', time: '2:30' },
];

export const ROOMS = ['Tūī', 'Pīwakawaka', 'Kererū'];

export const ROLES = { teacher: 'Teacher', cook: 'Cook', manager: 'Centre manager' };

export const SEV_LABEL = { '': 'None', int: 'Intolerance', ana: 'Anaphylaxis' };

const pad = (n) => String(n).padStart(2, '0');
export const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseKey = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (k, n) => {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return dateKey(d);
};
export const fmtDate = (k, opts) => parseKey(k).toLocaleDateString('en-NZ', opts);
export const TODAY_KEY = dateKey();
export const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s/g, ' ');

/** Sample data used on first load and on "Reset sample data". */
export const seed = {
  children: [
    { id: 'c1', name: 'Aroha T.', room: 'Pīwakawaka', allergies: [{ a: 'egg', sev: 'ana' }], note: 'Action plan on file. Auto-injector in the red bag by the Pīwakawaka door.' },
    { id: 'c2', name: 'Liam K.', room: 'Kererū', allergies: [{ a: 'sesame', sev: 'ana' }], note: 'Action plan on file. Auto-injector in the Kererū first aid kit.' },
    { id: 'c3', name: 'Mia S.', room: 'Tūī', allergies: [{ a: 'tree nut', sev: 'ana' }], note: 'Action plan on file. Nut-free table at all meals.' },
    { id: 'c4', name: 'Hemi R.', room: 'Kererū', allergies: [{ a: 'shellfish', sev: 'ana' }], note: 'Action plan on file.' },
    { id: 'c5', name: 'Zara A.', room: 'Pīwakawaka', allergies: [{ a: 'fish', sev: 'ana' }], note: 'Action plan on file. Auto-injector in the red bag.' },
    { id: 'c6', name: 'Noah P.', room: 'Kererū', allergies: [{ a: 'wheat', sev: 'int' }], note: 'Whānau supply a wheat-free snack on request.' },
    { id: 'c7', name: 'Ruby W.', room: 'Tūī', allergies: [{ a: 'soy', sev: 'int' }], note: '' },
    { id: 'c8', name: 'Ethan C.', room: 'Pīwakawaka', allergies: [{ a: 'milk', sev: 'int' }], note: 'Oat milk is fine.' },
    { id: 'c9', name: 'Tama H.', room: 'Tūī', allergies: [{ a: 'egg', sev: 'int' }], note: 'Cooked egg in baking is tolerated per whānau. Confirm with manager.' },
    { id: 'c10', name: 'Isla M.', room: 'Kererū', allergies: [], note: '' },
    { id: 'c11', name: 'Priya N.', room: 'Tūī', allergies: [], note: '' },
    { id: 'c12', name: 'Oliver B.', room: 'Pīwakawaka', allergies: [{ a: 'peanut', sev: 'int' }], note: '' },
  ],
  dishes: [
    { id: 'd1', name: 'Oat porridge with banana', allergens: ['milk'], checked: true, alt: 'Porridge made with oat milk' },
    { id: 'd2', name: 'Wholegrain toast with butter', allergens: ['wheat', 'milk'], checked: true, alt: 'Rice cakes with dairy-free spread' },
    { id: 'd3', name: 'Scrambled eggs on toast', allergens: ['egg', 'wheat', 'milk'], checked: true, alt: 'Toast with avocado' },
    { id: 'd4', name: 'Fruit platter', allergens: [], checked: true, alt: '' },
    { id: 'd5', name: 'Rice crackers and cucumber', allergens: [], checked: true, alt: '' },
    { id: 'd6', name: 'Apple cinnamon muffins', allergens: ['wheat', 'egg', 'milk'], checked: true, alt: 'Fruit and seed bar (nut-free)' },
    { id: 'd7', name: 'Chicken and veg pasta', allergens: ['wheat', 'egg'], checked: true, alt: 'Chicken and veg with rice' },
    { id: 'd8', name: 'Beef mince and kumara mash', allergens: ['milk'], checked: true, alt: 'Mash made with olive oil' },
    { id: 'd9', name: 'Fish pie', allergens: ['fish', 'milk', 'wheat'], checked: true, alt: 'Chicken and veg bake' },
    { id: 'd10', name: 'Vegetable fried rice', allergens: ['egg', 'soy'], checked: true, alt: '' },
    { id: 'd11', name: 'Pumpkin soup and bread roll', allergens: ['wheat', 'milk'], checked: true, alt: '' },
    { id: 'd12', name: 'Yoghurt and berries', allergens: ['milk'], checked: true, alt: 'Coconut yoghurt and berries' },
    { id: 'd13', name: 'Hummus and veggie sticks', allergens: ['sesame'], checked: true, alt: 'Mashed avocado and veggie sticks' },
    { id: 'd14', name: 'Cheese and crackers', allergens: ['milk', 'wheat'], checked: true, alt: 'Rice crackers and cucumber' },
    { id: 'd15', name: 'Peanut butter sandwiches', allergens: ['peanut', 'wheat'], checked: true, alt: '' },
    { id: 'd16', name: 'Almond and date balls', allergens: ['tree nut'], checked: true, alt: '' },
    { id: 'd17', name: 'Pasta bake (new recipe)', allergens: [], checked: false, alt: '' },
  ],
};

/** Five days of sample log entries ending today, so History and the Food log have something to show. */
function buildLogs() {
  const plan = [
    { bf: ['d1'], mt: ['d4'], ln: ['d7'], at: ['d5', 'd12'] },
    { bf: ['d2'], mt: ['d4'], ln: ['d8'], at: ['d13', 'd14'] },
    { bf: ['d1'], mt: ['d6'], ln: ['d9'], at: ['d4'] },
    { bf: ['d3'], mt: ['d5'], ln: ['d10'], at: ['d12'] },
    { bf: ['d1'], mt: ['d4'], ln: ['d11'], at: ['d5'] },
  ];
  const times = { bf: '8:20', mt: '9:50', ln: '11:50', at: '2:35' };
  const logs = [];
  let n = 0;
  for (let back = 4; back >= 0; back--) {
    const date = addDays(TODAY_KEY, -back);
    const day = plan[back];
    for (const slot of SLOTS) {
      if (back === 0 && (slot.id === 'ln' || slot.id === 'at')) continue;
      for (const dishId of day[slot.id]) {
        const dish = seed.dishes.find((d) => d.id === dishId);
        const confirmed = seed.children
          .filter((c) => c.allergies.some((al) => dish.allergens.includes(al.a)))
          .map((c) => c.id)
          .filter((id) => !(back === 0 && slot.id === 'bf' && id === 'c8'));
        logs.push({ id: 'l' + n++, date, slot: slot.id, dishId, by: 'Cook', at: times[slot.id], confirmed });
      }
    }
  }
  return logs;
}
seed.logs = buildLogs();
