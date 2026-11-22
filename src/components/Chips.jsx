export function Bang() {
  return (
    <>
      <span className="bang" aria-hidden="true">!</span>
      <span className="sr">Anaphylaxis: </span>
    </>
  );
}

/** Red or amber button for a child who clashes with a dish. Opens their details. */
export function KidChip({ clash, onOpen }) {
  const { child, hit, sev } = clash;
  return (
    <button className={`kid ${sev}`} onClick={() => onOpen(child.id)}>
      {sev === 'ana' && <Bang />}
      {child.name} · {hit.map((h) => h.a).join(', ')}
    </button>
  );
}

export function AllergenChips({ dish }) {
  if (!dish.checked) return <span className="chip unk">Allergens not checked</span>;
  if (!dish.allergens.length) return <span className="chip none">No listed allergens</span>;
  return dish.allergens.map((a) => (
    <span className="chip" key={a}>
      {a}
    </span>
  ));
}

/** Non-interactive version of KidChip, for use inside a label. */
export function KidTag({ clash }) {
  const { child, hit, sev } = clash;
  return (
    <span className={`kid ${sev}`}>
      {sev === 'ana' && <Bang />}
      {child.name} · {hit.map((h) => h.a).join(', ')}
    </span>
  );
}
