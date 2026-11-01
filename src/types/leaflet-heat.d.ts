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

  export interface HeatLayer extends Layer {
    setLatLngs(
      latlngs: Array<[number, number, number?] | [number, number] | HeatLatLngTuple>
    ): this
    addLatLng(
      latlng: [number, number, number?] | [number, number] | HeatLatLngTuple
    ): this
    setOptions(options: HeatMapOptions): this
    redraw(): this
  }

  export function heatLayer(
    latlngs: Array<[number, number, number?] | [number, number] | HeatLatLngTuple>,
    options?: HeatMapOptions
  ): HeatLayer
}

declare module 'leaflet.heat'
