import { useState } from 'react';
import { ROOMS } from '../data';
import { can } from '../logic';
import { useStore } from '../store';
import { Bang } from './Chips';

export default function Children({ openModal }) {
  const { state } = useStore();
  const [room, setRoom] = useState('all');
  const list = state.children.filter((c) => room === 'all' || c.room === room);

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Children</h1>
          <p>{state.children.length} enrolled · first name and last initial only</p>
        </div>
        {can.kids(state.role) ? (
          <button className="btn primary" onClick={() => openModal({ type: 'child', id: null, edit: true })}>
            Add child
          </button>
        ) : (
          <span className="sub">Only managers can edit allergies.</span>
        )}
      </div>

      <div className="tabs" role="group" aria-label="Room">
        {['all', ...ROOMS].map((r) => (
          <button key={r} onClick={() => setRoom(r)} aria-pressed={room === r}>
            {r === 'all' ? 'All rooms' : r}
          </button>
        ))}
      </div>

      <div className="list">
        {list.map((c) => (
          <button className="card" key={c.id} onClick={() => openModal({ type: 'child', id: c.id, edit: false })}>
            <h3>{c.name}</h3>
            <div className="sub">{c.room} room</div>
            <div className="row">
              {c.allergies.length ? (
                c.allergies.map((al) => (
                  <span className={`kid ${al.sev}`} key={al.a}>
                    {al.sev === 'ana' && <Bang />}
                    {al.a}
                  </span>
                ))
              ) : (
                <span className="chip none">No known allergies</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
