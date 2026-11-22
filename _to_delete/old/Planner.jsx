import { SLOTS, TODAY, WEEK } from '../data';
import { can, dishClashes, getDish, planBlockers } from '../logic';
import { useStore } from '../store';

function ClashBadge({ dish, kids }) {
  if (!dish.checked)
    return (
      <span className="cc unk" title="Allergens not checked">
        ?
      </span>
    );
  const cl = dishClashes(dish, kids);
  if (!cl.length) return null;
  const sev = cl.some((x) => x.sev === 'ana') ? 'ana' : 'int';
  return (
    <span className={`cc ${sev}`} title={`${cl.length} children affected`}>
      {cl.length}
    </span>
  );
}

export default function Planner({ openModal }) {
  const { state, actions } = useStore();
  const { menu, dishes, children, role, published, pubBy, acks } = state;
  const edit = can.plan(role);
  const b = planBlockers(state);

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Menu planner</h1>
          <p>
            Week of {WEEK[0].d} {WEEK[0].m}
          </p>
        </div>
        {published ? (
          <span className="chip" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)', fontWeight: 700 }}>
            Published by {pubBy}
          </span>
        ) : (
          <span className="chip unk">Draft</span>
        )}
      </div>

      <div className="week">
        {WEEK.map((w, di) => (
          <section className={`dayc ${di === TODAY ? 'today' : ''}`} key={di}>
            <h2>
              {w.s} {w.d} {w.m}
              {di === TODAY ? ' · today' : ''}
            </h2>
            {SLOTS.map((s) => (
              <div className="cell" key={s.id}>
                <h3>{s.name}</h3>
                {menu[di][s.id].map((id, i) => {
                  const d = getDish(dishes, id);
                  if (!d) return null;
                  return (
                    <div className="pd" key={id + i}>
                      <span className="n">{d.name}</span>
                      <ClashBadge dish={d} kids={children} />
                      {edit && (
                        <button className="x" aria-label={`Remove ${d.name}`} onClick={() => actions.removeFromMenu(di, s.id, i)}>
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
                {edit && (
                  <button className="add" onClick={() => openModal({ type: 'pick', di, sid: s.id })}>
                    + Add dish
                  </button>
                )}
              </div>
            ))}
          </section>
        ))}
      </div>

      <div className="panel">
        <h2>Before you publish</h2>
        <p className="sub" style={{ margin: '0 0 8px' }}>
          Every dish needs allergen tags, and every anaphylaxis clash needs a safe option confirmed.
        </p>
        {b.count === 0 && <div className="ok-line">Nothing left to check.</div>}

        {b.unchecked.map((d) => (
          <div className="check" key={d.id}>
            <div style={{ flex: 1 }}>
              <b>{d.name}</b> has no allergen check.
            </div>
            {can.dishes(role) ? (
              <button className="btn small" onClick={() => openModal({ type: 'dish', id: d.id })}>
                Tag allergens
              </button>
            ) : (
              <span className="sub">Ask the cook</span>
            )}
          </div>
        ))}

        {b.ana.map((a, i) => (
          <div className="check" key={a.key}>
            <input
              type="checkbox"
              id={`ack${i}`}
              checked={acks.includes(a.key)}
              disabled={!can.ack(role)}
              onChange={() => actions.toggleAck(a.key)}
            />
            <label htmlFor={`ack${i}`}>
              <b>
                {WEEK[a.di].s} · {a.slot.name}:
              </b>{' '}
              {a.dish.name} clashes with <b>{a.x.child.name}</b> ({a.x.hit.map((h) => h.a).join(', ')}).
              <div className="sub">
                {a.dish.alt ? `Safe option: ${a.dish.alt}. ` : ''}Tick when the safe option is arranged.
              </div>
            </label>
          </div>
        ))}

        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn primary" disabled={!edit || b.count > 0} onClick={() => actions.publish(role === 'manager' ? 'Centre manager' : 'Cook')}>
            Publish week
          </button>
          {b.count > 0 && <span className="sub">{b.count} to resolve first</span>}
          {!edit && <span className="sub">Teachers can view the plan only.</span>}
        </div>
      </div>
    </>
  );
}
