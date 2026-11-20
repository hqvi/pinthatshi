import { useEffect, useRef, useState } from 'react';
import { Map as LibreMap, Marker, setWorkerUrl, type StyleSpecification } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Area } from '../data/areas';
import { loadGeography, loadCoastlines, inScope, type Geography, type Place } from '../map/geography';
import { coordinateLabel, gridStep, gridValues, longitudeInterval } from '../map/grid';
import { AtlasMap } from './AtlasMap';
import { captureMap, paintResolved } from '../map/completion';
import { paintWaves } from '../map/cartography';
import { scopeColors } from '../map/palette';
import { addMapDetails } from '../map/details';
import { Compass } from './Compass';
import pinCursor from '../assets/pushpin.svg';

export type Selection = { place: Place; focus: boolean; revision: number } | null;
type Props = { area: Area; expanded: boolean; selection: Selection; onSelect: (place: Place | null, keyboard?: boolean) => void; mode?: 'explore' | 'quiz'; answered?: readonly string[]; assisted?: readonly string[]; wrongId?: string; complete?: boolean; hintId?: string; fitRequest?: number; onReady?: (ready: boolean) => void; onSnapshot?: (image: string | null) => void };
const noAnswers: readonly string[] = [];
type Tick = { position: number; value: number };
type Grid = { width: number; height: number; longitude: Tick[]; latitude: Tick[] };
const emptyGrid: Grid = { width: 0, height: 0, longitude: [], latitude: [] };
setWorkerUrl(workerUrl);
const style: StyleSpecification = { version: 8, sources: {}, layers: [{ id: 'water', type: 'background', paint: { 'background-color': '#a9c3c9' } }] };
const duration = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350;

function fitArea(map: LibreMap, area: Area, animate = true) {
  const [west, south, east, north] = area.bounds;
  const small = map.getContainer().clientWidth < 500;
  map.fitBounds([[west, Math.max(-80, south)], [east, Math.min(80, north)]], { padding: { top: small ? 60 : 90, left: 35, right: 30, bottom: 45 }, maxZoom: 6, duration: animate ? duration() : 0 });
}

export function InteractiveAtlas({ area, expanded, selection, onSelect, mode = 'explore', answered = noAnswers, assisted = noAnswers, wrongId, complete = false, hintId, fitRequest = 0, onReady, onSnapshot }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LibreMap | null>(null);
  const dataRef = useRef<Geography | null>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const waves = useRef<HTMLCanvasElement>(null);
  const [mapInstance, setMapInstance] = useState<LibreMap | null>(null);
  const [tilesFailed, setTilesFailed] = useState(false);
  const latest = useRef({ area, expanded, onSelect, mode, answered, complete, onReady, onSnapshot });
  latest.current = { area, expanded, onSelect, mode, answered, complete, onReady, onSnapshot };
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [grid, setGrid] = useState<Grid>(emptyGrid);
  const [zoom, setZoom] = useState(0);

  useEffect(() => {
    let disposed = false;
    let map: LibreMap | undefined;
    let frame = 0;
    let observer: ResizeObserver | undefined;
    setPhase('loading');
    setGrid(emptyGrid);
    Promise.all([loadGeography(), loadCoastlines()]).then(([data, coastline]) => {
      if (disposed || !container.current) return;
      dataRef.current = data;
      try {
        map = new LibreMap({ container: container.current, style, center: [0, 15], zoom: 1, minZoom: .3, maxZoom: 12, attributionControl: false, dragRotate: false, pitchWithRotate: false, touchPitch: false, renderWorldCopies: true, cooperativeGestures: false, canvasContextAttributes: { preserveDrawingBuffer: latest.current.mode === 'quiz', antialias: true } });
        mapRef.current = map; setMapInstance(map);
        const atlas = map;
        atlas.touchZoomRotate.disableRotation();
        atlas.keyboard.disableRotation();
        atlas.getCanvas().setAttribute('aria-label', latest.current.mode === 'quiz' ? 'Quiz atlas. Arrow keys pan; plus and minus zoom. Enter selects the country under the center crosshair; Space gives a hint.' : 'Interactive atlas. Arrow keys pan; plus and minus zoom. Click a country to explore its outline.');
        const updateGrid = () => {
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => {
            if (disposed) return;
            const width = atlas.getContainer().clientWidth, height = atlas.getContainer().clientHeight;
            const nw = atlas.unproject([0, 0]), se = atlas.unproject([width, height]);
            const lngStep = gridStep(se.lng - nw.lng, width), latStep = gridStep(nw.lat - se.lat, height);
            const longitude = gridValues(nw.lng, se.lng, lngStep).map(value => ({ value, position: atlas.project([value, 0]).x })).filter(t => t.position >= 35 && t.position <= width - 20);
            const latitude = gridValues(Math.max(-80, se.lat), Math.min(80, nw.lat), latStep).map(value => ({ value, position: atlas.project([atlas.getCenter().lng, value]).y })).filter(t => t.position >= 20 && t.position <= height - 30);
            setGrid({ width, height, longitude, latitude });
            setZoom(atlas.getZoom());
            if (waves.current) paintWaves(waves.current, atlas, data);
            if (overlay.current) paintResolved(overlay.current, atlas, dataRef.current ?? data, latest.current.answered, latest.current.complete);
          });
        };
        atlas.on('move', updateGrid);
        atlas.on('resize', updateGrid);
        atlas.on('webglcontextlost', () => { if (!disposed) setPhase('error'); });
        atlas.on('webglcontextrestored', () => { if (!disposed) { setPhase('ready'); updateGrid(); } });
        atlas.on('error', event => { if (!disposed && 'sourceId' in event && event.sourceId === 'openfreemap') setTilesFailed(true); });
        atlas.on('load', () => {
          if (disposed) return;
          atlas.addSource('places', { type: 'geojson', data, promoteId: 'id', tolerance: .25, maxzoom: 12 });
          atlas.addSource('coast', { type: 'geojson', data: coastline, tolerance: .03 });
          for (const [id, width, color] of [['shallows', 20, '#b7ced1'], ['waterline', 13, '#a9c3c9'], ['coastal-rim', 7, '#c7dad9']] as const) atlas.addLayer({ id, type: 'line', source: 'coast', paint: { 'line-color': color, 'line-width': width }, layout: { 'line-join': 'round' } });
          atlas.addLayer({ id: 'land', type: 'fill', source: 'places', paint: { 'fill-color': ['case', ['boolean', ['feature-state', 'selected'], false], ['coalesce', ['feature-state', 'color'], ['get', 'color']], ['boolean', ['feature-state', 'active'], false], '#ecdfb9', '#b8c8c4'], 'fill-opacity': 1 } });
          atlas.addLayer({ id: 'boundaries', type: 'line', source: 'places', paint: { 'line-color': '#3a2c1d', 'line-width': 1.25, 'line-opacity': .78, 'line-dasharray': [4, 1.6, 1, 1.6] }, layout: { 'line-join': 'round' } });
          atlas.addLayer({ id: 'coast-ink', type: 'line', source: 'coast', paint: { 'line-color': '#3a2c1d', 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 1.2, 6, 1.5, 12, 2.2] } });
          atlas.addLayer({ id: 'hover-wash', type: 'fill', source: 'places', paint: { 'fill-color': '#f8f0dc', 'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], .16, 0] } });
          atlas.addLayer({ id: 'wrong-wash', type: 'fill', source: 'places', paint: { 'fill-color': '#c0362d', 'fill-opacity': ['case', ['boolean', ['feature-state', 'wrong'], false], .24, 0] } });
          atlas.addLayer({ id: 'selection-border', type: 'line', source: 'places', paint: { 'line-color': ['case', ['any', ['boolean', ['feature-state', 'hint'], false], ['boolean', ['feature-state', 'wrong'], false]], '#c0362d', '#2b2118'], 'line-width': ['case', ['boolean', ['feature-state', 'hint'], false], 3, 1.6], 'line-opacity': ['case', ['any', ['boolean', ['feature-state', 'selected'], false], ['boolean', ['feature-state', 'hint'], false], ['boolean', ['feature-state', 'hover'], false], ['boolean', ['feature-state', 'wrong'], false]], 1, 0] } });
          // All places get a source anchor, but only small shapes get an aid marker.
          const points = data.features.filter(feature => {
            const rings = feature.geometry.type === 'Polygon' ? feature.geometry.coordinates : feature.geometry.coordinates.flat();
            const vertices = rings.flat();
            const [west, east] = longitudeInterval(vertices.map(p => p[0]));
            const ys = vertices.map(p => p[1]);
            return (east - west) * (Math.max(...ys) - Math.min(...ys)) < .65;
          }).map(feature => ({ type: 'Feature' as const, id: feature.id, properties: feature.properties, geometry: { type: 'Point' as const, coordinates: [feature.properties.longitude, feature.properties.latitude] } }));
          atlas.addSource('small-places', { type: 'geojson', promoteId: 'id', data: { type: 'FeatureCollection', features: points } });
          atlas.addLayer({ id: 'small-place-dots', type: 'circle', source: 'small-places', paint: { 'circle-radius': 4.5, 'circle-color': ['case', ['boolean', ['feature-state', 'selected'], false], ['coalesce', ['feature-state', 'color'], ['get', 'color']], '#f8f0dc'], 'circle-stroke-color': '#3a2c1d', 'circle-stroke-width': 1, 'circle-opacity': ['case', ['boolean', ['feature-state', 'active'], false], .9, 0], 'circle-stroke-opacity': ['case', ['boolean', ['feature-state', 'active'], false], .9, 0] } });
          const chooseAt = (x: number, y: number, keyboard = false) => {
            const features = [
              ...atlas.queryRenderedFeatures([[x - 5, y - 5], [x + 5, y + 5]], { layers: ['small-place-dots'] }),
              ...atlas.queryRenderedFeatures([x, y], { layers: ['land'] }),
            ];
            const places = features.map(f => data.features.find(place => place.id === f.id)?.properties).filter((p): p is Place => !!p);
            const place = places.find(p => inScope(p, latest.current.area, latest.current.expanded));
            latest.current.onSelect(place ?? null, keyboard);
          };
          atlas.on('click', event => chooseAt(event.point.x, event.point.y));
          atlas.getCanvas().addEventListener('keydown', event => { if (event.key === 'Enter' && latest.current.mode === 'quiz') { event.preventDefault(); chooseAt(atlas.getContainer().clientWidth / 2, atlas.getContainer().clientHeight / 2, true); } });
          let hovered: string | number | undefined;
          const clearHover = () => { if (hovered !== undefined) atlas.setFeatureState({ source: 'places', id: hovered }, { hover: false }); hovered = undefined; };
          atlas.on('mousemove', event => {
            const hit = atlas.queryRenderedFeatures(event.point, { layers: ['land', 'small-place-dots'] }).find(f => {
              const place = data.features.find(p => p.id === f.id)?.properties;
              return place && inScope(place, latest.current.area, latest.current.expanded);
            });
            if (hit?.id !== hovered) { clearHover(); hovered = hit?.id; if (hovered !== undefined) atlas.setFeatureState({ source: 'places', id: hovered }, { hover: true }); }
          });
          atlas.getCanvas().addEventListener('mouseleave', clearHover);
          atlas.on('dragstart', () => { clearHover(); atlas.getCanvas().classList.add('map-dragging'); });
          atlas.on('dragend', () => atlas.getCanvas().classList.remove('map-dragging'));
          addMapDetails(atlas);
          fitArea(atlas, latest.current.area, false);
          const localReady = () => {
            if (!disposed && ['places', 'coast', 'small-places'].every(id => atlas.getSource(id) && atlas.isSourceLoaded(id))) setPhase('ready');
          };
          atlas.on('sourcedata', localReady);
          atlas.once('idle', localReady);
          updateGrid();
        });
        observer = new ResizeObserver(() => { atlas.resize(); updateGrid(); });
        observer.observe(container.current);
      } catch { if (!disposed) setPhase('error'); }
    }).catch(() => { if (!disposed) setPhase('error'); });
    return () => { disposed = true; cancelAnimationFrame(frame); observer?.disconnect(); map?.remove(); mapRef.current = null; };
  }, [attempt]);

  useEffect(() => {
    const map = mapRef.current, data = dataRef.current;
    if (phase !== 'ready' || !map || !data) return;
    const colors = scopeColors(data, area, expanded);
    for (const feature of data.features) {
      const id = feature.properties.id;
      const rawColor = colors.get(id) ?? feature.properties.color;
      const opacity = assisted.includes(id) ? .5 : id === answered.at(-1) ? .9 : .72;
      const composite = '#' + [0, 1, 2].map(i => Math.round(parseInt(rawColor.slice(1 + i * 2, 3 + i * 2), 16) * opacity + [236, 223, 185][i] * (1 - opacity)).toString(16).padStart(2, '0')).join('');
      const state = { color: mode === 'quiz' ? composite : rawColor, wrong: id === wrongId, active: inScope(feature.properties, area, expanded), selected: mode === 'quiz' ? answered.includes(feature.properties.id) : feature.id === selection?.place.id && inScope(feature.properties, area, expanded), hint: feature.id === hintId };
      map.setFeatureState({ source: 'places', id: feature.id }, state);
      map.setFeatureState({ source: 'small-places', id: feature.id }, state);
    }
    map.setPaintProperty('land', 'fill-color', ['case', ['boolean', ['feature-state', 'selected'], false], ['coalesce', ['feature-state', 'color'], ['get', 'color']], ['boolean', ['feature-state', 'active'], false], '#ecdfb9', complete ? '#b2c4c3' : '#bacac5']);
    const coloredData = { ...data, features: data.features.map(f => ({ ...f, properties: { ...f.properties, color: colors.get(f.properties.id) ?? f.properties.color } })) };
    dataRef.current = coloredData;
    if (overlay.current) paintResolved(overlay.current, map, coloredData, answered, complete);
  }, [area, expanded, selection, phase, answered, complete, mode, hintId, wrongId, assisted]);

  useEffect(() => { latest.current.onReady?.(phase === 'ready'); if (phase === 'error' && complete) latest.current.onSnapshot?.(null); }, [phase, complete]);
  useEffect(() => { if (fitRequest && phase === 'ready' && mapRef.current) fitArea(mapRef.current, area); }, [fitRequest, phase, area]);

  useEffect(() => {
    const map = mapRef.current, data = dataRef.current;
    if (!complete || phase !== 'ready' || !map || !data) return;
    let active = true;
    const capture = () => {
      if (!active || !overlay.current) return;
      active = false;
      try { paintResolved(overlay.current, map, data, answered, true); latest.current.onSnapshot?.(captureMap(map, overlay.current, waves.current)); }
      catch { latest.current.onSnapshot?.(null); }
    };
    fitArea(map, area);
    map.once('idle', capture); map.triggerRepaint();
    const timeout = window.setTimeout(capture, 4000);
    return () => { active = false; clearTimeout(timeout); map.off('idle', capture); };
  }, [complete, phase, answered, area]);

  useEffect(() => { if (phase === 'ready' && mapRef.current) fitArea(mapRef.current, area); }, [area, phase]);

  useEffect(() => {
    const map = mapRef.current;
    if (phase !== 'ready' || !map || !selection || !inScope(selection.place, area, expanded)) return;
    const place = selection.place;
    if (selection.focus) {
      const feature = dataRef.current?.features.find(f => f.id === place.id);
      if (feature) {
        const vertices = (feature.geometry.type === 'Polygon' ? feature.geometry.coordinates : feature.geometry.coordinates.flat()).flat();
        const [west, east] = longitudeInterval(vertices.map(p => p[0]));
        const ys = vertices.map(p => p[1]);
        map.fitBounds([[west, Math.min(...ys)], [east, Math.max(...ys)]], { padding: 65, maxZoom: 7, duration: duration() });
      }
    }
    const label = document.createElement('span');
    label.className = 'country-plaque';
    const dot = document.createElement('i'); dot.style.backgroundColor = place.color;
    label.append(dot, document.createTextNode(place.name));
    const longitude = place.longitude + Math.round((map.getCenter().lng - place.longitude) / 360) * 360;
    const marker = new Marker({ element: label, anchor: 'center' }).setLngLat([longitude, place.latitude]).addTo(map);
    return () => { marker.remove(); };
  }, [selection, phase, area, expanded]);

  return <div className="interactive-atlas" data-map-state={phase} data-map-zoom={zoom.toFixed(2)} style={{ '--map-pin': `url("${pinCursor}") 13 47, crosshair` } as React.CSSProperties}>
    <div className="map-canvas" ref={container} />
    <canvas ref={waves} className="wave-overlay" aria-hidden="true" />
    <canvas ref={overlay} className="resolved-overlay" aria-hidden="true" />
    {mode === 'quiz' && !complete ? <span className="map-crosshair" aria-hidden="true">+</span> : null}
    {phase !== 'ready' ? <div className="atlas-fallback"><AtlasMap area={area} /><p role="status" className="paper">{phase === 'loading' ? 'Unfolding the atlas…' : 'Interactive map unavailable. The overview is still here.'}{phase === 'error' ? <button onClick={() => setAttempt(value => value + 1)}>Try again</button> : null}</p></div> : null}
    {phase === 'ready' ? <svg className="coordinate-grid" viewBox={`0 0 ${grid.width} ${grid.height}`} aria-hidden="true">
      <g className="graticule-lines">{grid.longitude.map(t => <line key={`x${t.value}`} x1={t.position} x2={t.position} y1="0" y2={grid.height} />)}{grid.latitude.map(t => <line key={`y${t.value}`} x1="0" x2={grid.width} y1={t.position} y2={t.position} />)}</g>
      <g className="coordinate-labels">{grid.longitude.map(t => <text key={`x${t.value}`} x={t.position} y={grid.height - 7} textAnchor="middle">{coordinateLabel(t.value, false)}</text>)}{grid.latitude.map(t => <text key={`y${t.value}`} x="5" y={t.position + 4}>{coordinateLabel(t.value, true)}</text>)}</g>
    </svg> : null}
    <div className="map-controls" aria-label="Atlas controls"><button aria-label="Zoom in" disabled={phase !== 'ready' || zoom >= 11.99} onClick={() => mapRef.current?.zoomIn({ duration: duration() })}>+</button><button aria-label="Zoom out" disabled={phase !== 'ready' || zoom <= .31} onClick={() => mapRef.current?.zoomOut({ duration: duration() })}>−</button><button className="fit-control" disabled={phase !== 'ready'} onClick={() => { if (mapRef.current) fitArea(mapRef.current, area); }}>Fit area</button></div>
    <Compass map={mapInstance} onReset={() => { if (mapRef.current) fitArea(mapRef.current, area); }} />
    <details className="map-attribution"><summary aria-label="Map credits">©</summary><span><a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> · <a href="https://openmaptiles.org" target="_blank" rel="noreferrer">© OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a> · Natural Earth{tilesFailed ? ' · Detail tiles unavailable; local atlas active.' : ''}</span></details>
  </div>;
}
