import { useState } from 'react';
import Board from './components/Board.jsx';
import Children from './components/Children.jsx';
import Dishes from './components/Dishes.jsx';
import Header from './components/Header.jsx';
import History from './components/History.jsx';
import Log from './components/Log.jsx';
import ModalHost from './components/Modals.jsx';
import { Loading, SetupNeeded, ErrorScreen, SignIn, Onboarding } from './components/Auth.jsx';
import { TODAY_KEY } from './data';
import { useStore } from './store.jsx';

export default function App() {
  const { state } = useStore();
  if (state.phase === 'unconfigured') return <SetupNeeded />;
  if (state.phase === 'loading') return <Loading />;
  if (state.phase === 'error') return <ErrorScreen message={state.error} />;
  if (state.phase === 'signedout') return <SignIn />;
  if (state.phase === 'onboarding') return <Onboarding />;
  return <Ready />;
}

function Ready() {
  const { state, actions } = useStore();
  const [view, setViewRaw] = useState('log');
  const [date, setDate] = useState(TODAY_KEY);
  const [modal, setModal] = useState(null);

  const setView = (v) => {
    setViewRaw(v);
    setModal(null);
    window.scrollTo(0, 0);
  };
  const openDay = (d) => {
    setDate(d);
    setView('log');
  };

  return (
    <>
      <Header view={view} setView={setView} />
      <main>
        {view === 'log' && <Log date={date} setDate={setDate} openModal={setModal} />}
        {view === 'history' && <History openDay={openDay} />}
        {view === 'children' && <Children openModal={setModal} />}
        {view === 'dishes' && <Dishes openModal={setModal} />}
        {view === 'board' && <Board />}
      </main>
      <div className="foot">
        {state.role === 'manager' && (
          <div className="admin">
            <span>
              Staff join code: <code>{state.profile.joinCode}</code>
            </span>
            <button className="btn small" onClick={actions.rotateJoinCode}>
              New code
            </button>
            {state.children.length === 0 && state.dishes.length === 0 && (
              <button className="btn small" onClick={actions.loadSample}>
                Add sample children and dishes
              </button>
            )}
          </div>
        )}
        Signed in to {state.profile.centreName}. Children are listed by first name and last initial only.
      </div>
      <ModalHost modal={modal} setModal={setModal} />
    </>
  );
}
