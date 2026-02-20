import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from '@/context/CartContext';
import { Toaster } from '@/components/ui/sonner';
import { Navbar } from '@/components/Navbar';
import { HomePage } from '@/pages/HomePage';
import { ExplorePage } from '@/pages/ExplorePage';
import { GenerateItineraryPage } from '@/pages/GenerateItineraryPage';
import { ItineraryPage } from '@/pages/ItineraryPage';

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/generate" element={<GenerateItineraryPage />} />
            <Route path="/itinerary" element={<ItineraryPage />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;