import { ROLES, TODAY_KEY } from '../data';
import { daySummary } from '../logic';
import { useStore } from '../store';

const NAV = [
  ['log', 'Food log'],
  ['history', 'History'],
  ['children', 'Children'],
  ['dishes', 'Dishes'],
  ['board', 'Allergy board'],
];

export default function Header({ view, setView }) {
  const { state, actions } = useStore();
  const todo = daySummary(state, TODAY_KEY).todo;
  return (
    <div className="top">
      <div className="top-in">
        <div className="brand">
          <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
            <rect width="34" height="34" rx="10" fill="var(--accent)" />
            <path d="M9 22c0-7 5-11 15-11 0 8-4 13-11 13-1.5 0-3-.5-4-2z" fill="var(--accent-ink)" />
            <path d="M10 25c3-5 6-8 10-10" stroke="var(--accent)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </svg>
          <div>
            <b>KaiCheck</b>
            <span>Little Kererū Early Learning</span>
          </div>
        </div>
        <label className="role">
          Viewing as
          <select id="role" value={state.role} onChange={(e) => actions.setRole(e.target.value)}>
            {Object.entries(ROLES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>
      <nav aria-label="Sections">
        {NAV.map(([k, label]) => (
          <button key={k} onClick={() => setView(k)} aria-current={view === k ? 'page' : undefined}>
            {label}
            {k === 'log' && todo > 0 && (
              <span className="count" aria-label={`${todo} to check today`}>
                {todo}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
