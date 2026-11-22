import { useState } from 'react';
import { ROOMS } from '../data';
import { useStore } from '../store';

export default function Board() {
  const { state } = useStore();
  const [room, setRoom] = useState('all');
  const inRoom = (c) => room === 'all' || c.room === room;

  const cards = state.children
    .filter((c) => c.allergies.length && inRoom(c))
    .map((c) => ({ c, sev: c.allergies.some((a) => a.sev === 'ana') ? 'ana' : 'int' }))
    .sort((a, b) => (a.sev === 'ana' ? 0 : 1) - (b.sev === 'ana' ? 0 : 1) || a.c.name.localeCompare(b.c.name));
  const none = state.children.filter((c) => !c.allergies.length && inRoom(c)).length;

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Allergy board</h1>
          <p>For the kitchen wall and each room. Most serious first.</p>
        </div>
      </div>

      <div className="tabs" role="group" aria-label="Room">
        {['all', ...ROOMS].map((r) => (
          <button key={r} onClick={() => setRoom(r)} aria-pressed={room === r}>
            {r === 'all' ? 'All rooms' : r}
          </button>
        ))}
      </div>

      <div className="board">
        {cards.length === 0 && <p className="sub">No allergies in this room.</p>}
        {cards.map(({ c, sev }) => (
          <div className={`bcard ${sev}`} key={c.id}>
            <span className="tag">{sev === 'ana' ? 'ANAPHYLAXIS RISK' : 'INTOLERANCE'}</span>
            <h3>{c.name}</h3>
            <div className="sub" style={{ color: 'inherit' }}>
              {c.room} room
            </div>
            {c.allergies.map((al) => (
              <div className="big" key={al.a}>
                {al.a} <span className="tag">{al.sev === 'ana' ? 'SEVERE' : 'MILD'}</span>
              </div>
            ))}
            {c.note && (
              <div className="sub" style={{ color: 'inherit' }}>
                {c.note}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="sub">
        {none} {none === 1 ? 'child has' : 'children have'} no known allergies and {none === 1 ? 'is' : 'are'} not listed.
      </p>
    </>
  );
}
