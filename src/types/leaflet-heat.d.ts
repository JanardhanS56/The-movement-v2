import 'leaflet'

declare module 'leaflet' {
  export interface HeatLatLngTuple extends Array<number> {
    0: number
    1: number
    2?: number
  }

  export interface HeatMapOptions {
    minOpacity?: number
    maxZoom?: number
    max?: number
    radius?: number
    blur?: number
    gradient?: Record<number, string>
  }

  export function heatLayer(
    latlngs: Array<[number, number, number?] | [number, number] | HeatLatLngTuple>,
    options?: HeatMapOptions
  ): Layer
}

declare module 'leaflet.heat'
