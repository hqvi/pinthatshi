import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { AtlasMap } from './components/AtlasMap';
import { continents, findArea, world, offersWhole, type Area } from './data/areas';
import compass from '../docs/style-guide/sprites/compass.svg';
import type { Selection } from './components/InteractiveAtlas';
import type { Place } from './map/geography';
import { ContinuePractice } from './components/PracticeLinks';
import { clearRound, readProgress, recordKey } from './game/storage';
import { loadGeography, inScope, type Geography } from './map/geography';
import { formatTime } from './game/session';
import { SoundButton } from './components/SoundButton';
import { playSound } from './game/sound';

const InteractiveAtlas = lazy(() => import('./components/InteractiveAtlas').then(module => ({ default: module.InteractiveAtlas })));
const FindCountries = lazy(() => import('./components/FindCountries').then(module => ({ default: module.FindCountries })));

type Screen = 'home' | 'games' | 'areas' | 'play';
type Route = { screen: Screen; area: Area; expanded: boolean };
function readCoverage() { try { return localStorage.getItem('pinthatshi.coverage') === 'areas'; } catch { return false; } }
function readRoute(): Route {
  const [path, query = ''] = window.location.hash.slice(1).split('?');
  const params = new URLSearchParams(query);
  return { screen: path === '/play' ? 'play' : path === '/games' ? 'games' : path === '/learn-countries' ? 'areas' : 'home', area: findArea(params.get('area') ?? undefined), expanded: params.has('coverage') ? params.get('coverage') === 'areas' : readCoverage() };
}
function makeHash(route: Route) {
  const path = route.screen === 'play' ? '/play' : route.screen === 'areas' ? '/learn-countries' : route.screen === 'games' ? '/games' : '/';
  return `#${path}?area=${route.area.id}&coverage=${route.expanded ? 'areas' : 'countries'}`;
}

function AreaCard({ area, onSelect, wide = false, count, best, resume, geography, expanded }: { area: Area; onSelect: (area: Area) => void; wide?: boolean; count?: number; best?: number | null; resume?: boolean; geography?: Geography | null; expanded: boolean }) {
  return <button className={`area-card${wide ? ' area-card-wide' : ''}`} onClick={() => onSelect(area)} aria-label={`${resume ? 'Continue' : 'Play'} ${area.name}${count === undefined ? '' : `, ${count} places`}`}>
    <span className="card-map"><AtlasMap area={area} colorful decorative geography={geography} expanded={expanded} />{best != null || resume ? <span className={`card-state${best != null ? ' perfect-badge' : ''}`}>{best != null ? `Perfect ${formatTime(best)}` : 'Continue'}</span> : null}</span>
    <span className="card-label">{area.name}<span>{count ?? '…'}</span></span>
  </button>;
}

const futureGames = [
  { name: 'Countries', description: 'Learn the map, one place at a time.', modes: ['Name All Countries', 'Name the Country', 'Name the Country: Silhouette'] },
  { name: 'Capitals', description: 'Connect a country to its capital.', modes: ['Find Capitals', 'Pin Capitals', 'Name All Capitals', 'Name the Capital'] },
  { name: 'Flags', description: 'Put a flag to a place.', modes: ['Map the Flag', 'Name the Flag', 'Match the Flag', 'Name All Flags'] },
];

export function App() {
  useEffect(() => {
    const click = (event: MouseEvent) => {
      const button = event.target instanceof Element ? event.target.closest('button') : null;
      if (button && !button.disabled && !button.matches('.sound-control,.hint-button,.area-card')) playSound('click');
    };
    document.addEventListener('click', click);
    return () => document.removeEventListener('click', click);
  }, []);
  const [route, setRoute] = useState<Route>(readRoute);
  const [geography, setGeography] = useState<Geography | null>(null);
  const [progress, setProgress] = useState(readProgress);
  const [geographyFailed, setGeographyFailed] = useState(false);
  const [geographyAttempt, setGeographyAttempt] = useState(0);
  useEffect(() => {
    if (!['areas','games'].includes(route.screen) || geography) return;
    let active = true; setGeographyFailed(false);
    loadGeography().then(data => { if (active) setGeography(data); }).catch(() => { if (active) setGeographyFailed(true); });
    return () => { active = false; };
  }, [route.screen, geography, geographyAttempt]);
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
    setProgress(readProgress());
    document.title = `${route.screen === 'home' ? 'A little more of the world' : route.screen === 'games' ? 'Play & Learn' : `Learn Countries · ${route.area.name}`} · pinthatshi`;
    if (!firstRender.current && previousScreen.current !== route.screen) {
      heading.current?.focus();
      window.scrollTo(0, 0);
    }
    firstRender.current = false;
    previousScreen.current = route.screen;
  }, [route.screen, route.area.name]);
  const updateRoute = (next: Route) => { try { localStorage.setItem('pinthatshi.coverage', next.expanded ? 'areas' : 'countries'); } catch { /* Optional preference. */ } setSelection(null); setRoute(next); window.location.hash = makeHash(next); };
  const navigate = (screen: Screen) => updateRoute({ ...route, screen });
  const selectPlace = (place: Place | null) => setSelection(previous => place ? { place, focus: false, revision: (previous?.revision ?? 0) + 1 } : null);
  const startRound = (fresh: boolean, area = route.area) => { if (fresh) clearRound(area.id, route.expanded); playSound('entry'); updateRoute({ ...route, area, screen: 'play' }); };
  const card = (area: Area, wide = false) => <AreaCard key={area.id} area={area} wide={wide} geography={geography} expanded={route.expanded} count={geography?.features.filter(f => inScope(f.properties, area, route.expanded)).length} best={progress.records[recordKey(area.id, route.expanded)]?.perfectBestMs} resume={!!progress.rounds[recordKey(area.id, route.expanded)]} onSelect={area => startRound(false, area)} />;
  const backLabel = route.screen === 'play' ? 'Areas' : route.screen === 'areas' ? 'Games' : 'Home';

  return <>
    <a href="#main-content" className="skip-link" onClick={e => { e.preventDefault(); document.querySelector<HTMLElement>('h1[tabindex]')?.focus(); }}>Skip to content</a>
    <main id="main-content" className={`atlas-book screen-${route.screen}`}>
      {route.screen !== 'areas' && route.screen !== 'play' ? <header className="book-header">
        {route.screen === 'home' ? <span className="edition">Your geography playground</span> : <button className="back-button" onClick={() => navigate(route.screen === 'play' ? 'areas' : route.screen === 'areas' ? 'games' : 'home')}><span className="back-mark" aria-hidden="true">‹</span><span><small>Back to</small>{backLabel}</span></button>}
        <button className="small-wordmark" onClick={() => navigate('home')} aria-label="pinthatshi home">pinthatshi</button>
        <span className="edition">World atlas</span>
      </header> : null}

      {route.screen === 'home' ? <section className="home-scene" aria-labelledby="home-title">
        <div className="home-atlas"><AtlasMap area={world} decorative /></div>
        <div className="title-sign paper"><span className="eyebrow">A little more of the world, every time.</span><h1 ref={heading} id="home-title" tabIndex={-1}>pinthatshi</h1><span className="sign-rule" /><p>Find places. Learn their names.<br />Get to know your world.</p><span className="sign-coordinate">A WORLD WORTH KNOWING</span></div>
        <div className="home-actions paper"><span className="eyebrow">Unfold your next adventure</span><button className="button button-navy" onClick={() => navigate('games')}>Play & Learn</button><ContinuePractice onContinue={saved => updateRoute({ screen: 'play', area: findArea(saved.scopeId), expanded: saved.expanded })} /><div className="home-tags"><span>Countries</span><span>Capitals</span><span>Flags</span></div></div>
        <img className="compass" src={compass} width="48" height="48" alt="" />
      </section> : route.screen === 'games' ? <section className="library" aria-labelledby="games-title">
        <div className="library-intro"><span className="eyebrow">The game library</span><h1 ref={heading} id="games-title" tabIndex={-1}>Play & Learn</h1><p>Start small. Get to know the whole world.</p></div>
        <div className="collections">{futureGames.map((collection, i) => <article className="collection paper" key={collection.name}><div className="collection-art">{i === 0 ? <AtlasMap area={world} colorful decorative geography={geography} expanded={false} /> : <div className="collection-placeholder" aria-hidden="true">{i === 1 ? 'A CAPITAL IDEA' : 'FLAGS OF THE WORLD'}<small>Coming later</small></div>}<span>{collection.name}</span></div><div className="collection-content"><h2>{collection.name}</h2><p>{collection.description}</p>{i === 0 ? <button className="mode-button" onClick={() => navigate('areas')}><strong>Find Countries</strong><span>Choose a region to explore</span></button> : null}<ul>{collection.modes.map(mode => <li key={mode}>{mode}</li>)}</ul><span className="planned-label">{i === 0 ? 'More country games planned' : 'Planned collection'}</span></div></article>)}</div>
        <div className="library-bottom"><article><span className="eyebrow">Country packs · planned</span><h2>Closer to home</h2><p>Philippine regions and provinces first.<br />USA and UK follow.</p></article><article><span className="eyebrow">Practice · planned</span><h2>Review Mistakes</h2><p>Revisit the places you’re still learning.</p></article></div>
      </section> : route.screen === 'play' ? <Suspense fallback={<p className="quiz-loading">Opening Find Countries…</p>}><FindCountries key={`${route.area.id}:${route.expanded}`} area={route.area} expanded={route.expanded} onExit={() => navigate('areas')} onNext={area => startRound(true, area)} /></Suspense> : <section className="area-layout" aria-labelledby="areas-title">
        <div className="map-stage"><Suspense fallback={<AtlasMap area={world} />}><InteractiveAtlas area={world} expanded={route.expanded} selection={selection} onSelect={selectPlace} /></Suspense></div>
        <aside className="area-panel paper">
          <div className="panel-nav"><button className="back-button" onClick={() => navigate('games')}><span className="back-mark" aria-hidden="true">‹</span><span><small>Back to</small>Games</span></button><SoundButton /></div>
          <div className="area-scroll">
            <div className="panel-intro"><h1 ref={heading} id="areas-title" tabIndex={-1}>Learn Countries</h1><p>Learn the countries of the world.</p>
              {geographyFailed ? <p role="status">Place totals could not load. <button className="text-action" onClick={() => setGeographyAttempt(n => n + 1)}>Retry place list</button></p> : null}<div className="overview-card"><AtlasMap area={world} colorful decorative geography={geography} expanded={route.expanded} /><div><span>{geography ? geography.features.filter(f => (route.expanded || f.properties.kind === 'country') && progress.learned.includes(f.properties.id)).length : 0} learned</span><span>{geography ? geography.features.filter(f => route.expanded || f.properties.kind === 'country').length : '…'} places · {22} maps</span></div></div>
              {progress.archivedRounds.length ? <p className="legacy-note">Earlier rounds and records are retained. Updated maps start new times.</p> : null}<p className="overview-note">Pick a map to begin. Your progress and best times stay in this browser.</p>
              <label className="coverage-option"><input type="checkbox" checked={route.expanded} onChange={e => updateRoute({ ...route, expanded: e.target.checked })} /><span>Include territories & overseas areas</span></label>
            </div>
            {continents.map(continent => <section className="continent-section" key={continent.area.id} aria-labelledby={`heading-${continent.area.id}`}><h2 id={`heading-${continent.area.id}`}>{continent.name}</h2><div className="area-grid">{continent.regions.map(area => card(area))}{offersWhole(continent.area) ? card(continent.area, true) : null}</div></section>)}
            <section className="continent-section" aria-labelledby="heading-world"><h2 id="heading-world">Everything</h2>{card(world, true)}</section>
          </div>
        </aside>
      </section>}
      {route.screen !== 'areas' && route.screen !== 'play' ? <footer className="book-footer"><span>pinthatshi · atlas edition</span><span>Find Countries · early playable</span></footer> : null}
    </main>
  </>;
}
