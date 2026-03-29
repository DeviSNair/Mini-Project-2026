import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock3, MapPin, Route, Sparkles } from 'lucide-react';

const PREVIEW_PLACES = [
  {
    id: 'preview-east-fort',
    name: 'East Fort Circuit',
    area: 'City Core',
    category: 'heritage',
    duration: 1.5,
    coordinates: [8.486, 76.95],
  },
  {
    id: 'preview-kovalam',
    name: 'Kovalam Coast',
    area: 'Southern Shore',
    category: 'beach',
    duration: 2.5,
    coordinates: [8.401, 76.979],
  },
  {
    id: 'preview-varkala',
    name: 'Varkala Cliff',
    area: 'Northern Edge',
    category: 'nature',
    duration: 2,
    coordinates: [8.738, 76.716],
  },
  {
    id: 'preview-ponmudi',
    name: 'Ponmudi Ridge',
    area: 'Hill Trail',
    category: 'nature',
    duration: 4,
    coordinates: [8.762, 77.109],
  },
];

const FALLBACK_POSITIONS = [
  { x: 22, y: 30 },
  { x: 47, y: 58 },
  { x: 69, y: 36 },
  { x: 36, y: 76 },
  { x: 58, y: 18 },
  { x: 78, y: 64 },
];

const buildProjectedPlaces = (places) => {
  const validPlaces = (places.length ? places : PREVIEW_PLACES).slice(0, 6);
  const coordinates = validPlaces
    .map((place) => place.coordinates)
    .filter((coords) => Array.isArray(coords) && coords.length === 2);

  if (coordinates.length === 0) {
    return validPlaces.map((place, index) => ({
      ...place,
      projectedX: FALLBACK_POSITIONS[index % FALLBACK_POSITIONS.length].x,
      projectedY: FALLBACK_POSITIONS[index % FALLBACK_POSITIONS.length].y,
    }));
  }

  const latitudes = coordinates.map(([lat]) => lat);
  const longitudes = coordinates.map(([, lng]) => lng);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latSpan = maxLat - minLat || 0.08;
  const lngSpan = maxLng - minLng || 0.08;

  return validPlaces.map((place, index) => {
    if (!Array.isArray(place.coordinates) || place.coordinates.length !== 2) {
      return {
        ...place,
        projectedX: FALLBACK_POSITIONS[index % FALLBACK_POSITIONS.length].x,
        projectedY: FALLBACK_POSITIONS[index % FALLBACK_POSITIONS.length].y,
      };
    }

    const [lat, lng] = place.coordinates;
    return {
      ...place,
      projectedX: 18 + ((lng - minLng) / lngSpan) * 64,
      projectedY: 18 + (1 - (lat - minLat) / latSpan) * 60,
    };
  });
};

export const ItineraryMapProjection = ({ places = [], quickMode = false }) => {
  const projectedPlaces = buildProjectedPlaces(places);
  const [activePlaceId, setActivePlaceId] = useState(projectedPlaces[0]?.id || null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setActivePlaceId(projectedPlaces[0]?.id || null);
  }, [projectedPlaces[0]?.id]);

  const activePlace = projectedPlaces.find((place) => place.id === activePlaceId) || projectedPlaces[0];
  const pointString = projectedPlaces
    .map((place) => `${place.projectedX},${place.projectedY}`)
    .join(' ');

  const handlePointerMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 18;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -14;
    setTilt({ x, y });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#004D40]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#004D40]">
            <Sparkles className="h-3.5 w-3.5" />
            Route Projection
          </div>
          <h3 className="mt-3 text-2xl font-bold text-[#0B3F37]" style={{ fontFamily: 'Playfair Display' }}>
            {quickMode ? 'AI route deck' : 'Your trip in 3D'}
          </h3>
          <p className="mt-2 max-w-md text-sm text-[#5C5C5C]">
            Tilt the board with your cursor and hover a marker to inspect each stop in the route cluster.
          </p>
        </div>
        <div className="map-location-card rounded-2xl px-4 py-3 text-right">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5C5C5C]">Stops plotted</div>
          <div className="mt-1 text-3xl font-bold text-[#004D40]" style={{ fontFamily: 'Playfair Display' }}>
            {projectedPlaces.length}
          </div>
        </div>
      </div>

      <div className="map-stage" onMouseMove={handlePointerMove} onMouseLeave={() => setTilt({ x: 0, y: 0 })}>
        <motion.div
          className="map-board"
          animate={{
            rotateX: 58 + tilt.y,
            rotateY: tilt.x,
            rotateZ: -28,
            y: -2,
          }}
          transition={{ type: 'spring', stiffness: 90, damping: 14 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="map-river" />
          <div className="map-path" />
          <div className="map-path path-two" />

          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline
              fill="none"
              points={pointString}
              stroke="rgba(0, 77, 64, 0.25)"
              strokeDasharray="5 5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>

          <div className="absolute left-6 top-6 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#004D40] shadow-sm">
            Coastal Matrix
          </div>
          <div className="absolute bottom-6 right-6 rounded-full bg-[#004D40] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm">
            Live itinerary layer
          </div>

          {projectedPlaces.map((place, index) => {
            const isActive = place.id === activePlace?.id;
            return (
              <motion.button
                key={place.id}
                type="button"
                className="map-marker"
                style={{ left: `${place.projectedX}%`, top: `${place.projectedY}%` }}
                onMouseEnter={() => setActivePlaceId(place.id)}
                animate={{
                  y: isActive ? -10 : -4,
                  scale: isActive ? 1.08 : 0.96,
                }}
                transition={{ type: 'spring', stiffness: 180, damping: 15, delay: index * 0.04 }}
              >
                <div className="floating-pulse rounded-full bg-white/90 p-1.5 shadow-lg">
                  <MapPin className={`h-6 w-6 ${isActive ? 'text-[#FF7A00]' : 'text-[#004D40]'}`} fill="currentColor" />
                </div>
                <div className="mt-2 rounded-full bg-[#0B3F37] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-lg">
                  {index + 1}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {activePlace && (
        <motion.div
          key={activePlace.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="map-location-card rounded-[1.75rem] p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5C5C5C]">Focused stop</div>
              <h4 className="mt-2 text-2xl font-bold text-[#0B3F37]" style={{ fontFamily: 'Playfair Display' }}>
                {activePlace.name}
              </h4>
              <p className="mt-1 flex items-center gap-2 text-sm text-[#5C5C5C]">
                <MapPin className="h-4 w-4 text-[#FF7A00]" />
                {activePlace.area}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <div className="rounded-2xl bg-[#004D40]/8 px-3 py-2 text-[#004D40]">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#5C5C5C]">Category</div>
                <div className="mt-1 font-semibold capitalize">{activePlace.category}</div>
              </div>
              <div className="rounded-2xl bg-[#FFB300]/12 px-3 py-2 text-[#6D4E00]">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#8A6C1B]">Duration</div>
                <div className="mt-1 flex items-center gap-1 font-semibold">
                  <Clock3 className="h-4 w-4" />
                  {activePlace.duration}h
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#0B3F37] px-4 py-3 text-sm text-white">
            <Route className="h-4 w-4 text-[#FFB300]" />
            {quickMode
              ? 'AI mode will bias toward iconic anchors and hidden clusters across the city.'
              : 'Markers are plotted from the selected locations in your cart using their saved coordinates.'}
          </div>
        </motion.div>
      )}
    </div>
  );
};
