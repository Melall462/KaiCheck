import { useState } from 'react';
import Board from './components/Board.jsx';
import Children from './components/Children.jsx';
import Dishes from './components/Dishes.jsx';
import Header from './components/Header.jsx';
import History from './components/History.jsx';
import Log from './components/Log.jsx';
import ModalHost from './components/Modals.jsx';
import { TODAY_KEY } from './data';
import { useStore } from './store.jsx';

export default function App() {
  const { actions } = useStore();
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
        Data is saved in this browser only. There is no backend yet.{' '}
        <button className="btn small" onClick={actions.reset}>
          Reset sample data
        </button>
      </div>
      <ModalHost modal={modal} setModal={setModal} />
    </>
  );
}
