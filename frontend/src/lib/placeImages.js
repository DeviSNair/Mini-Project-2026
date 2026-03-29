const DEFAULT_PLACE_IMAGE = 'https://images.unsplash.com/photo-1642219236097-ac751378a901';

const CATEGORY_FALLBACKS = {
  temple: 'https://images.unsplash.com/photo-1644773182167-0d302480d813',
  beach: 'https://images.unsplash.com/photo-1695030744519-3f3042b3af26',
  church: 'https://images.pexels.com/photos/32542538/pexels-photo-32542538.jpeg',
  mosque: 'https://images.pexels.com/photos/32542538/pexels-photo-32542538.jpeg',
  heritage: 'https://images.pexels.com/photos/19934600/pexels-photo-19934600.jpeg',
  nature: 'https://images.unsplash.com/photo-1642219236097-ac751378a901',
  market: 'https://images.unsplash.com/photo-1642219236097-ac751378a901',
  food: 'https://images.pexels.com/photos/14132112/pexels-photo-14132112.jpeg',
  culture: 'https://images.pexels.com/photos/32542538/pexels-photo-32542538.jpeg',
  street: 'https://images.unsplash.com/photo-1642219236097-ac751378a901',
};

const GENERIC_IMAGE_URLS = new Set([
  '',
  ...Object.values(CATEGORY_FALLBACKS),
]);

const LOCAL_PLACE_IMAGES = {
  'Aazhimala Shiva Temple': '/place-images/aazhimala-shiva-temple.jpg',
  'Akkulam Lake': '/place-images/akkulam-lake.jpg',
  'Attukal Bhagavathy Temple': '/place-images/attukal-bhagavathy-temple.jpg',
  'Azad Restaurant': '/place-images/azad-restaurant.jpg',
  'Beemapally Mosque': '/place-images/beemapally-mosque.jpg',
  'Cafe Mojo': '/place-images/cafe-mojo.jpg',
  'Chalai Market': '/place-images/chalai-market.jpg',
  'Chowara Beach': '/place-images/chowara-beach.jpg',
  'Indian Coffee House': '/place-images/indian-coffee-house.jpg',
  'Janardhana Swamy Temple': '/place-images/janardhana-swamy-temple.jpg',
  'Kanakakkunnu Palace': '/place-images/kanakakkunnu-palace.jpg',
  'Karikkakom Chamundi Temple': '/place-images/karikkakom-chamundi-temple.jpg',
  'Kerala Science & Technology Museum': '/place-images/kerala-science-technology-museum.jpg',
  'Kovalam Beach': '/place-images/kovalam-beach.jpg',
  'Kovalam Lighthouse Walk': '/place-images/kovalam-lighthouse-walk.jpg',
  'Kuthiramalika Palace': '/place-images/kuthiramalika-palace.jpg',
  'Lulu Mall': '/place-images/lulu-mall.jpg',
  'Mall of Travancore': '/place-images/mall-of-travancore.jpg',
  'Manaveeyam Veedhi': '/place-images/manaveeyam-veedhi.jpg',
  'MG Road': '/place-images/mg-road.jpg',
  'Napier Museum': '/place-images/napier-museum.jpg',
  'Neyyar Dam': '/place-images/neyyar-dam.jpg',
  'Nishagandhi Open Air Theatre': '/place-images/nishagandhi-open-air-theatre.jpg',
  'Padmanabhapuram Palace': '/place-images/padmanabhapuram-palace.jpg',
  'Palayam Juma Masjid': '/place-images/palayam-juma-masjid.jpg',
  'Paragon Restaurant TVM': '/place-images/paragon-restaurant-tvm.jpg',
  'Pazhavangadi Ganapathy Temple': '/place-images/pazhavangadi-ganapathy-temple.jpg',
  'Peppara Wildlife Sanctuary': '/place-images/peppara-wildlife-sanctuary.jpg',
  'Ponmudi Hills': '/place-images/ponmudi-hills.jpg',
  'Poovar Beach': '/place-images/poovar-beach.jpg',
  'Priyadarsini Planetarium': '/place-images/priyadarsini-planetarium.jpg',
  'Shankumugham Beach': '/place-images/shankumugham-beach.jpg',
  'Sree Padmanabhaswamy Temple': '/place-images/sree-padmanabhaswamy-temple.jpg',
  'Sri Chitra Art Gallery': '/place-images/sri-chitra-art-gallery.jpg',
  'St Joseph Cathedral Palayam': '/place-images/st-joseph-cathedral-palayam.jpg',
  'Varkala Cliff Beach': '/place-images/varkala-cliff-beach.jpg',
  'Varkala Cliff Walk': '/place-images/varkala-cliff-walk.jpg',
  'Veli Beach': '/place-images/veli-beach.jpg',
  'Veli Tourist Village': '/place-images/veli-tourist-village.jpg',
  'Vettucaud Church': '/place-images/vettucaud-church.jpg',
  'Villa Maya': '/place-images/villa-maya.jpg',
  'Zam Zam Restaurant': '/place-images/zam-zam-restaurant.jpg',
};

const PLACE_IMAGE_ALIASES = {
  'Sri Padmanabhaswamy Temple': 'Sree Padmanabhaswamy Temple',
  'Padmanabhaswamy Temple': 'Sree Padmanabhaswamy Temple',
  'Azhimala Shiva Temple': 'Aazhimala Shiva Temple',
  'Azhimala Shiva Statue': 'Aazhimala Shiva Temple',
  'Beemapally Dargah': 'Beemapally Mosque',
  'Kuthira Malika': 'Kuthiramalika Palace',
  'Kuthira Malika (Mansion of Horses)': 'Kuthiramalika Palace',
  'Shri Chitra Art Gallery': 'Sri Chitra Art Gallery',
  'Shangumukham Beach': 'Shankumugham Beach',
  'Varkala Beach': 'Varkala Cliff Beach',
  'Varkala Cliff & Beach': 'Varkala Cliff Beach',
  'Veli Lake': 'Veli Tourist Village',
  'Veli Lake Tourist Village': 'Veli Tourist Village',
  "St.Joseph's Metropolitan Cathedral": 'St Joseph Cathedral Palayam',
  "St. Joseph's Metropolitan Cathedral": 'St Joseph Cathedral Palayam',
  'Lulu Mall Trivandrum': 'Lulu Mall',
  'Priyadarshini Planetarium': 'Priyadarsini Planetarium',
  'Kerala Science and Technology Museum': 'Kerala Science & Technology Museum',
};

const normalizePlaceName = (placeName) => (placeName || '')
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const LOCAL_IMAGE_INDEX = Object.entries(LOCAL_PLACE_IMAGES).reduce((index, [name, imagePath]) => {
  index[normalizePlaceName(name)] = imagePath;
  return index;
}, {});

Object.entries(PLACE_IMAGE_ALIASES).forEach(([alias, canonicalName]) => {
  const imagePath = LOCAL_PLACE_IMAGES[canonicalName];
  if (imagePath) {
    LOCAL_IMAGE_INDEX[normalizePlaceName(alias)] = imagePath;
  }
});

const sanitizeImageUrl = (imageUrl) => (imageUrl || '').trim();

export const getFallbackPlaceImage = (place) => {
  const originalImage = sanitizeImageUrl(place?.image_url);
  if (originalImage) {
    return originalImage;
  }

  return CATEGORY_FALLBACKS[place?.category] || DEFAULT_PLACE_IMAGE;
};

export const getPreferredPlaceImage = (place) => {
  const localImage = LOCAL_IMAGE_INDEX[normalizePlaceName(place?.name)];
  if (localImage) {
    return localImage;
  }

  const originalImage = sanitizeImageUrl(place?.image_url);
  if (originalImage && !GENERIC_IMAGE_URLS.has(originalImage)) {
    return originalImage;
  }

  return getFallbackPlaceImage(place);
};

export const getUltimatePlaceImage = (place) => (
  getFallbackPlaceImage(place) || DEFAULT_PLACE_IMAGE
);
