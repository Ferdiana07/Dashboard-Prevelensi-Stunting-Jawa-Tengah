import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson'

export const YEARS = [2019, 2021, 2022] as const
export type Year = (typeof YEARS)[number]
export type AreaType = 'Kabupaten' | 'Kota'
export type RegionFilter = 'all' | 'Kabupaten' | 'Kota' | string
export interface StuntingRow {
  code: string
  name: string
  type: AreaType
  year: Year
  prevalence: number
}
export interface AreaProperties { kode_wilayah: string; wilayah: string; nama_sumber?: string }
export type Boundaries = FeatureCollection<Polygon | MultiPolygon, AreaProperties>
export interface Dataset { rows: StuntingRow[]; boundaries: Boundaries }
