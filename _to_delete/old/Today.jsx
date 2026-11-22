import { SLOTS, WEEK } from '../data';
import { dishClashes, getDish } from '../logic';
import { useStore } from '../store';
import { AllergenChips, KidChip } from './Chips';
import DayTabs from './DayTabs';

export default function Today({ day, setDay, setView, openModal }) {
  const { state } = useStore();
  const { children, dishes, menu, published } = state;
  const open = (id) => openModal({ type: 'child', id, edit: false });

  const affected = new Map();
  SLOTS.forEach((s) =>
    menu[day][s.id].forEach((id) =>
      dishClashes(getDish(dishes, id), children).forEach((x) => {
        if (affected.get(x.child.id) !== 'ana') affected.set(x.child.id, x.sev);
      }),
    ),
  );
  const anaCount = [...affected.values()].filter((v) => v === 'ana').length;
  const w = WEEK[day];
  const dateLong = w.date.toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Today</h1>
          <p>{dateLong} · Little Kererū Early Learning</p>
        </div>
      </div>
      <DayTabs day={day} setDay={setDay} />

      {!published && (
        <div className="banner warn">
          <div className="grow">
            <strong>Draft menu</strong> The cook has not published this week yet.
          </div>
          <button className="btn small" onClick={() => setView('planner')}>
            Open planner
          </button>
        </div>
      )}

      {affected.size === 0 ? (
        <div className="banner good">
          <strong>
            No allergy clashes on {w.s} {w.d} {w.m}
          </strong>
        </div>
      ) : (
        <div className={`banner ${anaCount ? 'alert' : 'warn'}`}>
          <div className="grow">
            <strong>
              {affected.size} {affected.size === 1 ? 'child needs' : 'children need'} a different option
            </strong>
            <div className="sub" style={{ color: 'inherit' }}>
              {anaCount ? `${anaCount} with anaphylaxis risk. ` : ''}Tap a name for the action plan.
            </div>
          </div>
        </div>
      )}

      <div className="slots">
        {SLOTS.map((s) => {
          const ids = menu[day][s.id];
          return (
            <section className="slot" key={s.id}>
              <header>
                <h2>{s.name}</h2>
                <span className="time">{s.time}</span>
              </header>
              {ids.length === 0 && <div className="sub">Nothing planned.</div>}
              {ids.map((id, i) => {
                const d = getDish(dishes, id);
                if (!d) return null;
                const clashes = dishClashes(d, children);
                return (
                  <div className="dish" key={id + i}>
                    <div className="dish-name">{d.name}</div>
                    <div className="row">
                      <AllergenChips dish={d} />
                    </div>
                    {!d.checked ? (
                      <div className="note">Allergens have not been checked for this dish. Ask the cook before serving.</div>
                    ) : clashes.length ? (
                      <>
                        <div className="row">
                          <span className="lbl">Not safe for</span>
                          {clashes.map((x) => (
                            <KidChip key={x.child.id} clash={x} onOpen={open} />
                          ))}
                        </div>
                        <div className="alt">
                          {d.alt ? (
                            <>
                              <b>Safe option:</b> {d.alt}
                            </>
                          ) : (
                            'No safe option set. Ask the cook.'
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="safe">No clashes with any enrolled child</div>
                    )}
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>
    </>
  );
}
