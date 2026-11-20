import { useEffect, useRef, useState } from 'react';
import { Map as LibreMap, Marker, setWorkerUrl, type StyleSpecification } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Area } from '../data/areas';
import { loadGeography, inScope, type Geography, type Place } from '../map/geography';
import { coordinateLabel, gridStep, gridValues, longitudeInterval } from '../map/grid';
import { AtlasMap } from './AtlasMap';

export type Selection = { place: Place; focus: boolean; revision: number } | null;
type Props = { area: Area; expanded: boolean; selection: Selection; onSelect: (place: Place | null) => void };
type Tick = { position: number; value: number };
type Grid = { width: number; height: number; longitude: Tick[]; latitude: Tick[] };
const emptyGrid: Grid = { width: 0, height: 0, longitude: [], latitude: [] };
setWorkerUrl(workerUrl);
const style: StyleSpecification = { version: 8, sources: {}, layers: [{ id: 'water', type: 'background', paint: { 'background-color': '#a9c3c9' } }] };
const duration = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350;

function oceanPattern() {
  const width = 128, height = 128, data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) data.set([169, 195, 201, 255], i * 4);
  for (let i = 0; i < 37; i++) {
    const x = (i * 47 + 11) % 121, y = (i * 29 + 7) % 125;
    for (let dx = 0; dx < 6; dx++) data.set([151, 181, 188, 255], ((y + (dx === 2 || dx === 3 ? 1 : 0)) * width + x + dx) * 4);
  }
  return { width, height, data };
}

function fitArea(map: LibreMap, area: Area, animate = true) {
  const [west, south, east, north] = area.bounds;
  const small = map.getContainer().clientWidth < 500;
  map.fitBounds([[west, Math.max(-80, south)], [east, Math.min(80, north)]], { padding: { top: small ? 60 : 90, left: 35, right: 30, bottom: 45 }, maxZoom: 6, duration: animate ? duration() : 0 });
}

export function InteractiveAtlas({ area, expanded, selection, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LibreMap | null>(null);
  const dataRef = useRef<Geography | null>(null);
  const latest = useRef({ area, expanded, onSelect });
  latest.current = { area, expanded, onSelect };
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
    loadGeography().then(data => {
      if (disposed || !container.current) return;
      dataRef.current = data;
      try {
        map = new LibreMap({ container: container.current, style, center: [0, 15], zoom: 1, minZoom: .3, maxZoom: 9, attributionControl: false, dragRotate: false, pitchWithRotate: false, touchPitch: false, renderWorldCopies: true, cooperativeGestures: true });
        mapRef.current = map;
        const atlas = map;
        atlas.touchZoomRotate.disableRotation();
        atlas.keyboard.disableRotation();
        atlas.getCanvas().setAttribute('aria-label', 'Interactive atlas. Arrow keys pan; plus and minus zoom. Select places using the searchable list.');
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
          });
        };
        atlas.on('move', updateGrid);
        atlas.on('resize', updateGrid);
        atlas.on('webglcontextlost', () => { if (!disposed) setPhase('error'); });
        atlas.on('webglcontextrestored', () => { if (!disposed) { setPhase('ready'); updateGrid(); } });
        atlas.on('error', () => { if (!disposed) setPhase('error'); });
        atlas.on('load', () => {
          if (disposed) return;
          atlas.addImage('ocean-waves', oceanPattern());
          atlas.setPaintProperty('water', 'background-pattern', 'ocean-waves');
          atlas.addSource('places', { type: 'geojson', data, promoteId: 'id', tolerance: .2, maxzoom: 9 });
          for (const [id, width, color] of [['shallows', 10, '#b7ced1'], ['waterline', 7, '#a9c3c9'], ['coastal-rim', 4, '#c7dad9']] as const) atlas.addLayer({ id, type: 'line', source: 'places', paint: { 'line-color': color, 'line-width': width }, layout: { 'line-join': 'round' } });
          atlas.addLayer({ id: 'land', type: 'fill', source: 'places', paint: { 'fill-color': ['case', ['boolean', ['feature-state', 'selected'], false], ['get', 'color'], ['boolean', ['feature-state', 'active'], false], '#ecdfb9', '#b6c5bd'], 'fill-opacity': 1 } });
          atlas.addLayer({ id: 'boundaries', type: 'line', source: 'places', paint: { 'line-color': '#3a2c1d', 'line-width': .75, 'line-opacity': .75 }, layout: { 'line-join': 'round' } });
          atlas.addLayer({ id: 'selection-border', type: 'line', source: 'places', paint: { 'line-color': '#2b2118', 'line-width': 1.6, 'line-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 1, 0] } });
          // All places get a source anchor, but only small shapes get an aid marker.
          const points = data.features.filter(feature => {
            const rings = feature.geometry.type === 'Polygon' ? feature.geometry.coordinates : feature.geometry.coordinates.flat();
            const vertices = rings.flat();
            const [west, east] = longitudeInterval(vertices.map(p => p[0]));
            const ys = vertices.map(p => p[1]);
            return (east - west) * (Math.max(...ys) - Math.min(...ys)) < .65;
          }).map(feature => ({ type: 'Feature' as const, id: feature.id, properties: feature.properties, geometry: { type: 'Point' as const, coordinates: [feature.properties.longitude, feature.properties.latitude] } }));
          atlas.addSource('small-places', { type: 'geojson', promoteId: 'id', data: { type: 'FeatureCollection', features: points } });
          atlas.addLayer({ id: 'small-place-dots', type: 'circle', source: 'small-places', paint: { 'circle-radius': 4.5, 'circle-color': ['case', ['boolean', ['feature-state', 'selected'], false], ['get', 'color'], '#f8f0dc'], 'circle-stroke-color': '#3a2c1d', 'circle-stroke-width': 1, 'circle-opacity': ['case', ['boolean', ['feature-state', 'active'], false], .9, 0], 'circle-stroke-opacity': ['case', ['boolean', ['feature-state', 'active'], false], .9, 0] } });
          atlas.on('click', event => {
            const features = atlas.queryRenderedFeatures([[event.point.x - 5, event.point.y - 5], [event.point.x + 5, event.point.y + 5]], { layers: ['small-place-dots', 'land'] });
            const places = features.map(f => data.features.find(place => place.id === f.id)?.properties).filter((p): p is Place => !!p);
            const place = places.find(p => inScope(p, latest.current.area, latest.current.expanded));
            latest.current.onSelect(place ?? null);
          });
          atlas.on('mousemove', event => {
            atlas.getCanvas().style.cursor = atlas.queryRenderedFeatures(event.point, { layers: ['land', 'small-place-dots'] }).some(f => {
              const place = data.features.find(p => p.id === f.id)?.properties;
              return place && inScope(place, latest.current.area, latest.current.expanded);
            }) ? 'pointer' : '';
          });
          fitArea(atlas, latest.current.area, false);
          atlas.once('idle', () => { if (!disposed) setPhase('ready'); });
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
    for (const feature of data.features) {
      const state = { active: inScope(feature.properties, area, expanded), selected: feature.id === selection?.place.id && inScope(feature.properties, area, expanded) };
      map.setFeatureState({ source: 'places', id: feature.id }, state);
      map.setFeatureState({ source: 'small-places', id: feature.id }, state);
    }
  }, [area, expanded, selection, phase]);

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

  return <div className="interactive-atlas" data-map-state={phase} data-map-zoom={zoom.toFixed(2)}>
    <div className="map-canvas" ref={container} />
    {phase !== 'ready' ? <div className="atlas-fallback"><AtlasMap area={area} /><p role="status" className="paper">{phase === 'loading' ? 'Unfolding the atlas…' : 'Interactive map unavailable. The overview is still here.'}{phase === 'error' ? <button onClick={() => setAttempt(value => value + 1)}>Try again</button> : null}</p></div> : null}
    {phase === 'ready' ? <svg className="coordinate-grid" viewBox={`0 0 ${grid.width} ${grid.height}`} aria-hidden="true">
      <g className="graticule-lines">{grid.longitude.map(t => <line key={`x${t.value}`} x1={t.position} x2={t.position} y1="0" y2={grid.height} />)}{grid.latitude.map(t => <line key={`y${t.value}`} x1="0" x2={grid.width} y1={t.position} y2={t.position} />)}</g>
      <g className="coordinate-labels">{grid.longitude.map(t => <text key={`x${t.value}`} x={t.position} y={grid.height - 7} textAnchor="middle">{coordinateLabel(t.value, false)}</text>)}{grid.latitude.map(t => <text key={`y${t.value}`} x="5" y={t.position + 4}>{coordinateLabel(t.value, true)}</text>)}</g>
    </svg> : null}
    <div className="map-controls" aria-label="Atlas controls"><button aria-label="Zoom in" disabled={phase !== 'ready' || zoom >= 8.99} onClick={() => mapRef.current?.zoomIn({ duration: duration() })}>+</button><button aria-label="Zoom out" disabled={phase !== 'ready' || zoom <= .31} onClick={() => mapRef.current?.zoomOut({ duration: duration() })}>−</button><button className="fit-control" disabled={phase !== 'ready'} onClick={() => { if (mapRef.current) fitArea(mapRef.current, area); }}>Fit area</button></div>
    <span className="map-credit">Natural Earth · MapLibre</span>
  </div>;
}
