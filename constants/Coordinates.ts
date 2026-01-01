export interface Coordinates {
    latitude: number;
    longitude: number;
}

export const CITY_COORDINATES: Record<string, Coordinates> = {
    'תל אביב': { latitude: 32.0853, longitude: 34.7818 },
    'ירושלים': { latitude: 31.7683, longitude: 35.2137 },
    'פתח תקווה': { latitude: 32.0840, longitude: 34.8878 },
    'באר שבע': { latitude: 31.2530, longitude: 34.7915 },
    'חיפה': { latitude: 32.7940, longitude: 34.9896 },
    'ראשון לציון': { latitude: 31.9730, longitude: 34.7925 },
    'נתניה': { latitude: 32.3215, longitude: 34.8532 },
    'חולון': { latitude: 32.0158, longitude: 34.7874 },
    'אשדוד': { latitude: 31.8044, longitude: 34.6553 },
    'בת ים': { latitude: 32.0132, longitude: 34.7481 },
};

export const DEFAULT_COORDINATES: Coordinates = { latitude: 32.0853, longitude: 34.7818 }; // Tel Aviv
