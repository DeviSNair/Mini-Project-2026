import { motion } from 'framer-motion';
import { ShoppingCart, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';

export const CartButton = () => {
  const { cart, removeFromCart, totalCost, cartCount } = useCart();
  const navigate = useNavigate();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          data-testid="cart-button"
          className="relative p-2 rounded-full hover:bg-[#004D40]/10 transition-colors"
        >
          <ShoppingCart className="w-6 h-6 text-[#004D40]" />
          {cartCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-[#FF5722] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
              data-testid="cart-count"
            >
              {cartCount}
            </motion.span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display' }}>
            Your Travel Cart
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-200px)] mt-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-[#5C5C5C]">
              <ShoppingCart className="w-16 h-16 mb-4 opacity-30" />
              <p>Your cart is empty</p>
              <p className="text-sm mt-2">Start exploring places to add them here!</p>
            </div>
          ) : (
            <div className="space-y-4" data-testid="cart-items">
              {cart.map((place) => (
                <motion.div
                  key={place.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-lg p-4 card-shadow flex gap-4"
                  data-testid={`cart-item-${place.id}`}
                >
                  <img
                    src={place.image_url}
                    alt={place.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-[#1A1A1A] mb-1">{place.name}</h4>
                    <p className="text-sm text-[#5C5C5C]">{place.area}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-[#5C5C5C]">
                      <span>₹{place.cost}</span>
                      <span>•</span>
                      <span>{place.duration}h</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(place.id)}
                    className="text-[#5C5C5C] hover:text-[#FF5722] transition-colors"
                    data-testid={`remove-from-cart-${place.id}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
        {cart.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-[#E5E0D8]">
            <div className="flex justify-between mb-4 text-lg font-semibold">
              <span>Total Cost:</span>
              <span className="text-[#004D40]">₹{totalCost}</span>
            </div>
            <Button
              onClick={() => navigate('/generate')}
              className="w-full btn-primary"
              data-testid="generate-itinerary-button"
            >
              Generate Itinerary
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};