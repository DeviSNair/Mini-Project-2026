import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Compass, ShoppingCart, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const HomePage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Compass,
      title: 'Explore Places',
      description: 'Discover temples, beaches, heritage sites, and hidden gems of Trivandrum',
    },
    {
      icon: ShoppingCart,
      title: 'Build Your Cart',
      description: 'Add your favorite places to cart like shopping for experiences',
    },
    {
      icon: MapPin,
      title: 'Smart Planning',
      description: 'AI-powered itinerary that groups nearby places and optimizes your journey',
    },
    {
      icon: Download,
      title: 'Download & Go',
      description: 'Export your itinerary as PDF or text file for offline access',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center gradient-hero" data-testid="hero-section">
        <div className="absolute inset-0 warm-glow" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
              style={{ fontFamily: 'Playfair Display' }}
              data-testid="hero-title"
            >
              Discover Trivandrum,
              <br />
              One Place at a Time
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              Plan your perfect trip with our smart itinerary builder. Explore curated places, build your travel cart, and get AI-optimized day-wise plans.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => navigate('/explore')}
                className="btn-primary text-lg px-8 py-6"
                data-testid="explore-button"
              >
                Start Exploring
              </Button>
              <Button
                onClick={() => navigate('/explore')}
                className="btn-secondary text-lg px-8 py-6 bg-white/10 border-white text-white hover:bg-white hover:text-[#004D40]"
                data-testid="learn-more-button"
              >
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white" data-testid="features-section">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2
              className="text-4xl sm:text-5xl font-bold text-[#004D40] mb-4"
              style={{ fontFamily: 'Playfair Display' }}
            >
              How It Works
            </h2>
            <p className="text-lg text-[#5C5C5C] max-w-2xl mx-auto">
              Your journey from exploration to perfect itinerary in four simple steps
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-8 rounded-2xl bg-[#FDFBF7] hover:bg-white card-shadow hover:floating-shadow transition-all duration-300"
                data-testid={`feature-${index}`}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#004D40] text-white mb-6">
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-3" style={{ fontFamily: 'Playfair Display' }}>
                  {feature.title}
                </h3>
                <p className="text-[#5C5C5C]">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#004D40] text-white" data-testid="cta-section">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2
              className="text-4xl sm:text-5xl font-bold mb-6"
              style={{ fontFamily: 'Playfair Display' }}
            >
              Ready to Plan Your Journey?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-white/90">
              Start exploring Trivandrum's best places and create your personalized itinerary today
            </p>
            <Button
              onClick={() => navigate('/explore')}
              className="btn-primary bg-[#FFB300] hover:bg-[#FFA000] text-[#1A1A1A] text-lg px-8 py-6"
              data-testid="cta-explore-button"
            >
              Explore Now
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};