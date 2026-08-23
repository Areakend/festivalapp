/** Turn an ISO 3166-1 alpha-2 code into its flag emoji (FR → 🇫🇷). */
export function countryFlag(iso: string): string {
  if (!/^[A-Za-z]{2}$/.test(iso)) return '';
  return String.fromCodePoint(
    ...iso.toUpperCase().split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

/** Locale-aware short date range: "17–26 Jul 2026". */
export function formatDateRange(start: string | null, end: string | null, locale: string): string {
  if (!start) return '';
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  const from = new Date(start);
  if (!end) return fmt.format(from);
  return `${new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(from)}–${fmt.format(new Date(end))}`;
}

/** Compact numbers for stats: 400000 → "400K". */
export function formatCompact(n: number, locale: string): string {
  return new Intl.NumberFormat(locale, { notation: 'compact' }).format(n);
}

// Intl.DisplayNames is unreliable on Android/Hermes — it can throw or
// silently return the raw code instead of the name, which used to break
// country search ("france" matched nothing because countryName("FR", "fr")
// came back as just "FR"). A static table for the catalog's actual
// countries sidesteps that engine gap entirely; Intl.DisplayNames is only
// a best-effort fallback for a code that isn't in it yet.
const COUNTRY_NAMES: Record<string, Record<'en' | 'fr' | 'nl' | 'de' | 'es', string>> = {
  AE: { en: 'United Arab Emirates', fr: 'Émirats arabes unis', nl: 'Verenigde Arabische Emiraten', de: 'Vereinigte Arabische Emirate', es: 'Emiratos Árabes Unidos' },
  AR: { en: 'Argentina', fr: 'Argentine', nl: 'Argentinië', de: 'Argentinien', es: 'Argentina' },
  AT: { en: 'Austria', fr: 'Autriche', nl: 'Oostenrijk', de: 'Österreich', es: 'Austria' },
  AU: { en: 'Australia', fr: 'Australie', nl: 'Australië', de: 'Australien', es: 'Australia' },
  BE: { en: 'Belgium', fr: 'Belgique', nl: 'België', de: 'Belgien', es: 'Bélgica' },
  BR: { en: 'Brazil', fr: 'Brésil', nl: 'Brazilië', de: 'Brasilien', es: 'Brasil' },
  CA: { en: 'Canada', fr: 'Canada', nl: 'Canada', de: 'Kanada', es: 'Canadá' },
  CH: { en: 'Switzerland', fr: 'Suisse', nl: 'Zwitserland', de: 'Schweiz', es: 'Suiza' },
  CL: { en: 'Chile', fr: 'Chili', nl: 'Chili', de: 'Chile', es: 'Chile' },
  CN: { en: 'China', fr: 'Chine', nl: 'China', de: 'China', es: 'China' },
  CO: { en: 'Colombia', fr: 'Colombie', nl: 'Colombia', de: 'Kolumbien', es: 'Colombia' },
  CY: { en: 'Cyprus', fr: 'Chypre', nl: 'Cyprus', de: 'Zypern', es: 'Chipre' },
  CZ: { en: 'Czechia', fr: 'Tchéquie', nl: 'Tsjechië', de: 'Tschechien', es: 'República Checa' },
  DE: { en: 'Germany', fr: 'Allemagne', nl: 'Duitsland', de: 'Deutschland', es: 'Alemania' },
  DK: { en: 'Denmark', fr: 'Danemark', nl: 'Denemarken', de: 'Dänemark', es: 'Dinamarca' },
  DO: { en: 'Dominican Republic', fr: 'République dominicaine', nl: 'Dominicaanse Republiek', de: 'Dominikanische Republik', es: 'República Dominicana' },
  ES: { en: 'Spain', fr: 'Espagne', nl: 'Spanje', de: 'Spanien', es: 'España' },
  FR: { en: 'France', fr: 'France', nl: 'Frankrijk', de: 'Frankreich', es: 'Francia' },
  GB: { en: 'United Kingdom', fr: 'Royaume-Uni', nl: 'Verenigd Koninkrijk', de: 'Vereinigtes Königreich', es: 'Reino Unido' },
  GR: { en: 'Greece', fr: 'Grèce', nl: 'Griekenland', de: 'Griechenland', es: 'Grecia' },
  HK: { en: 'Hong Kong', fr: 'Hong Kong', nl: 'Hongkong', de: 'Hongkong', es: 'Hong Kong' },
  HR: { en: 'Croatia', fr: 'Croatie', nl: 'Kroatië', de: 'Kroatien', es: 'Croacia' },
  HU: { en: 'Hungary', fr: 'Hongrie', nl: 'Hongarije', de: 'Ungarn', es: 'Hungría' },
  ID: { en: 'Indonesia', fr: 'Indonésie', nl: 'Indonesië', de: 'Indonesien', es: 'Indonesia' },
  IE: { en: 'Ireland', fr: 'Irlande', nl: 'Ierland', de: 'Irland', es: 'Irlanda' },
  IN: { en: 'India', fr: 'Inde', nl: 'India', de: 'Indien', es: 'India' },
  IT: { en: 'Italy', fr: 'Italie', nl: 'Italië', de: 'Italien', es: 'Italia' },
  JP: { en: 'Japan', fr: 'Japon', nl: 'Japan', de: 'Japan', es: 'Japón' },
  KR: { en: 'South Korea', fr: 'Corée du Sud', nl: 'Zuid-Korea', de: 'Südkorea', es: 'Corea del Sur' },
  LU: { en: 'Luxembourg', fr: 'Luxembourg', nl: 'Luxemburg', de: 'Luxemburg', es: 'Luxemburgo' },
  MA: { en: 'Morocco', fr: 'Maroc', nl: 'Marokko', de: 'Marokko', es: 'Marruecos' },
  MT: { en: 'Malta', fr: 'Malte', nl: 'Malta', de: 'Malta', es: 'Malta' },
  MX: { en: 'Mexico', fr: 'Mexique', nl: 'Mexico', de: 'Mexiko', es: 'México' },
  MY: { en: 'Malaysia', fr: 'Malaisie', nl: 'Maleisië', de: 'Malaysia', es: 'Malasia' },
  NL: { en: 'Netherlands', fr: 'Pays-Bas', nl: 'Nederland', de: 'Niederlande', es: 'Países Bajos' },
  PL: { en: 'Poland', fr: 'Pologne', nl: 'Polen', de: 'Polen', es: 'Polonia' },
  PT: { en: 'Portugal', fr: 'Portugal', nl: 'Portugal', de: 'Portugal', es: 'Portugal' },
  RO: { en: 'Romania', fr: 'Roumanie', nl: 'Roemenië', de: 'Rumänien', es: 'Rumanía' },
  RS: { en: 'Serbia', fr: 'Serbie', nl: 'Servië', de: 'Serbien', es: 'Serbia' },
  SA: { en: 'Saudi Arabia', fr: 'Arabie saoudite', nl: 'Saoedi-Arabië', de: 'Saudi-Arabien', es: 'Arabia Saudita' },
  SE: { en: 'Sweden', fr: 'Suède', nl: 'Zweden', de: 'Schweden', es: 'Suecia' },
  TH: { en: 'Thailand', fr: 'Thaïlande', nl: 'Thailand', de: 'Thailand', es: 'Tailandia' },
  TW: { en: 'Taiwan', fr: 'Taïwan', nl: 'Taiwan', de: 'Taiwan', es: 'Taiwán' },
  US: { en: 'United States', fr: 'États-Unis', nl: 'Verenigde Staten', de: 'Vereinigte Staaten', es: 'Estados Unidos' },
  VN: { en: 'Vietnam', fr: 'Vietnam', nl: 'Vietnam', de: 'Vietnam', es: 'Vietnam' },
  ZA: { en: 'South Africa', fr: 'Afrique du Sud', nl: 'Zuid-Afrika', de: 'Südafrika', es: 'Sudáfrica' },
};

/** ISO 3166-1 alpha-2 code to localized country name (FR → "France"), for search matching. */
export function countryName(iso: string, locale: string): string {
  const code = iso.toUpperCase();
  const lang = locale.slice(0, 2).toLowerCase();
  const known = COUNTRY_NAMES[code]?.[lang as 'en' | 'fr' | 'nl' | 'de' | 'es'];
  if (known) return known;
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}
