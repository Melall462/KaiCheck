import { useEffect, useRef, useState } from 'react';
import { ALLERGENS, ROOMS, SEV_LABEL, SLOTS, fmtDate } from '../data';
import { can, dishClashes, dishUsage, getChild, getDish } from '../logic';
import { useStore } from '../store';
import { AllergenChips, Bang } from './Chips';

function Shell({ onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const first = ref.current?.querySelector('input[type=text]') || ref.current;
    first?.focus({ preventScroll: true });
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" tabIndex={-1} ref={ref}>
        <button className="btn small close" onClick={onClose}>
          Close
        </button>
        {children}
      </div>
    </div>
  );
}

function PickerModal({ modal, onClose, setModal }) {
  const { state, actions } = useStore();
  const [q, setQ] = useState('');
  const list = state.dishes
    .filter((d) => d.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => dishUsage(state.logs, b.id) - dishUsage(state.logs, a.id) || a.name.localeCompare(b.name));
  const slot = SLOTS.find((s) => s.id === modal.slot);

  return (
    <Shell onClose={onClose}>
      <h2>Log {slot.name.toLowerCase()}</h2>
      <div className="sub">{fmtDate(modal.date, { weekday: 'long', day: 'numeric', month: 'long' })}. Most served dishes first.</div>
      <div className="field">
        <label htmlFor="pickq">Search dishes</label>
        <input type="text" id="pickq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. pasta" />
      </div>
      {can.dishes(state.role) && (
        <button className="btn" onClick={() => setModal({ type: 'dish', id: null, thenLog: { date: modal.date, slot: modal.slot } })}>
          Not in the list? Add a new dish
        </button>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.length === 0 && <p className="sub">No dishes match.</p>}
        {list.map((d) => {
          const cl = dishClashes(d, state.children);
          return (
            <button
              className="pick"
              key={d.id}
              onClick={() => {
                actions.logFood(modal.date, modal.slot, d.id);
                onClose();
              }}
            >
              <span className="nm">{d.name}</span>
              <span className="row">
                <AllergenChips dish={d} />
              </span>
              {!d.checked ? (
                <span className="chip unk">Allergens not checked</span>
              ) : cl.length === 0 ? (
                <span className="safe">No clashes</span>
              ) : (
                <span className="sub">
                  Clashes: {cl.map((x) => x.child.name + (x.sev === 'ana' ? ' (severe)' : '')).join(', ')}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Shell>
  );
}

function ChildModal({ modal, onClose, setModal }) {
  const { state, actions } = useStore();
  const child = modal.id ? getChild(state.children, modal.id) : null;
  const [name, setName] = useState(child?.name ?? '');
  const [room, setRoom] = useState(child?.room ?? ROOMS[0]);
  const [note, setNote] = useState(child?.note ?? '');
  const [sev, setSev] = useState(() => Object.fromEntries((child?.allergies ?? []).map((a) => [a.a, a.sev])));
  const [err, setErr] = useState('');

  if (!modal.edit && child) {
    return (
      <Shell onClose={onClose}>
        <h2>{child.name}</h2>
        <div className="sub">{child.room} room</div>
        <div className="row">
          {child.allergies.length ? (
            child.allergies.map((al) => (
              <span className={`kid ${al.sev}`} key={al.a}>
                {al.sev === 'ana' && <Bang />}
                {al.a} · {al.sev === 'ana' ? 'severe' : 'mild'}
              </span>
            ))
          ) : (
            <span className="chip none">No known allergies</span>
          )}
        </div>
        <div className="field">
          <span className="lbl">Action plan note</span>
          <div>{child.note || <span className="sub">None recorded.</span>}</div>
        </div>
        {can.kids(state.role) && (
          <button className="btn" onClick={() => setModal({ type: 'child', id: child.id, edit: true })}>
            Edit
          </button>
        )}
      </Shell>
    );
  }

  const cycle = (a) => {
    const order = ['', 'int', 'ana'];
    const next = order[(order.indexOf(sev[a] ?? '') + 1) % 3];
    setSev({ ...sev, [a]: next });
  };

  const save = () => {
    if (!name.trim()) return setErr('Enter a first name and last initial.');
    const allergies = ALLERGENS.filter((a) => sev[a]).map((a) => ({ a, sev: sev[a] }));
    actions.saveChild(modal.id, { name: name.trim(), room, note: note.trim(), allergies });
    onClose();
  };

  return (
    <Shell onClose={onClose}>
      <h2>{modal.id ? 'Edit child' : 'Add child'}</h2>
      <div className="field">
        <label htmlFor="f-name">Name (first name and last initial)</label>
        <input type="text" id="f-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Aroha T." autoComplete="off" />
      </div>
      <div className="field">
        <label htmlFor="f-room">Room</label>
        <select id="f-room" value={room} onChange={(e) => setRoom(e.target.value)}>
          {ROOMS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <span className="lbl">Allergies. Tap to cycle: none, intolerance, anaphylaxis.</span>
        <div className="agrid">
          {ALLERGENS.map((a) => (
            <button type="button" className="alg" key={a} data-sev={sev[a] ?? ''} onClick={() => cycle(a)}>
              <b>{a}</b>
              <span className="st">{SEV_LABEL[sev[a] ?? '']}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label htmlFor="f-note">Action plan note</label>
        <textarea id="f-note" rows="3" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="err">{err}</div>
      <button className="btn primary" onClick={save}>
        Save
      </button>
    </Shell>
  );
}

function DishModal({ modal, onClose }) {
  const { state, actions } = useStore();
  const dish = modal.id ? getDish(state.dishes, modal.id) : null;
  const [name, setName] = useState(dish?.name ?? '');
  const [allergens, setAllergens] = useState(dish?.allergens ?? []);
  const [checked, setChecked] = useState(dish?.checked ?? false);
  const [alt, setAlt] = useState(dish?.alt ?? '');
  const [err, setErr] = useState('');

  const toggle = (a) => setAllergens(allergens.includes(a) ? allergens.filter((x) => x !== a) : [...allergens, a]);
  const save = () => {
    if (!name.trim()) return setErr('Enter a dish name.');
    actions.saveDish(modal.id, { name: name.trim(), allergens, checked, alt: alt.trim() }, modal.thenLog);
    onClose();
  };

  return (
    <Shell onClose={onClose}>
      <h2>{modal.id ? 'Edit dish' : 'Add dish'}</h2>
      <div className="field">
        <label htmlFor="f-name">Dish name</label>
        <input type="text" id="f-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
      </div>
      <div className="field">
        <span className="lbl">Contains</span>
        <div className="agrid">
          {ALLERGENS.map((a) => (
            <button type="button" className="tg" key={a} aria-pressed={allergens.includes(a)} onClick={() => toggle(a)}>
              {a}
            </button>
          ))}
        </div>
      </div>
      <label className="check" style={{ border: 0, padding: 0 }}>
        <input type="checkbox" id="f-checked" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        <span>I checked the recipe or packet label. These tags are complete.</span>
      </label>
      <div className="field">
        <label htmlFor="f-alt">Safe option for children who can't have it</label>
        <input type="text" id="f-alt" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="e.g. Rice crackers and cucumber" />
      </div>
      <div className="err">{err}</div>
      <button className="btn primary" onClick={save}>
        Save
      </button>
    </Shell>
  );
}

export default function ModalHost({ modal, setModal }) {
  if (!modal) return null;
  const close = () => setModal(null);
  // key forces fresh form state when the modal changes (e.g. view -> edit)
  const key = `${modal.type}:${modal.id ?? 'new'}:${modal.edit ? 'edit' : 'view'}:${modal.slot ?? ''}`;
  if (modal.type === 'pick') return <PickerModal key={key} modal={modal} onClose={close} setModal={setModal} />;
  if (modal.type === 'child') return <ChildModal key={key} modal={modal} onClose={close} setModal={setModal} />;
  if (modal.type === 'dish') return <DishModal key={key} modal={modal} onClose={close} />;
  return null;
}
