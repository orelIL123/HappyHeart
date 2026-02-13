/**
 * Region filter: North, South, Center.
 * Maps cities/locations to regions for filtering.
 */
export type RegionId = 'צפון' | 'דרום' | 'מרכז';

export const REGIONS: { id: RegionId; label: string }[] = [
    { id: 'צפון', label: 'צפון' },
    { id: 'מרכז', label: 'מרכז' },
    { id: 'דרום', label: 'דרום' },
];

// Cities/locations mapped to region (default: מרכז for unknown)
const NORTH_CITIES = ['חיפה', 'עכו', 'נהריה', 'כרמיאל', 'צפת', 'טבריה', 'עפולה', 'נצרת', 'אור עקיבא', 'מעלות', 'קצרין'];
const SOUTH_CITIES = ['באר שבע', 'אשדוד', 'אשקלון', 'דימונה', 'אופקים', 'נתיבות', 'שדרות', 'קריית גת', 'קריית מלאכי', 'ירוחם', 'מצפה רמון', 'אילת'];
const CENTER_CITIES = ['תל אביב', 'רמת גן', 'גבעתיים', 'חולון', 'בת ים', 'פתח תקווה', 'הרצליה', 'רעננה', 'כפר סבא', 'רמת השרון', 'ירושלים', 'מודיעין', 'לוד', 'רמלה', 'נס ציונה', 'רחובות', 'ראשון לציון', 'בת ים', 'חיפה'];

export function getRegionForLocation(location: string): RegionId {
    const loc = (location || '').trim();
    if (NORTH_CITIES.some(c => loc.includes(c))) return 'צפון';
    if (SOUTH_CITIES.some(c => loc.includes(c))) return 'דרום';
    if (CENTER_CITIES.some(c => loc.includes(c))) return 'מרכז';
    return 'מרכז'; // default
}
