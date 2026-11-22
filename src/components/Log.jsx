import { SLOTS, TODAY_KEY, addDays, fmtDate } from '../data';
import { can, daySummary, entryStatus } from '../logic';
import { useStore } from '../store';
import { AllergenChips, KidTag } from './Chips';

export default function Log({ date, setDate, openModal }) {
  const { state, actions } = useStore();
  const { logs, role } = state;
  const isToday = date === TODAY_KEY;
  const sum = daySummary(state, date);

  let banner;
  if (!sum.count) banner = <div className="banner"><strong>Nothing logged yet</strong><span className="sub">Tap "Log food" on a meal below.</span></div>;
  else if (sum.openSevere) banner = <div className="banner alert"><div className="grow"><strong>{sum.openSevere} severe allergy {sum.openSevere === 1 ? 'clash' : 'clashes'} to confirm</strong><div className="sub" style={{ color: 'inherit' }}>Tick each child once they have a safe option.</div></div></div>;
  else if (sum.todo) banner = <div className="banner warn"><div className="grow"><strong>{sum.todo} to check</strong> {sum.open ? `${sum.open} children still need a safe option confirmed. ` : ''}{sum.unchecked ? `${sum.unchecked} dish has no allergen check.` : ''}</div></div>;
  else banner = <div className="banner good"><strong>All allergy checks done</strong><span className="sub">{sum.count} items logged{sum.affected ? `, ${sum.affected} children had a safe option` : ''}</span></div>;

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Food log</h1>
          <p>What was served at Little Kererū Early Learning</p>
        </div>
      </div>

      <div className="datebar">
        <button className="btn" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}>‹</button>
        <div className="when">{isToday ? 'Today · ' : ''}{fmtDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <button className="btn" aria-label="Next day" disabled={isToday} onClick={() => setDate(addDays(date, 1))}>›</button>
        {!isToday && <button className="btn small" onClick={() => setDate(TODAY_KEY)}>Back to today</button>}
      </div>

      {banner}

      <div className="slots">
        {SLOTS.map((slot) => {
          const entries = logs.filter((l) => l.date === date && l.slot === slot.id);
          return (
            <section className="slot" key={slot.id}>
              <header>
                <h2>{slot.name}</h2>
                <span className="time">{slot.time}</span>
              </header>
              {entries.length === 0 && <div className="sub">Not logged.</div>}
              {entries.map((e) => {
                const st = entryStatus(e, state);
                if (!st.dish) return null;
                return (
                  <div className="dish" key={e.id}>
                    <div className="entry-head">
                      <div>
                        <div className="dish-name">{st.dish.name}</div>
                        <div className="sub">Logged {e.at} by {e.by}</div>
                      </div>
                      <button className="x" aria-label={`Remove ${st.dish.name}`} onClick={() => actions.removeLog(e.id)}>×</button>
                    </div>
                    <div className="row"><AllergenChips dish={st.dish} /></div>

                    {st.unchecked && (
                      <div className="note">
                        Allergens have not been checked for this dish.{' '}
                        {can.dishes(role) ? (
                          <button className="btn small" onClick={() => openModal({ type: 'dish', id: st.dish.id })}>Tag allergens</button>
                        ) : 'Ask the cook.'}
                      </div>
                    )}

                    {st.clashes.length > 0 && (
                      <>
                        <span className="lbl">Safe option given?</span>
                        {st.clashes.map((x) => {
                          const done = e.confirmed.includes(x.child.id);
                          const id = `c-${e.id}-${x.child.id}`;
                          return (
                            <div className={`confirm ${done ? '' : 'todo'}`} key={x.child.id}>
                              <input type="checkbox" id={id} checked={done} onChange={() => actions.toggleConfirm(e.id, x.child.id)} />
                              <label htmlFor={id}><KidTag clash={x} /></label>
                              <span className="state">{done ? 'Done' : 'To confirm'}</span>
                            </div>
                          );
                        })}
                        <div className="alt">{st.dish.alt ? <><b>Safe option:</b> {st.dish.alt}</> : 'No safe option set for this dish. Ask the cook.'}</div>
                      </>
                    )}
                    {st.clashes.length === 0 && !st.unchecked && <div className="safe">No clashes with any enrolled child</div>}
                  </div>
                );
              })}
              <button className="add" onClick={() => openModal({ type: 'pick', date, slot: slot.id })}>+ Log food</button>
            </section>
          );
        })}
      </div>
    </>
  );
}
