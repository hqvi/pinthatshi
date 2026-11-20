import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { AtlasMap } from './components/AtlasMap';
import { continents, findArea, world, type Area } from './data/areas';
import compass from '../docs/style-guide/sprites/compass.svg';
import type { Selection } from './components/InteractiveAtlas';
import type { Place } from './map/geography';

const InteractiveAtlas = lazy(() => import('./components/InteractiveAtlas').then(module => ({ default: module.InteractiveAtlas })));
const PlacePicker = lazy(() => import('./components/PlacePicker').then(module => ({ default: module.PlacePicker })));

type Screen = 'home' | 'games' | 'areas';
type Route = { screen: Screen; area: Area; expanded: boolean };
function readRoute(): Route {
  const [path, query = ''] = window.location.hash.slice(1).split('?');
  const params = new URLSearchParams(query);
  return { screen: path === '/games' ? 'games' : path === '/learn-countries' ? 'areas' : 'home', area: findArea(params.get('area') ?? undefined), expanded: params.get('coverage') !== 'countries' };
}
function makeHash(route: Route) {
  const path = route.screen === 'areas' ? '/learn-countries' : route.screen === 'games' ? '/games' : '/';
  return `#${path}?area=${route.area.id}&coverage=${route.expanded ? 'areas' : 'countries'}`;
}

function AreaCard({ area, selected, onSelect, wide = false }: { area: Area; selected: boolean; onSelect: (area: Area) => void; wide?: boolean }) {
  return <button className={`area-card${wide ? ' area-card-wide' : ''}`} aria-pressed={selected} onClick={() => onSelect(area)}>
    <span className="card-map"><AtlasMap area={area} colorful decorative /><span className="card-state">{selected ? 'Selected' : area.level === 'region' ? 'Region' : 'Full map'}</span></span>
    <span className="card-label">{area.level === 'continent' ? `All ${area.name}` : area.name}<span aria-hidden="true">{selected ? '●' : '○'}</span></span>
  </button>;
}

const futureGames = [
  { name: 'Countries', description: 'Learn the map, one place at a time.', modes: ['Name All Countries', 'Name the Country', 'Name the Country: Silhouette'] },
  { name: 'Capitals', description: 'Connect a country to its capital.', modes: ['Find Capitals', 'Pin Capitals', 'Name All Capitals', 'Name the Capital'] },
  { name: 'Flags', description: 'Put a flag to a place.', modes: ['Map the Flag', 'Name the Flag', 'Match the Flag', 'Name All Flags'] },
];

export function App() {
  const [route, setRoute] = useState<Route>(readRoute);
  const [selection, setSelection] = useState<Selection>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const previousScreen = useRef(route.screen);
  useEffect(() => {
    const sync = () => { setRoute(readRoute()); setSelection(null); };
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  useEffect(() => {
    document.title = `${route.screen === 'home' ? 'A little more of the world' : route.screen === 'games' ? 'Play & Learn' : `Learn Countries · ${route.area.name}`} · pinthatshi`;
    if (!firstRender.current && previousScreen.current !== route.screen) {
      heading.current?.focus();
      window.scrollTo(0, 0);
    }
    firstRender.current = false;
    previousScreen.current = route.screen;
  }, [route.screen, route.area.name]);
  const updateRoute = (next: Route) => { setSelection(null); setRoute(next); window.location.hash = makeHash(next); };
  const navigate = (screen: Screen) => updateRoute({ ...route, screen });
  const showMapOnPhone = () => { if (window.matchMedia('(max-width: 760px)').matches) document.querySelector('.map-stage')?.scrollIntoView({ block: 'start' }); };
  const selectArea = (area: Area) => { updateRoute({ ...route, area }); showMapOnPhone(); };
  const selectPlace = (place: Place | null, focus = false) => { setSelection(previous => place ? { place, focus, revision: (previous?.revision ?? 0) + 1 } : null); if (focus) showMapOnPhone(); };
  const backLabel = route.screen === 'areas' ? 'Games' : 'Home';

  return <>
    <a href="#main-content" className="skip-link" onClick={e => { e.preventDefault(); heading.current?.focus(); }}>Skip to content</a>
    <main id="main-content" className={`atlas-book screen-${route.screen}`}>
      <header className="book-header">
        {route.screen === 'home' ? <span className="edition">Your geography playground</span> : <button className="back-button" onClick={() => navigate(route.screen === 'areas' ? 'games' : 'home')}><span className="back-mark" aria-hidden="true">‹</span><span><small>Back to</small>{backLabel}</span></button>}
        <button className="small-wordmark" onClick={() => navigate('home')} aria-label="pinthatshi home">pinthatshi</button>
        <span className="edition">{route.screen === 'areas' ? 'Find Countries' : 'World atlas'}</span>
      </header>

      {route.screen === 'home' ? <section className="home-scene" aria-labelledby="home-title">
        <div className="home-atlas"><AtlasMap area={world} decorative /></div>
        <div className="title-sign paper"><span className="eyebrow">A little more of the world, every time.</span><h1 ref={heading} id="home-title" tabIndex={-1}>pinthatshi</h1><span className="sign-rule" /><p>Find places. Learn their names.<br />Get to know your world.</p><span className="sign-coordinate">A WORLD WORTH KNOWING</span></div>
        <div className="home-actions paper"><span className="eyebrow">Unfold your next adventure</span><button className="button button-navy" onClick={() => navigate('games')}>Play & Learn</button><div className="home-tags"><span>Countries</span><span>Capitals</span><span>Flags</span></div></div>
        <img className="compass" src={compass} width="48" height="48" alt="" />
      </section> : route.screen === 'games' ? <section className="library" aria-labelledby="games-title">
        <div className="library-intro"><span className="eyebrow">The game library</span><h1 ref={heading} id="games-title" tabIndex={-1}>Play & Learn</h1><p>Start small. Get to know the whole world.</p></div>
        <div className="collections">{futureGames.map((collection, i) => <article className="collection paper" key={collection.name}><div className="collection-art"><AtlasMap area={continents[i * 2].area} colorful decorative /><span>{collection.name}</span></div><div className="collection-content"><h2>{collection.name}</h2><p>{collection.description}</p>{i === 0 ? <button className="mode-button" onClick={() => navigate('areas')}><strong>Find Countries</strong><span>Choose a region to explore</span></button> : null}<ul>{collection.modes.map(mode => <li key={mode}>{mode}</li>)}</ul><span className="planned-label">{i === 0 ? 'More country games planned' : 'Planned collection'}</span></div></article>)}</div>
        <div className="library-bottom"><article><span className="eyebrow">Country packs · planned</span><h2>Closer to home</h2><p>Philippine regions and provinces first.<br />USA and UK follow.</p></article><article><span className="eyebrow">Practice · planned</span><h2>Review Mistakes</h2><p>Revisit the places you’re still learning.</p></article></div>
      </section> : <section className="area-layout" aria-labelledby="areas-title">
        <div className="map-stage"><Suspense fallback={<AtlasMap area={route.area} />}><InteractiveAtlas area={route.area} expanded={route.expanded} selection={selection} onSelect={place => selectPlace(place)} /></Suspense><div className="map-caption paper"><span className="eyebrow">Explore the atlas</span><strong>{route.area.name}</strong><span>{route.expanded ? 'Countries & Areas' : 'Countries'}</span></div><img className="compass" src={compass} width="48" height="48" alt="" /></div>
        <aside className="area-panel paper"><div className="panel-intro"><h1 ref={heading} id="areas-title" tabIndex={-1}>Learn Countries</h1><p>Explore a region, a continent, or the whole world.</p><label className="coverage-option"><input type="checkbox" checked={route.expanded} onChange={e => updateRoute({ ...route, expanded: e.target.checked })} /><span>Include territories & overseas areas<small>Countries & Areas</small></span></label></div>
          <div className="selection-readout" role="status"><span className="eyebrow">{selection ? 'Selected place' : 'Your area'}</span><strong>{selection ? <><i className="place-dot" style={{ backgroundColor: selection.place.color }} />{selection.place.name}</> : route.area.name}</strong><span>{selection?.place.kind === 'area' ? `Area · ${selection.place.parent || selection.place.region}` : 'Explore freely · quiz gameplay comes next'}</span></div>
          <div className="area-scroll"><details className="explore-places"><summary>Explore places in this area</summary><Suspense fallback={<p>Loading place search…</p>}><PlacePicker area={route.area} expanded={route.expanded} onSelect={place => selectPlace(place, true)} /></Suspense></details>{continents.map(continent => <section className="continent-section" key={continent.area.id} aria-labelledby={`heading-${continent.area.id}`}><h2 id={`heading-${continent.area.id}`}>{continent.name}</h2><div className="area-grid">{continent.regions.map(area => <AreaCard key={area.id} area={area} selected={route.area.id === area.id} onSelect={selectArea} />)}<AreaCard area={continent.area} selected={route.area.id === continent.area.id} onSelect={selectArea} wide /></div></section>)}<section className="continent-section" aria-labelledby="heading-world"><h2 id="heading-world">Everything</h2><AreaCard area={world} selected={route.area.id === world.id} onSelect={selectArea} wide /></section></div>
        </aside>
      </section>}
      <footer className="book-footer"><span>pinthatshi · atlas edition</span><span>Interactive atlas · quizzes in development</span></footer>
    </main>
  </>;
}
