import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, Download, MapPinned, ShoppingCart, Sparkles } from 'lucide-react';
import { PlaceImage } from '@/components/PlaceImage';
import { Button } from '@/components/ui/button';

const featureCards = [
  {
    icon: Compass,
    title: 'Explore With Intent',
    description: 'Move through standout temples, beaches, food stops, and quieter corners without feeling dropped into a cluttered directory.',
  },
  {
    icon: ShoppingCart,
    title: 'Shape The Shortlist',
    description: 'Save only the stops that fit your trip so the itinerary begins with real priorities instead of guesswork.',
  },
  {
    icon: MapPinned,
    title: 'Preview The Journey',
    description: 'See the route structure before generation so the flow feels tangible rather than buried in blocks of text.',
  },
  {
    icon: Download,
    title: 'Take It With You',
    description: 'Export the final plan once it feels balanced and keep it ready for the day you are actually out exploring.',
  },
];

const journeyStats = [
  { value: '42', label: 'Curated places' },
  { value: '11', label: 'Experience types' },
  { value: 'AI', label: 'Trip planning mode' },
];

const previewPlaces = [
  {
    name: 'Sree Padmanabhaswamy Temple',
    area: 'East Fort',
    category: 'temple',
    blurb: 'Anchor your route with a heritage icon in the city core.',
  },
  {
    name: 'Kovalam Beach',
    area: 'Southern Coast',
    category: 'beach',
    blurb: 'Balance the city with shoreline light, cafes, and sunset energy.',
  },
  {
    name: 'Ponmudi Hills',
    area: 'Hill Escape',
    category: 'nature',
    blurb: 'Stretch the itinerary upward with cooler air and winding landscapes.',
  },
];

export const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-shell min-h-screen aurora-page">
      <section className="gradient-hero relative overflow-hidden pt-32 pb-20 text-white" data-testid="hero-section">
        <div className="absolute inset-0 warm-glow" />
        <div className="absolute left-[6%] top-28 hidden h-24 w-24 rounded-full border border-white/10 bg-white/5 blur-[1px] lg:block" />
        <div className="absolute right-[12%] top-44 hidden h-40 w-40 rounded-full bg-[#FFB300]/10 blur-3xl lg:block" />

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl"
            >
              <div className="soft-badge mb-6 text-sm">
                <Sparkles className="h-4 w-4 text-[#FFB300]" />
                Scenic route planning for Thiruvananthapuram
              </div>
              <h1
                className="text-5xl font-bold leading-[0.95] sm:text-6xl lg:text-7xl"
                style={{ fontFamily: 'Playfair Display' }}
                data-testid="hero-title"
              >
                Plan a richer trip,
                <br />
                before the trip begins.
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-white/84 sm:text-xl">
                Trivandrum Trails turns scattered ideas into a route you can actually feel: discover standout places, narrow the shortlist, and generate a polished itinerary with less visual noise.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  onClick={() => navigate('/explore')}
                  className="btn-primary flex items-center gap-2 text-lg"
                  data-testid="explore-button"
                >
                  Start Exploring
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button
                  onClick={() => navigate('/generate', { state: { quickGenerate: true } })}
                  className="btn-secondary flex items-center gap-2 border-white/20 bg-white/10 text-lg text-white hover:bg-white hover:text-[#004D40]"
                  data-testid="ai-generate-button"
                >
                  <Sparkles className="h-5 w-5" />
                  Open Route Studio
                </Button>
              </div>

              <div className="mt-12 grid max-w-2xl gap-3 sm:grid-cols-3">
                {journeyStats.map((stat) => (
                  <div key={stat.label} className="hero-stat-card rounded-[1.6rem] px-5 py-4">
                    <div className="text-3xl font-bold text-[#0B3F37] sm:text-4xl" style={{ fontFamily: 'Playfair Display' }}>
                      {stat.value}
                    </div>
                    <div className="mt-2 text-[11px] uppercase tracking-[0.22em] text-[#5C5C5C] sm:text-xs">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.8 }}
              className="glass-panel rounded-[2.2rem] p-4 text-[#1A1A1A] sm:p-5 lg:p-6"
            >
              <div className="overflow-hidden rounded-[1.8rem] border border-white/20">
                <PlaceImage place={previewPlaces[0]} className="h-72 w-full object-cover sm:h-80 lg:h-[25rem]" />
              </div>

              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-[#5C5C5C]">Homepage flow</div>
                  <h3 className="mt-2 text-3xl font-bold text-[#004D40]" style={{ fontFamily: 'Playfair Display' }}>
                    One strong visual,
                    <br />
                    one calmer route in.
                  </h3>
                </div>
                <div className="rounded-full bg-[#004D40] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                  Refined
                </div>
              </div>

              <p className="mt-4 max-w-xl text-sm leading-6 text-[#5C5C5C] sm:text-base">
                Here is a clean summary of what the planner helps you do next.
              </p>

              <div className="mt-6 grid gap-3">
                {previewPlaces.map((place, index) => (
                  <div
                    key={place.name}
                    className="rounded-[1.45rem] border border-[#E8E0D1] bg-white/78 px-4 py-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#004D40] text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.22em] text-[#5C5C5C]">{place.area}</div>
                        <h4 className="mt-1 text-lg font-bold text-[#0B3F37]" style={{ fontFamily: 'Playfair Display' }}>
                          {place.name}
                        </h4>
                        <p className="mt-1 text-sm leading-6 text-[#5C5C5C]">{place.blurb}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20" data-testid="highlights-section">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mb-12 max-w-3xl text-center"
          >
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-[#004D40]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#004D40]">
              <Sparkles className="h-3.5 w-3.5" />
              Signature stops
            </div>
            <h2
              className="mt-5 text-4xl font-bold text-[#004D40] sm:text-5xl"
              style={{ fontFamily: 'Playfair Display' }}
            >
              Three anchors are enough to start imagining the trip
            </h2>
            <p className="mt-4 text-lg text-[#5C5C5C]">
              
            </p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-3">
            {previewPlaces.map((place, index) => (
              <motion.article
                key={place.name}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="glass-panel overflow-hidden rounded-[2rem] text-[#1A1A1A]"
              >
                <PlaceImage place={place} className="h-64 w-full object-cover" />
                <div className="p-6">
                  <div className="text-xs uppercase tracking-[0.22em] text-[#5C5C5C]">{place.area}</div>
                  <h3 className="mt-3 text-2xl font-bold text-[#004D40]" style={{ fontFamily: 'Playfair Display' }}>
                    {place.name}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#5C5C5C]">{place.blurb}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-glow py-24" data-testid="features-section">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mb-14 max-w-3xl text-center"
          >
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-[#004D40]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#004D40]">
              <Sparkles className="h-3.5 w-3.5" />
              Better planning flow
            </div>
            <h2
              className="mt-5 text-4xl font-bold text-[#004D40] sm:text-5xl"
              style={{ fontFamily: 'Playfair Display' }}
            >
              A clearer path from browsing to planning
            </h2>
            <p className="mt-4 text-lg text-[#5C5C5C]">
             
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            {featureCards.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="feature-card rounded-[1.85rem] p-7"
                data-testid={`feature-${index}`}
              >
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#004D40] text-white shadow-lg">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-[#0B3F37]" style={{ fontFamily: 'Playfair Display' }}>
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#5C5C5C]">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24" data-testid="cta-section">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel rounded-[2.4rem] px-8 py-10 text-center sm:px-12">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-[#FFB300]/16 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#7A5900]">
              <Sparkles className="h-3.5 w-3.5" />
              Ready to plan
            </div>
            <h2
              className="mt-5 text-4xl font-bold text-[#004D40] sm:text-5xl"
              style={{ fontFamily: 'Playfair Display' }}
            >
              Open the route studio when you want to turn interest into an itinerary
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[#5C5C5C]">
              Browse first, or jump straight into AI mode once you already know the kinds of places you want the trip to hold.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button onClick={() => navigate('/explore')} className="btn-primary text-lg px-8 py-6" data-testid="cta-explore-button">
                Explore Now
              </Button>
              <Button onClick={() => navigate('/generate', { state: { quickGenerate: true } })} className="btn-secondary text-lg px-8 py-6">
                Try AI Generate
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
