import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import * as realApi from './api.js';
import { fmtTime } from './data';
import { dishClashes, getDish } from './logic';

/*
 * App state lives here. Components read it with useStore() and change it only through `actions`.
 * Changes show on screen straight away, then are saved to Supabase through ./api.js.
 * If a save fails the data is reloaded from the database, so the screen never keeps a change that was not saved.
 */

const blank = { phase: 'loading', error: '', profile: null, children: [], dishes: [], logs: [] };

function reducer(state, a) {
  switch (a.type) {
    case 'PHASE':
      return { ...state, phase: a.phase, error: a.error ?? '' };
    case 'SIGNED_OUT':
      return { ...blank, phase: 'signedout' };
    case 'ONBOARDING':
      return { ...blank, phase: 'onboarding' };
    case 'READY':
      return { ...state, phase: 'ready', error: '', profile: a.profile, ...a.data };
    case 'SET_DATA':
      return { ...state, ...a.data };
    case 'SET_JOIN_CODE':
      return { ...state, profile: { ...state.profile, joinCode: a.code } };
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
    default:
      return state;
  }
}

const Ctx = createContext(null);

/** `preset` lets tests start in a ready state without a database. */
export function StoreProvider({ api = realApi, preset, children }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => (preset ? { ...blank, ...preset } : blank));
  const [toastMsg, setToastMsg] = useState('');
  const [toastOn, setToastOn] = useState(false);
  const timer = useRef();
  const userId = useRef(null);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    setToastOn(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastOn(false), 3200);
  }, []);

  const reload = useCallback(async () => {
    try {
      dispatch({ type: 'SET_DATA', data: await api.loadAll() });
    } catch (e) {
      console.error(e);
      toast('Could not refresh from the database.');
    }
  }, [api, toast]);

  /** Work out where this user is up to: signed out, needs a centre, or ready. */
  const bootstrap = useCallback(
    async (id) => {
      userId.current = id;
      if (!id) return dispatch({ type: 'SIGNED_OUT' });
      try {
        const profile = await api.loadProfile(id);
        if (!profile) return dispatch({ type: 'ONBOARDING' });
        dispatch({ type: 'READY', profile, data: await api.loadAll() });
      } catch (e) {
        console.error(e);
        dispatch({ type: 'PHASE', phase: 'error', error: e.message || 'Something went wrong.' });
      }
    },
    [api],
  );

  useEffect(() => {
    if (preset) return undefined;
    if (!api.configured) {
      dispatch({ type: 'PHASE', phase: 'unconfigured' });
      return undefined;
    }
    let last;
    return api.onAuthChange((event, session) => {
      const id = session?.user?.id ?? null;
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') return;
      // Supabase re-announces the same user when the tab regains focus. Ignore that.
      if (id === last && event !== 'INITIAL_SESSION') return;
      last = id;
      // Do not call Supabase inside the auth callback itself.
      setTimeout(() => bootstrap(id), 0);
    });
  }, [api, bootstrap, preset]);

  // Pick up changes made on other devices.
  const centreId = state.profile?.centreId;
  useEffect(() => {
    if (preset || state.phase !== 'ready' || !centreId) return undefined;
    let t;
    const off = api.subscribe(centreId, () => {
      clearTimeout(t);
      t = setTimeout(reload, 300);
    });
    return () => {
      clearTimeout(t);
      off();
    };
  }, [api, preset, state.phase, centreId, reload]);

  const value = useMemo(() => {
    const profile = state.profile;
    const guard = async (fn, msg) => {
      try {
        await fn();
      } catch (e) {
        console.error(e);
        toast(`${msg} ${e.message || ''}`.trim());
        reload();
      }
    };
    const toastForLog = (dish) => {
      const n = dishClashes(dish, state.children).length;
      if (dish && !dish.checked) toast('Logged. Allergens for this dish have not been checked.');
      else if (n) toast(`Logged. ${n} ${n === 1 ? 'child needs' : 'children need'} a safe option.`);
      else toast('Logged. No allergy clashes.');
    };
    const newEntry = (id, date, slot, dishId) => ({ id, date, slot, dishId, by: profile.name, at: fmtTime(new Date().toISOString()), confirmed: [] });

    return {
      state: { ...state, role: profile?.role ?? 'teacher' },
      toast,
      actions: {
        logFood: (date, slot, dishId) => {
          const id = api.uid();
          dispatch({ type: 'LOG_FOOD', entry: newEntry(id, date, slot, dishId) });
          toastForLog(getDish(state.dishes, dishId));
          guard(() => api.insertLog(id, profile.centreId, date, slot, dishId), 'Could not save that entry.');
        },
        removeLog: (id) => {
          dispatch({ type: 'REMOVE_LOG', id });
          guard(() => api.deleteLog(id), 'Could not remove that entry.');
        },
        toggleConfirm: (id, childId) => {
          const on = state.logs.find((l) => l.id === id)?.confirmed.includes(childId);
          dispatch({ type: 'TOGGLE_CONFIRM', id, childId });
          guard(() => (on ? api.removeConfirmation(id, childId) : api.addConfirmation(id, childId)), 'Could not save that tick.');
        },
        saveChild: (id, rec) => {
          const childId = id ?? api.uid();
          dispatch({ type: 'SAVE_CHILD', id: childId, rec });
          toast('Saved. Allergy checks updated.');
          guard(() => api.upsertChild(childId, profile.centreId, rec), 'Could not save the child.');
        },
        /** `thenLog` ({date, slot}) logs the dish straight away, used when adding a new dish from the log. */
        saveDish: (id, rec, thenLog) => {
          const dishId = id ?? api.uid();
          const logId = thenLog ? api.uid() : null;
          dispatch({ type: 'SAVE_DISH', id: dishId, rec });
          if (thenLog) {
            dispatch({ type: 'LOG_FOOD', entry: newEntry(logId, thenLog.date, thenLog.slot, dishId) });
            toastForLog({ ...rec, id: dishId });
          } else toast('Dish saved.');
          guard(async () => {
            await api.upsertDish(dishId, profile.centreId, rec);
            if (thenLog) await api.insertLog(logId, profile.centreId, thenLog.date, thenLog.slot, dishId);
          }, 'Could not save the dish.');
        },
        loadSample: () =>
          guard(async () => {
            await api.loadSample(profile.centreId);
            await reload();
            toast('Sample children and dishes added.');
          }, 'Could not add sample data.'),
        rotateJoinCode: () =>
          guard(async () => {
            dispatch({ type: 'SET_JOIN_CODE', code: await api.rotateJoinCode() });
            toast('New join code created. The old one no longer works.');
          }, 'Could not change the join code.'),
        retry: () => {
          dispatch({ type: 'PHASE', phase: 'loading' });
          bootstrap(userId.current);
        },
        auth: {
          signIn: api.signIn,
          signUp: api.signUp,
          signOut: api.signOut,
          createCentre: async (centreName, displayName) => {
            await api.createCentre(centreName, displayName);
            await bootstrap(userId.current);
          },
          joinCentre: async (code, displayName) => {
            await api.joinCentre(code, displayName);
            await bootstrap(userId.current);
          },
        },
      },
    };
  }, [state, api, toast, reload, bootstrap]);

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
