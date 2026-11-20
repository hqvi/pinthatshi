import { useEffect, useState } from 'react';
import type { Area } from '../data/areas';
import { inScope, loadGeography, normalizeAnswer, type Place } from '../map/geography';

export function PlacePicker({ area, expanded, onSelect }: { area: Area; expanded: boolean; onSelect: (place: Place) => void }) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setError(false);
    loadGeography().then(data => { if (active) setPlaces(data.features.map(f => f.properties)); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [attempt]);
  const candidates = places.filter(place => inScope(place, area, expanded) && normalizeAnswer(place.name).includes(normalizeAnswer(query)));
  const shown = candidates.slice(0, 8);
  return <div className="place-picker"><label htmlFor="place-search">Explore a place</label><input id="place-search" type="search" placeholder="Search this area…" value={query} onChange={event => setQuery(event.target.value)} autoComplete="off" /><p className="picker-help">Click the map or choose a name. Small circles mark tiny places.</p>{error ? <p role="status">Place list unavailable. <button onClick={() => setAttempt(value => value + 1)}>Try again</button></p> : <><span className="search-status" role="status">{places.length ? `${candidates.length} ${candidates.length === 1 ? 'place' : 'places'}${candidates.length > 8 ? ' · showing first 8' : ''}` : 'Loading places…'}</span><ul className="place-results">{shown.map(place => <li key={place.id}><button onClick={() => onSelect(place)}><span className="place-dot" style={{ backgroundColor: place.color }} /><span>{place.name}{place.kind === 'area' ? <small>{place.parent ? `Area · ${place.parent}` : 'Area'}</small> : null}</span></button></li>)}</ul>{places.length > 0 && candidates.length === 0 ? <p className="picker-help">No places match in this area.</p> : null}</>}</div>;
}
