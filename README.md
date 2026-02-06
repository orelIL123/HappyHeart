# 🎪 שמחת הלב - Simchat HaLev Clown App

אפליקציה לניהול ליצנים רפואיים ופעילויות בבתי חולים

## 🌟 תכונות עיקריות

- 📱 **אפליקציה רב-פלטפורמית** - iOS & Android
- 🔐 **אימות מאובטח** - Firebase Authentication
- 👥 **ניהול משתמשים** - ליצנים, מארגנים, אדמינים
- 📅 **ניהול פעילויות** - יצירה, הצטרפות, ועדכונים בזמן אמת
- 🔔 **התראות חכמות** - התראות מבוססות מיקום ועדיפויות
- 🗑️ **מחיקה אוטומטית** - פעילויות נמחקות 24 שעות אחרי הסיום
- 🔄 **OTA Updates** - עדכונים אוטומטיים ללא צורך בהורדה מחדש
- 🎨 **תמיכה ב-RTL** - ממשק בעברית עם תמיכה מלאה ב-RTL
- 📱 **אופטימיזציה לאנדרואיד** - תצוגה זהה ל-iOS

## 🚀 התחלה מהירה

### דרישות מקדימות

- Node.js 18+
- npm או yarn
- Expo CLI
- Firebase account
- (אופציונלי) EAS CLI לבניית האפליקציה

### התקנה

1. Clone הפרויקט:
```bash
git clone <repository-url>
cd happyHart
```

2. התקן dependencies:
```bash
npm install
```

3. הגדר משתני סביבה:
```bash
cp .env.example .env
# ערוך את .env ומלא את ערכי Firebase שלך
```

4. הוסף קבצי Firebase configuration:
- `google-services.json` (Android)
- `GoogleService-Info-14.plist` (iOS)
- `happyapp-b8d4d-firebase-adminsdk-*.json` (Admin SDK)

5. הרץ את האפליקציה:
```bash
npm start
```

## 🏗️ מבנה הפרויקט

```
happyHart/
├── app/                    # מסכים ונתיבים (Expo Router)
│   ├── (auth)/            # מסכי התחברות והרשמה
│   ├── (tabs)/            # מסכים ראשיים (Home, Create, Profile, etc.)
│   └── _layout.tsx        # Layout ראשי
├── components/            # רכיבים משותפים
├── constants/             # קבועים ונתונים סטטיים
│   └── AndroidStyles.ts   # סטיילים לאנדרואיד
├── context/               # React Context (AppContext)
├── services/              # שירותים (Firebase, Notifications)
├── config/                # קונפיגורציה (Firebase)
├── firestore.rules        # Firebase Security Rules
├── storage.rules          # Firebase Storage Rules
└── eas.json              # EAS Build configuration
```

## 🔐 אבטחה

### Firebase Security Rules

האפליקציה משתמשת ב-Security Rules מאובטחות:

**Firestore Rules:**
- ✅ משתמשים לא מחוברים - אין גישה
- ✅ משתמשים ממתינים לאישור - אין גישה לתוכן
- ✅ ליצנים מאושרים - קריאה בלבד, עדכון participants בפעילויות
- ✅ מארגנים - יכולים ליצור/לערוך פעילויות
- ✅ אדמינים - גישה מלאה

**Storage Rules:**
- ✅ תמונות פרופיל - כל אחד יכול להעלות את שלו
- ✅ תעודות - רק אדמינים יכולים לצפות

### פריסת Rules

```bash
# פרוס באמצעות הסקריפט
./deploy-rules.sh

# או ידנית
firebase deploy --only firestore:rules,storage
```

## 📱 בנייה ופריסה

### Development Build
```bash
npm run build:dev          # Android
npm run build:dev:ios      # iOS
```

### Preview Build (לבדיקות)
```bash
npm run build:preview      # Android APK
npm run build:preview:ios  # iOS
```

### Production Build (לחנויות)
```bash
npm run build:production      # Android AAB (Play Store)
npm run build:production:ios  # iOS (App Store)
```

### OTA Updates
```bash
# Preview channel
npm run update:preview "תיאור העדכון"

# Production channel
npm run update:production "תיאור העדכון"
```

## 🧪 בדיקות

לפני פרסום, עבור על [TEST_CHECKLIST.md](TEST_CHECKLIST.md) ובדוק את כל הנקודות.

### בדיקות מהירות:
1. הרשמה והתחברות
2. יצירת פעילות (מארגן)
3. הצטרפות לפעילות (ליצן)
4. עדכון פרופיל
5. התראות

## 📚 תיעוד נוסף

- [DEPLOYMENT.md](DEPLOYMENT.md) - הוראות פריסה מפורטות
- [TEST_CHECKLIST.md](TEST_CHECKLIST.md) - רשימת בדיקות מלאה

## 🛠️ טכנולוגיות

- **React Native** 0.81.5
- **Expo** ~54.0
- **Expo Router** ~6.0 (File-based routing)
- **Firebase** 12.7.0 (Auth, Firestore, Storage)
- **TypeScript** 5.9

## 🎨 Android Optimization

האפליקציה כוללת אופטימיזציות ייעודיות לאנדרואיד:
- Shadows מותאמים
- Text rendering fixes
- RTL support מלא
- Safe area handling
- Font scaling prevention

ראה [constants/AndroidStyles.ts](constants/AndroidStyles.ts) לפרטים.

## 👥 תפקידים במערכת

### Clown (ליצן)
- צפייה בפעילויות
- הצטרפות/עזיבת פעילויות
- עדכון פרופיל אישי
- קבלת התראות

### Organizer (מארגן)
- כל הרשאות הליצן
- יצירת פעילויות חדשות
- עריכת ומחיקת פעילויות

### Admin (מנהל)
- כל הרשאות המארגן
- אישור/דחיית ליצנים חדשים
- ניהול משתמשים
- גישה מלאה לכל הנתונים

## 🔔 מערכת התראות

### סוגי התראות:
- 🚨 פעילויות דחופות
- 📍 פעילויות באזור קרוב (מבוסס GPS/מיקום מועדף)
- 🎯 פעילויות באזור מועדף
- 👥 עדכוני השתתפות

### התאמה אישית:
משתמשים יכולים להגדיר:
- רדיוס קרבה (5-50 ק"מ)
- אזורים מועדפים (צפון/מרכז/דרום)
- שעות שקט
- סוגי התראות

## 📄 רישיון

© 2024 Simchat HaLev. All rights reserved.

## 🤝 תמיכה

לבעיות טכניות או שאלות, פנה למנהל המערכת.

---

**God bless! 🙏**

Made with ❤️ for the clowns who bring joy to children
