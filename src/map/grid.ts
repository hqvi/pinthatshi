export function normalizeLongitude(longitude: number): number {
  return ((longitude + 180) % 360 + 360) % 360 - 180;
}
export function coordinateLabel(value: number, latitude: boolean): string {
  const normalized = latitude ? value : normalizeLongitude(value);
  const magnitude = Math.abs(normalized);
  const degrees = Number(magnitude.toFixed(2));
  return `${degrees}°${degrees === 0 ? '' : latitude ? normalized < 0 ? 'S' : 'N' : normalized < 0 ? 'W' : 'E'}`;
}
export function gridStep(span: number, pixels: number): number {
  const minimum = span * 85 / Math.max(1, pixels);
  return [.1, .2, .5, 1, 2, 5, 10, 15, 30, 45, 90].find(step => step >= minimum) ?? 90;
}
export function gridValues(minimum: number, maximum: number, step: number): number[] {
  const values: number[] = [];
  for (let n = Math.ceil(minimum / step) * step; n <= maximum + 1e-8 && values.length < 100; n += step) values.push(Number(n.toFixed(6)));
  return values;
}
// Smallest longitude interval handles island groups crossing the date line.
export function longitudeInterval(longitudes: number[]): [number, number] {
  const sorted = longitudes.map(n => ((n % 360) + 360) % 360).sort((a, b) => a - b);
  let gap = -1, start = 0;
  sorted.forEach((value, i) => {
    const next = i === sorted.length - 1 ? sorted[0] + 360 : sorted[i + 1];
    if (next - value > gap) { gap = next - value; start = (i + 1) % sorted.length; }
  });
  const west = normalizeLongitude(sorted[start]);
  return [west, west + 360 - gap];
}
