import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Sparkles } from 'lucide-react';
import { CartButton } from './CartButton';

export const Navbar = () => {
  const location = useLocation();
  const isActiveLink = (path) => {
    if (path === '/generate') {
      return location.pathname === '/generate' || location.pathname === '/itinerary';
    }
    return location.pathname === path;
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/explore', label: 'Explore' },
    { path: '/generate', label: 'Plan' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/40 glass-nav"
      data-testid="navbar"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group" data-testid="nav-logo">
            <div className="rounded-2xl bg-[#004D40] p-3 shadow-lg transition-colors group-hover:bg-[#00695C]">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <div
                className="text-xl font-bold text-[#004D40]"
                style={{ fontFamily: 'Playfair Display' }}
              >
                Trivandrum Trails
              </div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#5C5C5C]">Route planning studio</div>
            </div>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                data-testid={`nav-${link.label.toLowerCase()}`}
                className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  isActiveLink(link.path)
                    ? 'text-[#004D40]'
                    : 'text-[#5C5C5C] hover:text-[#004D40]'
                }`}
              >
                {isActiveLink(link.path) && (
                  <motion.div
                    layoutId="navbar-pill"
                    className="absolute inset-0 rounded-full bg-white shadow-[0_12px_30px_rgba(9,57,49,0.12)]"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {link.path === '/generate' && <Sparkles className="h-3.5 w-3.5" />}
                  {link.label}
                </span>
              </Link>
            ))}
            <CartButton />
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
