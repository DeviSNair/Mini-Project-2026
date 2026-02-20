import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import { PlaceCard } from '@/components/PlaceCard';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const ExplorePage = () => {
  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showTopPicks, setShowTopPicks] = useState(false);
  const [showHiddenGems, setShowHiddenGems] = useState(false);

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'temple', label: 'Temples' },
    { value: 'church', label: 'Churches' },
    { value: 'mosque', label: 'Mosques' },
    { value: 'beach', label: 'Beaches' },
    { value: 'heritage', label: 'Heritage' },
    { value: 'nature', label: 'Nature' },
    { value: 'market', label: 'Markets' },
    { value: 'food', label: 'Food' },
    { value: 'culture', label: 'Culture' },
    { value: 'street', label: 'Streets' },
  ];

  const types = [
    { value: 'all', label: 'All Types' },
    { value: 'budget', label: 'Budget' },
    { value: 'local', label: 'Local' },
    { value: 'premium', label: 'Premium' },
    { value: 'cafe', label: 'Cafe' },
  ];

  useEffect(() => {
    fetchPlaces();
  }, []);

  useEffect(() => {
    filterPlaces();
  }, [places, searchQuery, selectedCategory, selectedType, showTopPicks, showHiddenGems]);

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/places`);
      setPlaces(response.data);
      setFilteredPlaces(response.data);
    } catch (error) {
      console.error('Error fetching places:', error);
      toast.error('Failed to load places');
    } finally {
      setLoading(false);
    }
  };

  const filterPlaces = () => {
    let filtered = places;

    if (searchQuery) {
      filtered = filtered.filter((place) =>
        place.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((place) => place.category === selectedCategory);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter((place) => place.type === selectedType);
    }

    if (showTopPicks) {
      filtered = filtered.filter((place) => place.top === true);
    }

    if (showHiddenGems) {
      filtered = filtered.filter((place) => place.hidden === true);
    }

    setFilteredPlaces(filtered);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#FDFBF7]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#004D40] mb-4"
            style={{ fontFamily: 'Playfair Display' }}
            data-testid="explore-title"
          >
            Explore Thiruvananthapuram
          </h1>
          <p className="text-base sm:text-lg text-[#5C5C5C] max-w-2xl mx-auto">
            Discover the gems of God's Own Country - from ancient temples to pristine beaches
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5C5C5C]" />
            <Input
              type="text"
              placeholder="Search any place..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg rounded-full border-2 border-[#E5E0D8] focus:border-[#FFB300] focus:ring-[#FFB300]"
              data-testid="search-input"
            />
          </div>
        </motion.div>

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <Filter className="w-5 h-5 text-[#004D40]" />
            <span className="font-semibold text-[#004D40]">Categories</span>
          </div>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 pb-4">
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${
                    selectedCategory === category.value
                      ? 'bg-[#004D40] text-white shadow-lg'
                      : 'bg-white text-[#5C5C5C] hover:bg-[#FFB300] hover:text-white'
                  }`}
                  data-testid={`filter-category-${category.value}`}
                >
                  {category.label}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </motion.div>

        {/* Type Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 pb-4">
              {types.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${
                    selectedType === type.value
                      ? 'bg-[#FFB300] text-[#1A1A1A] shadow-lg'
                      : 'bg-white text-[#5C5C5C] hover:bg-[#FFB300]/50'
                  }`}
                  data-testid={`filter-type-${type.value}`}
                >
                  {type.label}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </motion.div>

        {/* Special Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-3 mb-12"
        >
          <button
            onClick={() => setShowTopPicks(!showTopPicks)}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              showTopPicks
                ? 'bg-[#FF5722] text-white shadow-lg'
                : 'bg-white text-[#5C5C5C] hover:bg-[#FF5722]/20'
            }`}
            data-testid="filter-top-picks"
          >
            ⭐ Top Picks
          </button>
          <button
            onClick={() => setShowHiddenGems(!showHiddenGems)}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              showHiddenGems
                ? 'bg-[#FF5722] text-white shadow-lg'
                : 'bg-white text-[#5C5C5C] hover:bg-[#FF5722]/20'
            }`}
            data-testid="filter-hidden-gems"
          >
            💎 Hidden Gems
          </button>
        </motion.div>

        {/* Results Count */}
        <div className="mb-6 text-[#5C5C5C]" data-testid="results-count">
          Showing {filteredPlaces.length} {filteredPlaces.length === 1 ? 'place' : 'places'}
        </div>

        {/* Places Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-[#5C5C5C]" data-testid="loading">Loading places...</div>
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-xl text-[#5C5C5C] mb-4" data-testid="no-results">No places found</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedType('all');
                  setShowTopPicks(false);
                  setShowHiddenGems(false);
                }}
                className="text-[#004D40] hover:text-[#FFB300] font-medium"
                data-testid="clear-filters"
              >
                Clear all filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="places-grid">
            {filteredPlaces.map((place, index) => (
              <PlaceCard key={place.id} place={place} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};