import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Download, MapPin, Clock, DollarSign, Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

export const ItineraryPage = () => {
  const [itinerary, setItinerary] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedItinerary = localStorage.getItem('tvm-itinerary');
    if (savedItinerary) {
      setItinerary(JSON.parse(savedItinerary));
    } else {
      navigate('/generate');
    }
  }, [navigate]);

  const downloadAsPDF = () => {
    if (!itinerary) return;

    const doc = new jsPDF();
    let yPos = 20;

    // Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Trivandrum Travel Itinerary', 105, yPos, { align: 'center' });
    yPos += 15;

    // Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Days: ${itinerary.days.length}`, 20, yPos);
    yPos += 7;
    doc.text(`Total Cost: \u20b9${itinerary.total_cost}`, 20, yPos);
    yPos += 7;
    doc.text(`Total Duration: ${itinerary.total_duration.toFixed(1)} hours`, 20, yPos);
    yPos += 15;

    // Days
    itinerary.days.forEach((day, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Day ${day.day}`, 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      day.places.forEach((place) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        doc.text(`\u2022 ${place.name}`, 25, yPos);
        yPos += 5;
        doc.text(`  ${place.area} | \u20b9${place.cost} | ${place.duration}h`, 30, yPos);
        yPos += 7;
      });

      yPos += 5;
    });

    // Recommendations
    if (itinerary.recommendations && itinerary.recommendations.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Recommended Places', 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      itinerary.recommendations.forEach((place) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`\u2022 ${place.name} - ${place.area}`, 25, yPos);
        yPos += 7;
      });
    }

    doc.save('trivandrum-itinerary.pdf');
    toast.success('PDF downloaded successfully!');
  };

  const downloadAsText = () => {
    if (!itinerary) return;

    let text = 'TRIVANDRUM TRAVEL ITINERARY\n\n';
    text += '================================\n\n';
    text += `Total Days: ${itinerary.days.length}\n`;
    text += `Total Cost: \u20b9${itinerary.total_cost}\n`;
    text += `Total Duration: ${itinerary.total_duration.toFixed(1)} hours\n\n`;
    text += '================================\n\n';

    itinerary.days.forEach((day) => {
      text += `DAY ${day.day}\n`;
      text += `--------\n`;
      day.places.forEach((place) => {
        text += `\u2022 ${place.name}\n`;
        text += `  Location: ${place.area}\n`;
        text += `  Cost: \u20b9${place.cost}\n`;
        text += `  Duration: ${place.duration} hours\n`;
        text += `  Description: ${place.description}\n\n`;
      });
      text += `Day ${day.day} Total: \u20b9${day.total_cost} | ${day.total_duration.toFixed(1)}h\n\n`;
    });

    if (itinerary.recommendations && itinerary.recommendations.length > 0) {
      text += '================================\n';
      text += 'RECOMMENDED PLACES\n';
      text += '================================\n\n';
      itinerary.recommendations.forEach((place) => {
        text += `\u2022 ${place.name} - ${place.area}\n`;
      });
    }

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trivandrum-itinerary.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Text file downloaded successfully!');
  };

  if (!itinerary) {
    return (
      <div className="min-h-screen pt-24 pb-12 bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-[#5C5C5C]">Loading itinerary...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#FDFBF7]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1
            className="text-4xl sm:text-5xl font-bold text-[#004D40] mb-4"
            style={{ fontFamily: 'Playfair Display' }}
            data-testid="itinerary-title"
          >
            Your Trivandrum Journey
          </h1>
          <p className="text-lg text-[#5C5C5C] mb-6">
            A perfectly planned {itinerary.days.length}-day adventure awaits you
          </p>

          {/* Download Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Button onClick={downloadAsPDF} className="btn-primary" data-testid="download-pdf-button">
              <Download className="w-5 h-5 mr-2" />
              Download as PDF
            </Button>
            <Button onClick={downloadAsText} className="btn-secondary" data-testid="download-text-button">
              <Download className="w-5 h-5 mr-2" />
              Download as Text
            </Button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12"
        >
          <div className="bg-white rounded-2xl p-6 card-shadow text-center">
            <Calendar className="w-8 h-8 text-[#004D40] mx-auto mb-3" />
            <div className="text-3xl font-bold text-[#004D40]" style={{ fontFamily: 'Playfair Display' }}>
              {itinerary.days.length}
            </div>
            <div className="text-[#5C5C5C]">Days</div>
          </div>
          <div className="bg-white rounded-2xl p-6 card-shadow text-center">
            <DollarSign className="w-8 h-8 text-[#FFB300] mx-auto mb-3" />
            <div className="text-3xl font-bold text-[#FFB300]" style={{ fontFamily: 'Playfair Display' }}>
              ₹{itinerary.total_cost}
            </div>
            <div className="text-[#5C5C5C]">Total Cost</div>
          </div>
          <div className="bg-white rounded-2xl p-6 card-shadow text-center">
            <Clock className="w-8 h-8 text-[#FF5722] mx-auto mb-3" />
            <div className="text-3xl font-bold text-[#FF5722]" style={{ fontFamily: 'Playfair Display' }}>
              {itinerary.total_duration.toFixed(1)}h
            </div>
            <div className="text-[#5C5C5C]">Duration</div>
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="relative" data-testid="itinerary-timeline">
          {itinerary.days.map((day, dayIndex) => (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + dayIndex * 0.1 }}
              className="mb-12 relative"
              data-testid={`day-${day.day}`}
            >
              {/* Day Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-[#004D40] text-white w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                  {day.day}
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-[#004D40]" style={{ fontFamily: 'Playfair Display' }}>
                    Day {day.day}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-[#5C5C5C] mt-1">
                    <span>₹{day.total_cost}</span>
                    <span>•</span>
                    <span>{day.total_duration.toFixed(1)} hours</span>
                    <span>•</span>
                    <span>{day.places.length} places</span>
                  </div>
                </div>
              </div>

              {/* Places */}
              <div className="ml-8 space-y-6">
                {day.places.map((place, placeIndex) => (
                  <motion.div
                    key={place.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + dayIndex * 0.1 + placeIndex * 0.05 }}
                    className="bg-white rounded-2xl p-6 card-shadow hover:floating-shadow transition-all"
                    data-testid={`place-${place.id}`}
                  >
                    <div className="flex gap-4">
                      <img
                        src={place.image_url}
                        alt={place.name}
                        className="w-24 h-24 object-cover rounded-xl"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-[#1A1A1A] mb-1" style={{ fontFamily: 'Playfair Display' }}>
                              {place.name}
                            </h3>
                            <div className="flex items-center gap-2 text-[#5C5C5C] text-sm mb-2">
                              <MapPin className="w-4 h-4" />
                              <span>{place.area}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-[#5C5C5C]" />
                        </div>
                        <p className="text-[#5C5C5C] text-sm mb-3">{place.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-[#004D40] font-semibold">
                            {place.cost === 0 ? 'Free' : `₹${place.cost}`}
                          </span>
                          <span className="text-[#5C5C5C]">•</span>
                          <span className="text-[#5C5C5C]">{place.duration} hours</span>
                          <span className="text-[#5C5C5C]">•</span>
                          <span className="px-2 py-1 bg-[#004D40]/10 text-[#004D40] rounded-full text-xs font-medium capitalize">
                            {place.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recommendations */}
        {itinerary.recommendations && itinerary.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16"
            data-testid="recommendations-section"
          >
            <h2
              className="text-3xl font-bold text-[#004D40] mb-6"
              style={{ fontFamily: 'Playfair Display' }}
            >
              You Might Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {itinerary.recommendations.map((place) => (
                <div
                  key={place.id}
                  className="bg-white rounded-2xl overflow-hidden card-shadow hover:floating-shadow transition-all"
                  data-testid={`recommendation-${place.id}`}
                >
                  <img src={place.image_url} alt={place.name} className="w-full h-40 object-cover" />
                  <div className="p-4">
                    <h4 className="font-bold text-[#1A1A1A] mb-1">{place.name}</h4>
                    <p className="text-sm text-[#5C5C5C]">{place.area}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Back Button */}
        <div className="mt-12 text-center">
          <Button
            onClick={() => navigate('/explore')}
            className="btn-secondary"
            data-testid="back-to-explore-button"
          >
            Explore More Places
          </Button>
        </div>
      </div>
    </div>
  );
};