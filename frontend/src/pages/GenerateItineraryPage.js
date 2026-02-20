import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, DollarSign, Zap } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const GenerateItineraryPage = () => {
  const { cart, cartCount } = useCart();
  const navigate = useNavigate();
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState(5000);
  const [preference, setPreference] = useState('balanced');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (cartCount === 0) {
      toast.error('Please add places to cart first');
      return;
    }

    if (days < 1 || days > 30) {
      toast.error('Days must be between 1 and 30');
      return;
    }

    if (budget < 0) {
      toast.error('Please enter a valid budget');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API}/generate-itinerary`, {
        place_ids: cart.map((p) => p.id),
        days: parseInt(days),
        budget: parseInt(budget),
        preference,
      });

      // Store itinerary in localStorage
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

  if (cartCount === 0) {
    return (
      <div className="min-h-screen pt-24 pb-12 bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#004D40] mb-4" style={{ fontFamily: 'Playfair Display' }}>
            Your cart is empty
          </h2>
          <p className="text-[#5C5C5C] mb-8">Add places to your cart to generate an itinerary</p>
          <Button onClick={() => navigate('/explore')} className="btn-primary" data-testid="go-explore-button">
            Explore Places
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#FDFBF7]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1
            className="text-4xl sm:text-5xl font-bold text-[#004D40] mb-4"
            style={{ fontFamily: 'Playfair Display' }}
            data-testid="generate-title"
          >
            Generate Your Itinerary
          </h1>
          <p className="text-lg text-[#5C5C5C]">
            You have {cartCount} {cartCount === 1 ? 'place' : 'places'} in your cart. Let's plan your perfect trip!
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-8 card-shadow"
          >
            <h2 className="text-2xl font-bold text-[#004D40] mb-6" style={{ fontFamily: 'Playfair Display' }}>
              Trip Details
            </h2>

            <div className="space-y-6">
              {/* Days */}
              <div>
                <Label htmlFor="days" className="flex items-center gap-2 text-[#004D40] font-semibold mb-2">
                  <Calendar className="w-5 h-5" />
                  Number of Days
                </Label>
                <Input
                  id="days"
                  type="number"
                  min="1"
                  max="30"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="text-lg py-6"
                  data-testid="days-input"
                />
                <p className="text-sm text-[#5C5C5C] mt-1">How many days will you be traveling?</p>
              </div>

              {/* Budget */}
              <div>
                <Label htmlFor="budget" className="flex items-center gap-2 text-[#004D40] font-semibold mb-2">
                  <DollarSign className="w-5 h-5" />
                  Total Budget (₹)
                </Label>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="text-lg py-6"
                  data-testid="budget-input"
                />
                <p className="text-sm text-[#5C5C5C] mt-1">Your total budget for the trip</p>
              </div>

              {/* Preference */}
              <div>
                <Label className="flex items-center gap-2 text-[#004D40] font-semibold mb-3">
                  <Zap className="w-5 h-5" />
                  Travel Preference
                </Label>
                <RadioGroup value={preference} onValueChange={setPreference} data-testid="preference-radio">
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-[#FDFBF7] transition-colors">
                    <RadioGroupItem value="relaxed" id="relaxed" data-testid="preference-relaxed" />
                    <Label htmlFor="relaxed" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Relaxed</div>
                      <div className="text-sm text-[#5C5C5C]">Fewer places, more time to enjoy</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-[#FDFBF7] transition-colors">
                    <RadioGroupItem value="balanced" id="balanced" data-testid="preference-balanced" />
                    <Label htmlFor="balanced" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Balanced</div>
                      <div className="text-sm text-[#5C5C5C]">Perfect mix of sightseeing and rest</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-[#FDFBF7] transition-colors">
                    <RadioGroupItem value="packed" id="packed" data-testid="preference-packed" />
                    <Label htmlFor="packed" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Packed</div>
                      <div className="text-sm text-[#5C5C5C]">See as much as possible</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full btn-primary text-lg py-6 mt-6"
                data-testid="generate-submit-button"
              >
                {loading ? 'Generating...' : 'Generate Itinerary'}
              </Button>
            </div>
          </motion.div>

          {/* Cart Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-8 card-shadow h-fit"
          >
            <h2 className="text-2xl font-bold text-[#004D40] mb-6" style={{ fontFamily: 'Playfair Display' }}>
              Your Selected Places
            </h2>
            <div className="space-y-4 max-h-96 overflow-y-auto" data-testid="selected-places">
              {cart.map((place) => (
                <div key={place.id} className="flex gap-3 p-3 rounded-lg bg-[#FDFBF7]">
                  <img src={place.image_url} alt={place.name} className="w-16 h-16 object-cover rounded-lg" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-[#1A1A1A] text-sm">{place.name}</h4>
                    <p className="text-xs text-[#5C5C5C]">{place.area}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[#5C5C5C]">
                      <span>₹{place.cost}</span>
                      <span>•</span>
                      <span>{place.duration}h</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};