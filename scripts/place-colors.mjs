// One deterministic palette assignment for geometry, plaques, lists, and thumbnails.
const palette = ['#ff5e7e', '#ffb81c', '#00a99d', '#4f7cff', '#a35cff', '#ff7a2f', '#7dcc3a', '#ff8fd0'];
export const colorFor = id => palette[[...id].reduce((hash, c) => hash * 31 + c.charCodeAt(0), 0) % palette.length];
