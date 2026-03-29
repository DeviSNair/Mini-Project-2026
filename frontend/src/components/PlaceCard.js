import { motion } from 'framer-motion';
import { MapPin, ShoppingBag, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { PlaceImage } from '@/components/PlaceImage';
import { toast } from 'sonner';

export const PlaceCard = ({ place, index }) => {
  const { addToCart, isInCart } = useCart();
  const inCart = isInCart(place.id);

  const handleAddToCart = () => {
    if (inCart) {
      toast.info('Already in cart');
      return;
    }
    addToCart(place);
    toast.success(`${place.name} added to cart!`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-white rounded-2xl overflow-hidden card-shadow hover:floating-shadow transition-all duration-300 hover:scale-[1.02]"
      data-testid={`place-card-${place.id}`}
    >
      <div className="relative h-48 overflow-hidden">
        <PlaceImage
          place={place}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        <button
          onClick={handleAddToCart}
          disabled={inCart}
          className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md transition-all ${
            inCart
              ? 'bg-[#2E7D32] text-white'
              : 'bg-white/90 text-[#004D40] hover:bg-[#FFB300] hover:text-white'
          }`}
          data-testid={`add-to-cart-${place.id}`}
        >
          {inCart ? <Check className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
        </button>

        {place.top && (
          <div className="absolute top-4 left-4 bg-[#FFB300] text-[#1A1A1A] px-3 py-1 rounded-full text-xs font-bold">
            ⭐ Top Pick
          </div>
        )}
        {place.hidden && (
          <div className="absolute top-4 left-4 bg-[#FF5722] text-white px-3 py-1 rounded-full text-xs font-bold">
            💎 Hidden Gem
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4">
          <h3
            className="text-white text-xl font-bold mb-1 line-clamp-1"
            style={{ fontFamily: 'Playfair Display' }}
          >
            {place.name}
          </h3>
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{place.area}</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <p className="text-[#5C5C5C] text-sm mb-3 line-clamp-2">{place.description}</p>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <span className="text-[#004D40] font-semibold">
              {place.cost === 0 ? 'Free' : `₹${place.cost}`}
            </span>
            <span className="text-[#5C5C5C]">•</span>
            <span className="text-[#5C5C5C]">{place.duration}h</span>
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#004D40] hover:text-[#FFB300] font-medium transition-colors"
            data-testid={`map-link-${place.id}`}
          >
            View Map
          </a>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <span className="px-2 py-1 bg-[#004D40]/10 text-[#004D40] rounded-full text-xs font-medium capitalize">
            {place.category}
          </span>
          {place.type && (
            <span className="px-2 py-1 bg-[#FFB300]/20 text-[#1A1A1A] rounded-full text-xs font-medium capitalize">
              {place.type}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
