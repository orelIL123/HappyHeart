# 🚀 מדריך פריסה לפרודקשן - שמחת הלב

## 📋 רשימת בדיקות לפני פריסה

### ✅ שלב 1: הכנות Firebase

#### 1.1 פריסת Security Rules
```bash
# פרוס את ה-Firestore Rules
firebase deploy --only firestore:rules

# פרוס את ה-Storage Rules
firebase deploy --only storage
```

**חשוב:** לאחר הפריסה, בדוק שהכללים עובדים:
- נסה להתחבר כמשתמש רגיל
- ודא שליצן מאושר יכול לראות פעילויות
- ודא שליצן לא מאושר לא יכול לגשת למערכת

#### 1.2 בדיקת Firebase Configuration
וודא שכל הקבצים הבאים קיימים (אבל לא ב-Git!):
- ✅ `.env` - משתני סביבה
- ✅ `google-services.json` - Android
- ✅ `GoogleService-Info-14.plist` - iOS
- ✅ `happyapp-b8d4d-firebase-adminsdk-*.json` - Admin SDK

---

### ✅ שלב 2: בנייה ופריסה ב-EAS

#### 2.1 Build Android (Preview/Production)
```bash
# Preview build (APK for testing)
npm run build:preview

# Production build (AAB for Play Store)
npm run build:production
```

#### 2.2 Build iOS (Preview/Production)
```bash
# Preview build (for TestFlight)
npm run build:preview:ios

# Production build (for App Store)
npm run build:production:ios
```

#### 2.3 Deploy OTA Updates
לאחר פרסום גרסה, ניתן לעדכן את האפליקציה ללא build חדש:

```bash
# Preview channel
npm run update:preview "תיאור העדכון"

# Production channel
npm run update:production "תיאור העדכון"
```

---

### ✅ שלב 3: בדיקות לפני פרסום

#### 3.1 בדיקות פונקציונליות
- [ ] הרשמה של ליצן חדש
- [ ] התחברות עם אימייל/טלפון
- [ ] יצירת פעילות חדשה (מארגן)
- [ ] הצטרפות לפעילות (ליצן)
- [ ] עדכון פרופיל משתמש
- [ ] העלאת תמונת פרופיל
- [ ] מערכת התראות
- [ ] מחיקה אוטומטית של פעילויות

#### 3.2 בדיקות אבטחה
- [ ] משתמש לא מחובר לא יכול לראות נתונים
- [ ] ליצן ממתין לאישור לא יכול לגשת למערכת
- [ ] רק מארגנים יכולים ליצור פעילויות
- [ ] ליצנים יכולים לערוך רק את הפרופיל שלהם

#### 3.3 בדיקות Android
מכשירים מומלצים לבדיקה:
- Samsung (One UI)
- Google Pixel (Stock Android)
- Xiaomi (MIUI)
- גרסאות Android: 10, 11, 12, 13, 14

בדוק במיוחד:
- [ ] כפתורים נראים טוב (לא חתוכים)
- [ ] טקסט RTL מיושר נכון
- [ ] Shadows נראים טוב
- [ ] Navigation bar לא חוסם תוכן

---

### ✅ שלב 4: פרסום ל-Stores

#### 4.1 Google Play Store
1. צור signed AAB:
   ```bash
   npm run build:production
   ```

2. העלה ל-Google Play Console
3. מלא פרטי האפליקציה:
   - כותרת: שמחת הלב
   - תיאור קצר וארוך
   - צילומי מסך (לפחות 2)
   - אייקון (512x512)
   - Feature Graphic

4. הגדר Privacy Policy (חובה!)
5. שלח לבדיקה

#### 4.2 Apple App Store
1. צור Production build:
   ```bash
   npm run build:production:ios
   ```

2. העלה דרך App Store Connect
3. מלא מטא-דאטה:
   - כותרת, תיאור, מילות מפתח
   - צילומי מסך (iPhone + iPad)
   - Privacy Policy URL
   - Support URL

4. שלח לבדיקה של Apple

---

## 🔐 אבטחה והרשאות

### משתני סביבה (.env)
**לעולם אל תשלח את הקובץ הזה ל-Git!**

בעת העברה בין מכונות, העתק את `.env.example` ל-`.env` ומלא ערכים אמיתיים.

### Firebase Admin SDK
הקובץ `*-firebase-adminsdk-*.json` מכיל מפתח פרטי.
- שמור אותו רק במחשב הפיתוח
- אם צריך להעלות לשרת - השתמש ב-Environment Variables

### EAS Secrets
להגדרת סודות ב-EAS Build:
```bash
eas secret:create --name FIREBASE_API_KEY --value "your_key_here"
```

---

## 📱 OTA Updates - עדכונים אוטומטיים

האפליקציה בודקת עדכונים:
- ✅ מיד בעת פתיחה
- ✅ כל 30 שניות בזמן שימוש

באנדרואיד - העדכון מתבצע אוטומטית ללא שאלה
ב-iOS - המשתמש מקבל התראה

---

## 🐛 Troubleshooting

### בעיה: "Permission Denied" ב-Firestore
**פתרון:**
1. בדוק שה-Rules נפרסו: `firebase deploy --only firestore:rules`
2. ודא שהמשתמש מחובר ומאושר
3. בדוק ב-Firebase Console שה-`approvalStatus` הוא `approved`

### בעיה: OTA Update לא עובד
**פתרון:**
1. ודא ש-`expo-updates` מותקן
2. בדוק שהגרסה ב-`app.json` תואמת ל-`runtimeVersion`
3. ראה לוגים: `npx expo-doctor`

### בעיה: Build נכשל ב-EAS
**פתרון:**
1. נקה cache: `eas build:clean`
2. ודא שהסודות מוגדרים: `eas secret:list`
3. בדוק שהקבצים הנדרשים קיימים

### בעיה: אנדרואיד נראה שונה מ-iOS
**פתרון:**
הקוד כבר מכיל תיקונים ב-`constants/AndroidStyles.ts`.
אם עדיין יש בעיה:
1. וודא שהקובץ מיובא בכל מסך
2. השתמש ב-`createShadow()` לצללים
3. השתמש ב-`androidTextFix` לטקסטים

---

## 📊 ניטור ובדיקות

### מומלץ להוסיף:
1. **Firebase Crashlytics** - דיווח קריסות
   ```bash
   npx expo install @react-native-firebase/crashlytics
   ```

2. **Firebase Analytics** - מעקב שימוש
   ```bash
   npx expo install @react-native-firebase/analytics
   ```

3. **Sentry** - ניטור שגיאות
   ```bash
   npx expo install @sentry/react-native
   ```

---

## 🎯 צ'קליסט פרסום סופי

לפני לחיצה על "Publish":

- [ ] כל הבדיקות הפונקציונליות עברו
- [ ] Firebase Rules נפרסו ונבדקו
- [ ] אין סודות ב-Git
- [ ] Privacy Policy זמין באתר
- [ ] צילומי מסך עודכנו
- [ ] האפליקציה נבדקה על מכשירים אמיתיים
- [ ] גרסה עודכנה ב-`app.json`
- [ ] Changelog מעודכן
- [ ] יש גיבוי של Firebase

---

## 📞 תמיכה

במקרה של בעיה:
1. בדוק את הלוגים: `npx expo start`
2. בדוק Firebase Console
3. בדוק EAS Build status: `eas build:list`

---

**God bless! 🙏 בהצלחה עם הפרסום!**
