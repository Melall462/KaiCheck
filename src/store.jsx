import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ROLES, seed } from './data';
import { dishClashes, getDish } from './logic';

/*
 * All reads and writes go through this file. When a backend arrives (Supabase),
 * replace the reducer + localStorage with queries and mutations here and the
 * components will not need to change.
 */

const KEY = 'kaicheck:v2';

const initial = () => ({ ...structuredClone(seed), role: 'manager' });

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && Array.isArray(s.children) && Array.isArray(s.dishes) && Array.isArray(s.logs)) return s;
    }
  } catch {
    /* storage unavailable or corrupt: start from sample data */
  }
  return initial();
}

const nowTime = () => {
  const d = new Date();
  const h = d.getHours() % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, '0')}`;
};

function reducer(state, a) {
  switch (a.type) {
    case 'SET_ROLE':
      return { ...state, role: a.role };
    case 'SAVE_CHILD': {
      const exists = state.children.some((c) => c.id === a.id);
      const children = exists
        ? state.children.map((c) => (c.id === a.id ? { ...c, ...a.rec } : c))
        : [...state.children, { id: a.id, ...a.rec }];
      return { ...state, children };
    }
    case 'SAVE_DISH': {
      const exists = state.dishes.some((d) => d.id === a.id);
      const dishes = exists
        ? state.dishes.map((d) => (d.id === a.id ? { ...d, ...a.rec } : d))
        : [...state.dishes, { id: a.id, ...a.rec }];
      return { ...state, dishes };
    }
    case 'LOG_FOOD':
      return { ...state, logs: [...state.logs, a.entry] };
    case 'REMOVE_LOG':
      return { ...state, logs: state.logs.filter((l) => l.id !== a.id) };
    case 'TOGGLE_CONFIRM':
      return {
        ...state,
        logs: state.logs.map((l) =>
          l.id !== a.id
            ? l
            : { ...l, confirmed: l.confirmed.includes(a.childId) ? l.confirmed.filter((c) => c !== a.childId) : [...l.confirmed, a.childId] },
        ),
      };
    case 'RESET':
      return { ...initial(), role: state.role };
    default:
      return state;
  }
}

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const [toastMsg, setToastMsg] = useState('');
  const [toastOn, setToastOn] = useState(false);
  const timer = useRef();

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    setToastOn(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastOn(false), 3200);
  }, []);

  const value = useMemo(() => {
    const logEntry = (date, slot, dishId, dish) => {
      const entry = { id: 'l' + Date.now() + Math.random().toString(36).slice(2, 6), date, slot, dishId, by: ROLES[state.role], at: nowTime(), confirmed: [] };
      dispatch({ type: 'LOG_FOOD', entry });
      const n = dishClashes(dish, state.children).length;
      if (dish && !dish.checked) toast('Logged. Allergens for this dish have not been checked.');
      else if (n) toast(`Logged. ${n} ${n === 1 ? 'child needs' : 'children need'} a safe option.`);
      else toast('Logged. No allergy clashes.');
    };
    return {
      state,
      toast,
      actions: {
        setRole: (role) => dispatch({ type: 'SET_ROLE', role }),
        logFood: (date, slot, dishId) => logEntry(date, slot, dishId, getDish(state.dishes, dishId)),
        removeLog: (id) => dispatch({ type: 'REMOVE_LOG', id }),
        toggleConfirm: (id, childId) => dispatch({ type: 'TOGGLE_CONFIRM', id, childId }),
        saveChild: (id, rec) => {
          dispatch({ type: 'SAVE_CHILD', id: id ?? 'c' + Date.now(), rec });
          toast('Saved. Allergy checks updated.');
        },
        /** `thenLog` ({date, slot}) logs the dish straight away, used when adding a new dish from the log. */
        saveDish: (id, rec, thenLog) => {
          const dishId = id ?? 'd' + Date.now();
          dispatch({ type: 'SAVE_DISH', id: dishId, rec });
          if (thenLog) logEntry(thenLog.date, thenLog.slot, dishId, { ...rec, id: dishId });
          else toast('Dish saved.');
        },
        reset: () => {
          dispatch({ type: 'RESET' });
          toast('Sample data restored.');
        },
      },
    };
  }, [state, toast]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div id="toast" className={toastOn ? 'show' : ''} role="status" aria-live="polite">
        {toastMsg}
      </div>
    </Ctx.Provider>
  );
}

export const useStore = () => useContext(Ctx);
