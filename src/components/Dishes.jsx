import { can, dishUsage } from '../logic';
import { useStore } from '../store';
import { AllergenChips } from './Chips';

export default function Dishes({ openModal }) {
  const { state } = useStore();
  const edit = can.dishes(state.role);

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Dishes</h1>
          <p>Allergens come from the recipe or the packet label</p>
        </div>
        {edit ? (
          <button className="btn primary" onClick={() => openModal({ type: 'dish', id: null })}>
            Add dish
          </button>
        ) : (
          <span className="sub">Only the cook and manager can edit dishes.</span>
        )}
      </div>

      <div className="list">
        {state.dishes.map((d) => (
          <div className="card" key={d.id}>
            <h3>{d.name}</h3>
            <div className="row">
              <AllergenChips dish={d} />
            </div>
            <div className="sub">
              Served {dishUsage(state.logs, d.id)}× so far{d.alt ? ` · Safe option: ${d.alt}` : ''}
            </div>
            {edit && (
              <div>
                <button className="btn small" onClick={() => openModal({ type: 'dish', id: d.id })}>
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
