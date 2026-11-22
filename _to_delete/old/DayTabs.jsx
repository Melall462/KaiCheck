import { WEEK } from '../data';

export default function DayTabs({ day, setDay }) {
  return (
    <div className="tabs" role="group" aria-label="Day">
      {WEEK.map((d, i) => (
        <button key={i} onClick={() => setDay(i)} aria-pressed={day === i}>
          {d.s}
          <span className="d">
            {d.d} {d.m}
          </span>
        </button>
      ))}
    </div>
  );
}
