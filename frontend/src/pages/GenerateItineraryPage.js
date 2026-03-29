import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Calendar, DollarSign, Layers3, Sparkles, Zap } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { ItineraryMapProjection } from '@/components/ItineraryMapProjection';
import { PlaceImage } from '@/components/PlaceImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}`;

const travelModes = [
  {
    value: 'relaxed',
    label: 'Relaxed',
    description: 'Longer pauses, slower pacing, more breathing room between stops.',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'A polished mix of iconic spots, breaks, and easy transitions.',
  },
];

export const GenerateItineraryPage = () => {
  const { cart, cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const isQuickGenerate = location.state?.quickGenerate;

  const [days, setDays] = useState(isQuickGenerate ? 0 : 3);
  const [budget, setBudget] = useState(isQuickGenerate ? 0 : 5000);
  const [preference, setPreference] = useState(isQuickGenerate ? 'discovery' : 'balanced');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isQuickGenerate && cartCount === 0) {
      toast.info('Expert AI planner is ready. Start with your days and budget, and we will build around the strongest top picks.');
    }
  }, [isQuickGenerate, cartCount]);

  const handleGenerate = async () => {
    const parsedDays = parseInt(days, 10);
    const parsedBudget = parseInt(budget, 10);

    if (!isQuickGenerate && cartCount === 0) {
      toast.error('Please add places to cart first');
      return;
    }

    if (Number.isNaN(parsedDays) || parsedDays < 1 || parsedDays > 30) {
      toast.error('Days must be between 1 and 30');
      return;
    }

    if (Number.isNaN(parsedBudget) || parsedBudget <= 0) {
      toast.error('Budget must be greater than 0');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${API}/generate-itinerary`, {
        place_ids: isQuickGenerate ? [] : cart.map((place) => place.id),
        days: parsedDays,
        budget: parsedBudget,
        preference: isQuickGenerate ? 'discovery' : preference,
        is_auto_generated: isQuickGenerate,
      });

      localStorage.setItem('tvm-itinerary', JSON.stringify(response.data));
      toast.success('Itinerary generated successfully!');
      navigate('/itinerary');
    } catch (error) {
      console.error('Error generating itinerary:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to generate itinerary';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (cartCount === 0 && !isQuickGenerate) {
    return (
      <div className="page-shell min-h-screen aurora-page pt-28 pb-14">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel mx-auto max-w-2xl rounded-[2rem] px-8 py-12 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#004D40] text-white shadow-lg">
              <Layers3 className="h-7 w-7" />
            </div>
            <h2 className="text-3xl font-bold text-[#004D40] mb-4" style={{ fontFamily: 'Playfair Display' }}>
              Your route deck is empty
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-[#5C5C5C]">
              Add a few places to your cart, then come back here to generate a polished itinerary with an interactive route projection.
            </p>
            <Button onClick={() => navigate('/explore')} className="btn-primary" data-testid="go-explore-button">
              Explore Places
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell min-h-screen aurora-page pt-24 pb-16">
      <div className="absolute inset-x-0 top-0 h-[26rem] bg-gradient-to-b from-[#0B3F37] via-[#0E5A4F] to-transparent opacity-95" />
      <div className="absolute right-[12%] top-28 h-48 w-48 rounded-full bg-[#FFB300]/20 blur-3xl" />
      <div className="absolute left-[8%] top-40 h-56 w-56 rounded-full bg-[#66C2A3]/18 blur-3xl" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="max-w-3xl text-white">
            <div className="soft-badge mb-5 text-sm">
              <Sparkles className="h-4 w-4 text-[#FFB300]" />
              Itinerary Studio
            </div>
            <h1
              className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl"
              style={{ fontFamily: 'Playfair Display' }}
              data-testid="generate-title"
            >
              {isQuickGenerate ? 'Let an expert AI planner shape the journey.' : 'Design the route before you press generate.'}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/82 sm:text-lg">
              {isQuickGenerate
                ? 'Enter your days and budget, and the planner will use the live place database, survey-backed preferences, and top picks to build a stronger Trivandrum itinerary.'
                : `You have ${cartCount} ${cartCount === 1 ? 'place' : 'places'} selected. Adjust the trip rules and see their coordinates projected onto the routeboard.`}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="glass-panel rounded-[1.5rem] px-4 py-4 text-white">
              <div className="text-xs uppercase tracking-[0.22em] text-white/60">Days</div>
              <div className="mt-2 text-3xl font-bold" style={{ fontFamily: 'Playfair Display' }}>{days}</div>
            </div>
            <div className="glass-panel rounded-[1.5rem] px-4 py-4 text-white">
              <div className="text-xs uppercase tracking-[0.22em] text-white/60">Budget</div>
              <div className="mt-2 text-3xl font-bold" style={{ fontFamily: 'Playfair Display' }}>₹{budget}</div>
            </div>
            <div className="glass-panel rounded-[1.5rem] px-4 py-4 text-white">
              <div className="text-xs uppercase tracking-[0.22em] text-white/60">{isQuickGenerate ? 'Mode' : 'Stops'}</div>
              <div className="mt-2 text-3xl font-bold" style={{ fontFamily: 'Playfair Display' }}>
                {isQuickGenerate ? 'AI' : cartCount}
              </div>
            </div>
          </div>
        </motion.div>

        <div className={`grid items-start gap-8 ${isQuickGenerate ? 'xl:grid-cols-[0.92fr_1.08fr]' : 'xl:grid-cols-[0.88fr_1.12fr]'}`}>
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-panel rounded-[2rem] p-8"
          >
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#004D40]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#004D40]">
                <Layers3 className="h-3.5 w-3.5" />
                Trip controls
              </div>
              <h2 className="mt-4 text-3xl font-bold text-[#004D40]" style={{ fontFamily: 'Playfair Display' }}>
                Fine-tune the journey
              </h2>
              <p className="mt-2 text-[#5C5C5C]">
                Every adjustment updates the mood of the itinerary, from slower heritage wandering to a tighter city sprint.
              </p>
            </div>

            <div className="space-y-7">
              <div className="rounded-[1.5rem] border border-[#E5DED0] bg-white/80 p-5">
                <Label htmlFor="days" className="mb-3 flex items-center gap-2 text-[#004D40] font-semibold">
                  <Calendar className="h-5 w-5" />
                  Number of Days
                </Label>
                <Input
                  id="days"
                  type="number"
                  min="0"
                  max="30"
                  value={days}
                  onChange={(event) => setDays(event.target.value)}
                  className="rounded-2xl border-[#E3DBCC] bg-white/80 py-6 text-lg"
                />
              </div>

              <div className="rounded-[1.5rem] border border-[#E5DED0] bg-white/80 p-5">
                <Label htmlFor="budget" className="mb-3 flex items-center gap-2 text-[#004D40] font-semibold">
                  <DollarSign className="h-5 w-5" />
                  Total Budget
                </Label>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  className="rounded-2xl border-[#E3DBCC] bg-white/80 py-6 text-lg"
                />
              </div>

              {!isQuickGenerate && (
                <div className="rounded-[1.5rem] border border-[#E5DED0] bg-white/80 p-5">
                  <Label className="mb-4 flex items-center gap-2 text-[#004D40] font-semibold">
                    <Zap className="h-5 w-5" />
                    Travel preference
                  </Label>
                  <RadioGroup value={preference} onValueChange={setPreference} className="space-y-3">
                    {travelModes.map((mode) => (
                      <div
                        key={mode.value}
                        className={`rounded-[1.35rem] border p-4 transition-all ${
                          preference === mode.value
                            ? 'border-[#004D40] bg-[#004D40]/6 shadow-sm'
                            : 'border-[#E5DED0] bg-white hover:border-[#004D40]/35'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <RadioGroupItem value={mode.value} id={mode.value} className="mt-1" />
                          <Label htmlFor={mode.value} className="flex-1 cursor-pointer">
                            <div className="text-base font-semibold text-[#1A1A1A]">{mode.label}</div>
                            <div className="mt-1 text-sm text-[#5C5C5C]">{mode.description}</div>
                          </Label>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="btn-primary w-full py-6 text-lg"
              >
                {loading ? 'Building your route...' : (isQuickGenerate ? 'Generate with Expert AI' : 'Generate itinerary')}
              </Button>
            </div>

            {!isQuickGenerate && (
              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#004D40]" style={{ fontFamily: 'Playfair Display' }}>
                    Selected highlights
                  </h3>
                  <span className="rounded-full bg-[#004D40]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#004D40]">
                    {cartCount} plotted
                  </span>
                </div>
                <div className="space-y-3">
                  {cart.slice(0, 4).map((place) => (
                    <div key={place.id} className="flex items-center gap-4 rounded-[1.5rem] border border-[#E5DED0] bg-white/85 p-4">
                      <PlaceImage place={place} className="h-16 w-16 rounded-2xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-semibold text-[#1A1A1A]">{place.name}</h4>
                        <p className="mt-1 text-xs text-[#5C5C5C]">{place.area}</p>
                      </div>
                      <div className="rounded-full bg-[#FFB300]/16 px-3 py-1 text-xs font-semibold capitalize text-[#6D4E00]">
                        {place.category}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.22 }}
            className="glass-panel rounded-[2rem] p-7 sm:p-8"
          >
            <ItineraryMapProjection places={cart} quickMode={Boolean(isQuickGenerate)} />
          </motion.div>
        </div>
      </div>
    </div>
  );
};
