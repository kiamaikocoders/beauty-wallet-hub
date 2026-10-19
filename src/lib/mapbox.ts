export const MAPBOX_TOKEN = import.meta.env["VITE_MAPBOX_ACCESS_TOKEN"] ?? "";

export const MAP_STYLE_LIGHT = "mapbox://styles/mapbox/streets-v12";

export const NAIROBI = { longitude: 36.8219, latitude: -1.2921, zoom: 10.4 } as const;

/** Used when the browser will not share a position. Nairobi CBD. */
export const NAIROBI_CBD = { latitude: -1.2864, longitude: 36.8172 } as const;
