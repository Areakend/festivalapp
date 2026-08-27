import { Linking, Platform } from 'react-native';

import { countryName } from './format';

interface MappableFestival {
  name: string;
  venue: string | null;
  city: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
}

/**
 * Opens the platform's own maps app (falling back to Google Maps on the
 * web) centered on a festival's venue — exact coordinates when we have
 * them, otherwise a text search built from venue/city/country.
 */
export function openInMaps(festival: MappableFestival, locale: string) {
  const locationText = [festival.venue, festival.city, countryName(festival.country, locale)]
    .filter(Boolean)
    .join(', ');
  const label = encodeURIComponent(festival.name);
  const hasCoords = festival.latitude != null && festival.longitude != null;
  const coords = hasCoords ? `${festival.latitude},${festival.longitude}` : '';
  const textQuery = encodeURIComponent(locationText || festival.name);
  const webUrl = `https://www.google.com/maps/search/?api=1&query=${hasCoords ? coords : textQuery}`;
  const nativeUrl = Platform.select({
    ios: hasCoords ? `maps://?ll=${coords}&q=${label}` : `maps://?q=${textQuery}`,
    android: hasCoords ? `geo:${coords}?q=${coords}(${label})` : `geo:0,0?q=${textQuery}`,
  });
  void Linking.openURL(nativeUrl ?? webUrl).catch(() => Linking.openURL(webUrl));
}
