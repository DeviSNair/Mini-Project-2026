import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { CartButton } from './CartButton';

export const Navbar = () => {
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/explore', label: 'Explore' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass-nav border-b border-[#E5E0D8]"
      data-testid="navbar"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group" data-testid="nav-logo">
            <div className="bg-[#004D40] p-2 rounded-full group-hover:bg-[#00695C] transition-colors">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span
              className="text-xl font-bold text-[#004D40]"
              style={{ fontFamily: 'Playfair Display' }}
            >
              Trivandrum Trails
            </span>
          </Link>

          <div className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                data-testid={`nav-${link.label.toLowerCase()}`}
                className={`text-sm font-medium transition-colors relative ${
                  location.pathname === link.path
                    ? 'text-[#004D40]'
                    : 'text-[#5C5C5C] hover:text-[#004D40]'
                }`}
              >
                {link.label}
                {location.pathname === link.path && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-[20px] left-0 right-0 h-0.5 bg-[#FFB300]"
                  />
                )}
              </Link>
            ))}
            <CartButton />
          </div>
        </div>
      </div>
    </motion.nav>
  );
};