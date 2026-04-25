/**
 * Static metadata for the 7 Indian Ocean zones used in NEERVA.
 * These coordinates match exactly what OceanHeatMap.tsx uses for positioning.
 */
const ZONES = [
  {
    id: 'zone1',
    name: 'Arabian Sea North',
    lat: 20.5,
    lng: 69.2,
    baseTempC: 26.2,          // fallback if API is unavailable
    seasonalPeak: [12, 1, 2], // months of peak fish activity
  },
  {
    id: 'zone2',
    name: 'Arabian Sea Central',
    lat: 18.0,
    lng: 70.1,
    baseTempC: 29.0,
    seasonalPeak: [11, 12, 1],
  },
  {
    id: 'zone3',
    name: 'Bay of Bengal',
    lat: 16.5,
    lng: 82.3,
    baseTempC: 29.5,
    seasonalPeak: [10, 11, 12],
  },
  {
    id: 'zone4',
    name: 'Indian Ocean South',
    lat: 8.2,
    lng: 76.8,
    baseTempC: 27.0,
    seasonalPeak: [1, 2, 3],
  },
  {
    id: 'zone5',
    name: 'Lakshadweep Sea',
    lat: 12.3,
    lng: 71.7,
    baseTempC: 30.5,
    seasonalPeak: [2, 3, 4],
  },
  {
    id: 'zone6',
    name: 'Gulf of Mannar',
    lat: 9.1,
    lng: 79.2,
    baseTempC: 28.3,
    seasonalPeak: [10, 11, 12],
  },
  {
    id: 'zone7',
    name: 'Andaman Sea',
    lat: 11.5,
    lng: 92.8,
    baseTempC: 30.0,
    seasonalPeak: [11, 12, 1],
  },
];

module.exports = ZONES;
