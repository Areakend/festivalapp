export type ChecklistToggle = 'sunny' | 'beach' | 'camping';

export interface ChecklistItemDef {
  key: string;
  labelKey: string;
}

/** Always shown, regardless of context. */
export const BASE_ITEMS: ChecklistItemDef[] = [
  { key: 'tickets', labelKey: 'checklist.item.tickets' },
  { key: 'id', labelKey: 'checklist.item.id' },
  { key: 'cash', labelKey: 'checklist.item.cash' },
  { key: 'phone', labelKey: 'checklist.item.phone' },
  { key: 'powerbank', labelKey: 'checklist.item.powerbank' },
  { key: 'earplugs', labelKey: 'checklist.item.earplugs' },
  { key: 'backpack', labelKey: 'checklist.item.backpack' },
  { key: 'waterBottle', labelKey: 'checklist.item.waterBottle' },
  { key: 'firstAid', labelKey: 'checklist.item.firstAid' },
  { key: 'wetWipes', labelKey: 'checklist.item.wetWipes' },
  { key: 'shoes', labelKey: 'checklist.item.shoes' },
];

/** Shown only when the matching context toggle is on. */
export const TOGGLE_ITEMS: Record<ChecklistToggle, ChecklistItemDef[]> = {
  sunny: [
    { key: 'hat', labelKey: 'checklist.item.hat' },
    { key: 'sunscreen', labelKey: 'checklist.item.sunscreen' },
    { key: 'sunglasses', labelKey: 'checklist.item.sunglasses' },
  ],
  beach: [
    { key: 'swimsuit', labelKey: 'checklist.item.swimsuit' },
    { key: 'towel', labelKey: 'checklist.item.towel' },
    { key: 'sandals', labelKey: 'checklist.item.sandals' },
  ],
  camping: [
    { key: 'tent', labelKey: 'checklist.item.tent' },
    { key: 'sleepingBag', labelKey: 'checklist.item.sleepingBag' },
    { key: 'sleepingPad', labelKey: 'checklist.item.sleepingPad' },
    { key: 'headlamp', labelKey: 'checklist.item.headlamp' },
    { key: 'campStove', labelKey: 'checklist.item.campStove' },
    { key: 'toiletPaper', labelKey: 'checklist.item.toiletPaper' },
  ],
};

/** Shown automatically when the edition spans more than one day — not a toggle, it's a known fact. */
export const MULTI_DAY_ITEMS: ChecklistItemDef[] = [
  { key: 'spareClothes', labelKey: 'checklist.item.spareClothes' },
  { key: 'toiletryBag', labelKey: 'checklist.item.toiletryBag' },
  { key: 'trashBags', labelKey: 'checklist.item.trashBags' },
  { key: 'extraPowerbank', labelKey: 'checklist.item.extraPowerbank' },
];

// Coarse "generally hot/sunny" heuristic used only as the sunny toggle's
// *default* the first time a user opens a given festival's checklist —
// they can always flip it, and their choice is remembered from then on
// (see togglePrefKey / useChecklistState).
const WARM_COUNTRIES = new Set([
  'ES', 'PT', 'IT', 'GR', 'HR', 'CY', 'MT', 'MA', 'TN', 'EG', 'AE', 'SA',
  'TH', 'ID', 'VN', 'MY', 'SG', 'PH', 'IN', 'KH', 'LA',
  'MX', 'BR', 'AR', 'CL', 'CO', 'AU', 'ZA',
]);

export function defaultSunny(country: string): boolean {
  return WARM_COUNTRIES.has(country.toUpperCase());
}

export function isMultiDayEdition(startDate: string | null, endDate: string | null): boolean {
  return !!startDate && !!endDate && startDate !== endDate;
}

/** Reserved item_key prefix for persisted toggle state (see the migration's comment). */
export function togglePrefKey(toggle: ChecklistToggle): string {
  return `pref:${toggle}`;
}
