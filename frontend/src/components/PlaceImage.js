import { useEffect, useState } from 'react';
import { getPreferredPlaceImage, getUltimatePlaceImage } from '@/lib/placeImages';

export const PlaceImage = ({ place, alt, ...props }) => {
  const preferredImage = getPreferredPlaceImage(place);
  const fallbackImage = getUltimatePlaceImage(place);
  const [src, setSrc] = useState(preferredImage || fallbackImage);

  useEffect(() => {
    setSrc(preferredImage || fallbackImage);
  }, [preferredImage, fallbackImage]);

  const handleError = () => {
    if (src !== fallbackImage) {
      setSrc(fallbackImage);
    }
  };

  return (
    <img
      {...props}
      src={src || fallbackImage}
      alt={alt || place?.name || 'Place'}
      loading="lazy"
      onError={handleError}
    />
  );
};
