import { TODAY_KEY, fmtDate } from '../data';
import { daySummary } from '../logic';
import { useStore } from '../store';

export default function History({ openDay }) {
  const { state } = useStore();
  const dates = [...new Set([...state.logs.map((l) => l.date), TODAY_KEY])].sort().reverse();

  return (
    <>
      <div className="page-h">
        <div>
          <h1>History</h1>
          <p>One row per day. Tap a day to see or fix its log.</p>
        </div>
      </div>
      <div className="list">
        {dates.map((d) => {
          const s = daySummary(state, d);
          return (
            <button className="card dayrow" key={d} onClick={() => openDay(d)}>
              <h3>{d === TODAY_KEY ? 'Today · ' : ''}{fmtDate(d, { weekday: 'long', day: 'numeric', month: 'short' })}</h3>
              <div className="sub">{s.count} {s.count === 1 ? 'item' : 'items'} logged</div>
              <div className="row">
                {s.affected > 0 && <span className="chip">{s.affected} {s.affected === 1 ? 'child' : 'children'} with clashes</span>}
                {s.openSevere > 0 && <span className="kid ana">{s.openSevere} severe to confirm</span>}
                {s.todo > 0 && s.openSevere === 0 && <span className="kid int">{s.todo} to check</span>}
                {s.count > 0 && s.todo === 0 && <span className="safe">All checks done</span>}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
