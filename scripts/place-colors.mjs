// One deterministic palette assignment for geometry, plaques, lists, and thumbnails.
const palette = ['#f6b91e', '#687ce3', '#85bd35', '#20afa4', '#ef91c6', '#ff7c32', '#a461dd', '#fa5c7b'];
export const colorFor = id => palette[[...id].reduce((hash, c) => hash * 31 + c.charCodeAt(0), 0) % palette.length];
