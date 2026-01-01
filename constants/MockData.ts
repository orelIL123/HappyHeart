export type UserRole = 'clown' | 'organizer' | 'admin';

export interface User {
    id: string;
    name: string;
    role: UserRole;
    avatar: string;
    certificationUrl?: string;
    preferredArea: string;
    phone?: string;
    password?: string;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export interface Activity {
    id: string;
    title: string;
    location: string;
    institution: string;
    startTime: string;
    endTime: string;
    description: string;
    requiredClowns: number;
    type: 'one-time' | 'recurring';
    organizerId: string;
    participants: string[]; // User IDs
    contactPerson: string;  // Name of contact person at the institution
    contactPhone: string;   // Phone number of contact person
    department?: string;    // Keep for backward compatibility
    intensity?: 'low' | 'medium' | 'high';
    isUrgent?: boolean;
}

export const MOCK_USERS: User[] = [
    {
        id: '1',
        name: "ז'קו הליצן",
        role: 'clown',
        avatar: 'https://i.pravatar.cc/150?u=jacko',
        preferredArea: 'מרכז',
        approvalStatus: 'approved',
    },
    {
        id: '2',
        name: 'פופו המארגן',
        role: 'organizer',
        avatar: 'https://i.pravatar.cc/150?u=fofo',
        preferredArea: 'צפון',
        approvalStatus: 'approved',
    },
    {
        id: '3',
        name: 'שמחה האדמינית',
        role: 'admin',
        avatar: 'https://i.pravatar.cc/150?u=simcha',
        preferredArea: 'ירושלים',
        approvalStatus: 'approved',
    },
    {
        id: '4',
        name: 'עמוס סגרון',
        role: 'admin',
        avatar: 'https://i.pravatar.cc/150?u=amos',
        preferredArea: 'מרכז',
        phone: '0529250237',
        password: '112233',
        approvalStatus: 'approved',
    },
];

export const MOCK_ACTIVITIES: Activity[] = [
    {
        id: 'a1',
        title: 'שמח במיון ילדים',
        location: 'תל אביב',
        institution: 'בית חולים איכילוב',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        description: 'פעילות משמחת במחלקת מיון ילדים. דרושה אנרגיה גבוהה!',
        requiredClowns: 3,
        type: 'one-time',
        organizerId: '2',
        participants: ['1'],
        contactPerson: 'אחות רחל כהן',
        contactPhone: '050-1234567',
        department: 'מיון ילדים',
        intensity: 'high',
    },
    {
        id: 'a2',
        title: 'ביקור מחלקת אונקולוגיה',
        location: 'ירושלים',
        institution: 'הדסה עין כרם',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 93600000).toISOString(),
        description: 'סבב חיוכים במחלקה האונקולוגית. פעילות רגועה ומרגשת.',
        requiredClowns: 2,
        type: 'recurring',
        organizerId: '2',
        participants: [],
        contactPerson: 'ד"ר יוסי לוי',
        contactPhone: '052-9876543',
        department: 'אונקולוגיה',
        intensity: 'low',
    },
    {
        id: 'a3',
        title: 'מסיבת יום הולדת לילד מאושפז',
        location: 'פתח תקווה',
        institution: 'מרכז שניידר',
        startTime: new Date(Date.now() + 172800000).toISOString(),
        endTime: new Date(Date.now() + 180000000).toISOString(),
        description: 'חגיגת יום הולדת 10 לדני. הרבה בלונים וקסמים!',
        requiredClowns: 4,
        type: 'one-time',
        organizerId: '2',
        participants: [],
        contactPerson: 'מירי שפירא',
        contactPhone: '054-3456789',
        department: 'כללי',
        intensity: 'medium',
    },
];

export const INSTITUTIONS = [
    'בית חולים איכילוב',
    'הדסה עין כרם',
    'מרכז שניידר',
    'סורוקה',
    'שיבא תל השומר',
    'בי"ח רמב"ם',
];

export const CITIES = [
    'תל אביב',
    'ירושלים',
    'פתח תקווה',
    'באר שבע',
    'חיפה',
    'ראשון לציון',
];
