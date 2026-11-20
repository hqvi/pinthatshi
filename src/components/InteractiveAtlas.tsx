import { memo, useEffect, useRef, useState } from 'react';
import { Map as LibreMap, Marker, setWorkerUrl, type StyleSpecification } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Area } from '../data/areas';
import { loadGeography, loadCoastlines, inScope, type Geography, type Place } from '../map/geography';
import { longitudeInterval } from '../map/grid';
import { AtlasMap } from './AtlasMap';
import { captureMap, paintResolved } from '../map/completion';
import type { Session } from '../game/session';
import { paintArrow } from '../map/feedback';
import { borderLines } from '../map/borders';
import { oceanWaves } from '../map/cartography';
import { gridPainter } from '../map/grid-renderer';
import { shapeMetrics, aidOpacity } from '../map/geometry';
import type { ExpressionSpecification } from 'maplibre-gl';
import { scopeColors } from '../map/palette';
import { addMapDetails } from '../map/details';
import { Compass } from './Compass';
import pinCursor from '../assets/pushpin.svg';

export type Selection = { place: Place; focus: boolean; revision: number } | null;
type Props = { area: Area; expanded: boolean; selection: Selection; onSelect: (place: Place | null, keyboard?: boolean, pin?: [number, number]) => void; mode?: 'explore' | 'quiz'; answered?: readonly string[]; assisted?: readonly string[]; wrong?: Session['lastWrong']; targetId?: string; complete?: boolean; capture?: boolean; hintId?: string; fitRequest?: number; onReady?: (ready: boolean) => void; onSnapshot?: (image: string | null) => void };
const noAnswers: readonly string[] = [];
setWorkerUrl(workerUrl);
const style: StyleSpecification = { version: 8, sources: {}, layers: [{ id: 'water', type: 'background', paint: { 'background-color': '#a9c3c9' } }] };
const duration = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350;

function fitArea(map: LibreMap, area: Area, animate = true) {
  const [west, south, east, north] = area.bounds;
  const small = map.getContainer().clientWidth < 500;
  map.fitBounds([[west, Math.max(-80, south)], [east, Math.min(80, north)]], { padding: { top: small ? 60 : 90, left: 35, right: 30, bottom: 45 }, maxZoom: 6, duration: animate ? duration() : 0 });
}

export const InteractiveAtlas = memo(function InteractiveAtlas({ area, expanded, selection, onSelect, mode = 'explore', answered = noAnswers, assisted = noAnswers, wrong, targetId, complete = false, capture = true, hintId, fitRequest = 0, onReady, onSnapshot }: Props) {
  const renderCount = useRef(0); renderCount.current++;
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LibreMap | null>(null);
  const dataRef = useRef<Geography | null>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const feedbackCanvas = useRef<HTMLCanvasElement>(null);
  const gridCanvas = useRef<HTMLCanvasElement>(null);
  const [mapInstance, setMapInstance] = useState<LibreMap | null>(null);
  const [tilesFailed, setTilesFailed] = useState(false);
  const latest = useRef({ area, expanded, onSelect, mode, answered, wrong, targetId, hintId, complete, onReady, onSnapshot });
  latest.current = { area, expanded, onSelect, mode, answered, wrong, targetId, hintId, complete, onReady, onSnapshot };
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const zoomInButton = useRef<HTMLButtonElement>(null), zoomOutButton = useRef<HTMLButtonElement>(null);
  const zoom = mapRef.current?.getZoom() ?? 0;

  useEffect(() => {
    let disposed = false;
    let map: LibreMap | undefined;
    const paintGrid = gridPainter();
    let observer: ResizeObserver | undefined;
    setPhase('loading');
    Promise.all([loadGeography(), loadCoastlines()]).then(([data, coastline]) => {
      if (disposed || !container.current) return;
      dataRef.current = data;
      try {
        map = new LibreMap({ container: container.current, style, center: [0, 15], zoom: 1, minZoom: .3, maxZoom: 12, attributionControl: false, dragRotate: false, pitchWithRotate: false, touchPitch: false, renderWorldCopies: true, cooperativeGestures: false, canvasContextAttributes: { preserveDrawingBuffer: latest.current.mode === 'quiz', antialias: true } });
        mapRef.current = map; setMapInstance(map);
        const atlas = map;
        atlas.touchZoomRotate.disableRotation();
        atlas.doubleClickZoom.disable();
        let rightDown: { x: number; y: number } | undefined;
        atlas.on('mousedown', event => { if (event.originalEvent.button === 2) rightDown = event.point; });
        atlas.on('contextmenu', event => { event.preventDefault(); if (event.originalEvent.button !== 2) return; if (rightDown && Math.hypot(event.point.x - rightDown.x, event.point.y - rightDown.y) > 5) return; atlas.zoomTo(Math.min(12, atlas.getZoom() + .5), { around: event.lngLat, duration: duration() ? 180 : 0 }); });
        atlas.keyboard.disableRotation();
        atlas.getCanvas().setAttribute('aria-label', latest.current.mode === 'quiz' ? 'Quiz atlas. Arrow keys pan; plus and minus zoom. Enter selects the country under the center crosshair; Space gives a hint.' : 'Interactive atlas. Arrow keys pan; plus and minus zoom. Click a country to explore its outline.');
        let ready = false;
        const timings: number[] = [];
        const updateGrid = () => {
          if (disposed || !ready) return;
          const started = performance.now();
          if (zoomInButton.current) zoomInButton.current.disabled = atlas.getZoom() >= 11.99;
          if (zoomOutButton.current) zoomOutButton.current.disabled = atlas.getZoom() <= .31;
          if (gridCanvas.current) paintGrid(gridCanvas.current, atlas);
          if (overlay.current) paintResolved(overlay.current, atlas, dataRef.current ?? data, latest.current.answered, latest.current.complete);
          if (feedbackCanvas.current) paintArrow(feedbackCanvas.current, atlas, data, latest.current.wrong ?? null, latest.current.targetId, !!latest.current.hintId);
          if (container.current) {
            container.current.parentElement!.dataset.mapZoom = atlas.getZoom().toFixed(2);
            container.current.parentElement!.dataset.mapCenter = `${atlas.getCenter().lng},${atlas.getCenter().lat}`;
            const elapsed = performance.now() - started;
            container.current.parentElement!.dataset.overlayMs = elapsed.toFixed(2);
            { timings.push(elapsed); if (timings.length > 120) timings.shift(); container.current.parentElement!.dataset.overlaySamples = String(timings.length); container.current.parentElement!.dataset.overlayP95 = [...timings].sort((a,b) => a-b)[Math.floor((timings.length-1)*.95)].toFixed(2); }
          }
        };
        atlas.on('render', updateGrid);
        atlas.on('webglcontextlost', () => { if (!disposed) setPhase('error'); });
        atlas.on('webglcontextrestored', () => { if (!disposed) { setPhase('ready'); updateGrid(); } });
        atlas.on('error', event => { if (!disposed && 'sourceId' in event && event.sourceId === 'openfreemap') setTilesFailed(true); });
        atlas.on('load', () => {
          if (disposed) return;
          atlas.addLayer(oceanWaves());
          atlas.addSource('places', { type: 'geojson', data, promoteId: 'id', tolerance: .25, maxzoom: 12 });
          atlas.addSource('border-lines', { type: 'geojson', data: borderLines(data), tolerance: .25 });
          atlas.addSource('coast', { type: 'geojson', data: coastline, tolerance: .03 });
          for (const [id, width, color] of [['shallows', 20, '#b7ced1'], ['waterline', 13, '#a9c3c9'], ['coastal-rim', 7, '#c7dad9']] as const) atlas.addLayer({ id, type: 'line', source: 'coast', paint: { 'line-color': color, 'line-width': width }, layout: { 'line-join': 'round' } });
          atlas.addLayer({ id: 'land', type: 'fill', source: 'places', paint: { 'fill-color': ['case', ['boolean', ['feature-state', 'selected'], false], ['coalesce', ['feature-state', 'color'], ['get', 'color']], ['boolean', ['feature-state', 'active'], false], '#ecdfb9', '#b8c8c4'], 'fill-opacity': 1 } });
          atlas.addLayer({ id: 'boundaries', type: 'line', source: 'border-lines', paint: { 'line-color': '#3a2c1d', 'line-width': 1.25, 'line-opacity': .78, 'line-dasharray': [4, 1.6, 1, 1.6] }, layout: { 'line-join': 'round' } });
          atlas.addLayer({ id: 'coast-ink', type: 'line', source: 'coast', paint: { 'line-color': '#3a2c1d', 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 1.2, 6, 1.5, 12, 2.2] } });
          atlas.addLayer({ id: 'hover-wash', type: 'fill', source: 'places', paint: { 'fill-color': '#f8f0dc', 'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], .16, 0] } });
          atlas.addLayer({ id: 'wrong-wash', type: 'fill', source: 'places', paint: { 'fill-color': '#c0362d', 'fill-opacity': ['case', ['boolean', ['feature-state', 'wrong'], false], .24, 0] } });
          atlas.addLayer({ id: 'selection-border', type: 'line', source: 'places', paint: { 'line-color': ['case', ['any', ['boolean', ['feature-state', 'hint'], false], ['boolean', ['feature-state', 'wrong'], false]], '#c0362d', '#2b2118'], 'line-width': ['case', ['boolean', ['feature-state', 'hint'], false], 3, ['case', ['boolean', ['feature-state', 'hover'], false], 2.5, 1.6]], 'line-opacity': ['case', ['any', ['boolean', ['feature-state', 'selected'], false], ['boolean', ['feature-state', 'hint'], false], ['boolean', ['feature-state', 'hover'], false], ['boolean', ['feature-state', 'wrong'], false]], 1, 0] } });
          const points = data.features.map(feature => {
            const metrics = shapeMetrics(feature);
            const opacity = Object.fromEntries(Array.from({ length: 49 }, (_, i) => [`a${i}`, aidOpacity(metrics.size, i / 4)]));
            return { type: 'Feature' as const, id: feature.id, properties: { ...feature.properties, ...opacity }, geometry: { type: 'Point' as const, coordinates: metrics.anchor } };
          });
          const placeById = new Map(data.features.map(f => [f.properties.id, f]));
          atlas.addSource('small-places', { type: 'geojson', promoteId: 'id', data: { type: 'FeatureCollection', features: points } });
          const ringOpacity = ['interpolate', ['linear'], ['zoom'], ...Array.from({ length: 49 }, (_, i) => [i / 4, ['case', ['boolean', ['feature-state', 'active'], false], ['*', .65, ['get', `a${i}`]], 0]]).flat()] as ExpressionSpecification;
          for (const [id, radius, stroke, width] of [['small-place-halos', 8, '#f4e9cd', 2], ['small-place-dots', 7, '#486874', .8]] as const) atlas.addLayer({ id, type: 'circle', source: 'small-places', paint: { 'circle-radius': radius, 'circle-color': '#f4e9cd', 'circle-opacity': 0, 'circle-stroke-color': id === 'small-place-dots' ? ['case', ['boolean', ['feature-state', 'wrong'], false], '#c0362d', ['boolean', ['feature-state', 'selected'], false], ['coalesce', ['feature-state', 'color'], stroke], stroke] : stroke, 'circle-stroke-width': width, 'circle-stroke-opacity': ringOpacity } });
          const hitAt = (x: number, y: number) => {
            const radius = window.matchMedia('(pointer: coarse)').matches ? 22 : 11;
            const aids = atlas.queryRenderedFeatures([[x - radius, y - radius], [x + radius, y + radius]], { layers: ['small-place-dots'] })
              .map(hit => placeById.get(String(hit.id))).filter((f): f is NonNullable<typeof f> => !!f && inScope(f.properties, latest.current.area, latest.current.expanded) && aidOpacity(shapeMetrics(f).size, atlas.getZoom()) > .15)
              .map(f => { const anchor = shapeMetrics(f).anchor; const point = atlas.project([anchor[0] + Math.round((atlas.getCenter().lng - anchor[0]) / 360) * 360, anchor[1]]); return { f, distance: Math.hypot(point.x - x, point.y - y) }; })
              .filter(hit => hit.distance <= radius).sort((a,b) => a.distance - b.distance);
            if (aids[0]) return aids[0].f.properties;
            return atlas.queryRenderedFeatures([x,y], { layers: ['land'] }).map(hit => placeById.get(String(hit.id))?.properties).find(p => p && inScope(p, latest.current.area, latest.current.expanded)) ?? null;
          };
          const chooseAt = (x: number, y: number, keyboard = false) => {
            const coordinate = atlas.unproject([x,y]);
            latest.current.onSelect(hitAt(x,y), keyboard, [coordinate.lng, coordinate.lat]);
          };
          atlas.on('click', event => chooseAt(event.point.x, event.point.y));
          atlas.getCanvas().addEventListener('keydown', event => { if (event.key === 'Enter' && latest.current.mode === 'quiz') { event.preventDefault(); chooseAt(atlas.getContainer().clientWidth / 2, atlas.getContainer().clientHeight / 2, true); } });
          let hovered: string | number | undefined;
          const clearHover = () => { if (hovered !== undefined) atlas.setFeatureState({ source: 'places', id: hovered }, { hover: false }); hovered = undefined; };
          atlas.on('mousemove', event => {
            const hit = hitAt(event.point.x, event.point.y);
            if (hit?.id !== hovered) { clearHover(); hovered = hit?.id; if (hovered !== undefined) atlas.setFeatureState({ source: 'places', id: hovered }, { hover: true }); }
          });
          atlas.getCanvas().addEventListener('mouseleave', clearHover);
          atlas.on('dragstart', () => { clearHover(); atlas.getCanvas().classList.add('map-dragging'); });
          atlas.on('dragend', () => atlas.getCanvas().classList.remove('map-dragging'));
          addMapDetails(atlas);
          fitArea(atlas, latest.current.area, false);
          const localReady = () => {
            if (!disposed && ['places', 'coast', 'small-places'].every(id => atlas.getSource(id) && atlas.isSourceLoaded(id))) { ready = true; setPhase('ready'); atlas.triggerRepaint(); }
          };
          atlas.on('sourcedata', localReady);
          atlas.once('idle', localReady);
          updateGrid();
        });
        observer = new ResizeObserver(() => { atlas.resize(); updateGrid(); });
        observer.observe(container.current);
      } catch { if (!disposed) setPhase('error'); }
    }).catch(() => { if (!disposed) setPhase('error'); });
    return () => { disposed = true; observer?.disconnect(); map?.remove(); mapRef.current = null; };
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
      const state = { color: mode === 'quiz' ? composite : rawColor, wrong: id === wrong?.id, active: inScope(feature.properties, area, expanded), selected: mode === 'quiz' ? answered.includes(feature.properties.id) : feature.id === selection?.place.id && inScope(feature.properties, area, expanded), hint: feature.id === hintId };
      map.setFeatureState({ source: 'places', id: feature.id }, state);
      map.setFeatureState({ source: 'small-places', id: feature.id }, state);
    }
    map.setPaintProperty('land', 'fill-color', ['case', ['boolean', ['feature-state', 'selected'], false], ['coalesce', ['feature-state', 'color'], ['get', 'color']], ['boolean', ['feature-state', 'active'], false], '#ecdfb9', complete ? '#b2c4c3' : '#bacac5']);
    const coloredData = { ...data, features: data.features.map(f => ({ ...f, properties: { ...f.properties, color: colors.get(f.properties.id) ?? f.properties.color } })) };
    dataRef.current = coloredData;
    map.triggerRepaint();
  }, [area, expanded, selection, phase, answered, complete, mode, hintId, wrong, assisted]);

  useEffect(() => { latest.current.onReady?.(phase === 'ready'); if (phase === 'error' && complete) latest.current.onSnapshot?.(null); }, [phase, complete]);
  useEffect(() => { if (fitRequest && phase === 'ready' && mapRef.current) fitArea(mapRef.current, area); }, [fitRequest, phase, area]);

  useEffect(() => {
    const map = mapRef.current, data = dataRef.current;
    if (!complete || !capture || phase !== 'ready' || !map || !data) return;
    let active = true;
    const takeSnapshot = () => {
      if (!active || !overlay.current) return;
      active = false;
      try { paintResolved(overlay.current, map, data, answered, true); latest.current.onSnapshot?.(captureMap(map, overlay.current, gridCanvas.current)); }
      catch { latest.current.onSnapshot?.(null); }
    };
    // The game covers the live map before requesting this scope-wide capture.
    fitArea(map, area, false);
    map.once('idle', takeSnapshot); map.triggerRepaint();
    const timeout = window.setTimeout(takeSnapshot, 4000);
    return () => { active = false; clearTimeout(timeout); map.off('idle', takeSnapshot); };
  }, [complete, capture, phase, answered, area]);

  useEffect(() => {
    const map = mapRef.current, feature = dataRef.current?.features.find(f => f.properties.id === hintId);
    if (phase !== 'ready' || !map || !feature) return;
    const point = shapeMetrics(feature).anchor;
    const position = map.project(point), width = map.getContainer().clientWidth, height = map.getContainer().clientHeight;
    if (position.x < 30 || position.x > width - 30 || position.y < 30 || position.y > height - 30) map.panTo(point, { duration: duration() });
  }, [hintId, phase]);

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

  return <div className="interactive-atlas" data-map-state={phase} data-react-renders={renderCount.current} data-map-zoom={zoom.toFixed(2)} style={{ '--map-pin': `url("${pinCursor}") 7 19, crosshair` } as React.CSSProperties}>
    <div className="map-canvas" ref={container} />
    <canvas ref={gridCanvas} className="coordinate-grid" aria-hidden="true" />
    <canvas ref={feedbackCanvas} className="feedback-overlay" aria-hidden="true" />
    <canvas ref={overlay} className="resolved-overlay" aria-hidden="true" />
    {mode === 'quiz' && !complete ? <span className="map-crosshair" aria-hidden="true">+</span> : null}
    {phase !== 'ready' ? <div className="atlas-fallback"><AtlasMap area={area} /><p role="status" className="paper">{phase === 'loading' ? 'Unfolding the atlas…' : 'Interactive map unavailable. The overview is still here.'}{phase === 'error' ? <button onClick={() => setAttempt(value => value + 1)}>Try again</button> : null}</p></div> : null}
    <div className="map-controls" aria-label="Atlas controls"><button ref={zoomInButton} aria-label="Zoom in" disabled={phase !== 'ready' || zoom >= 11.99} onClick={() => mapRef.current?.zoomIn({ duration: duration() })}>+</button><button ref={zoomOutButton} aria-label="Zoom out" disabled={phase !== 'ready' || zoom <= .31} onClick={() => mapRef.current?.zoomOut({ duration: duration() })}>−</button><button className="fit-control" disabled={phase !== 'ready'} onClick={() => { if (mapRef.current) fitArea(mapRef.current, area); }}>Fit area</button></div>
    <Compass map={mapInstance} onReset={() => { if (mapRef.current) fitArea(mapRef.current, area); }} />
    <details className="map-attribution"><summary aria-label="Map credits">©</summary><span><a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> · <a href="https://openmaptiles.org" target="_blank" rel="noreferrer">© OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a> · Natural Earth{tilesFailed ? ' · Detail tiles unavailable; local atlas active.' : ''}</span></details>
  </div>;
});
