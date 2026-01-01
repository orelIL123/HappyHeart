# מדריך בנייה ועדכוני OTA - happyHart

## תוכן עניינים
1. [הכנה ראשונית](#הכנה-ראשונית)
2. [בנייה ראשונה](#בנייה-ראשונה)
3. [עדכוני OTA](#עדכוני-ota)
4. [טיפים ושגיאות נפוצות](#טיפים-ושגיאות-נפוצות)

---

## הכנה ראשונית

### התקנת EAS CLI

התקן את כלי שורת הפקודה של EAS באופן גלובלי:

```bash
npm install -g eas-cli
```

### התחברות לחשבון Expo

התחבר לחשבון Expo שלך (או צור חשבון חדש):

```bash
npx eas login
```

אם אין לך חשבון, צור אחד ב-[expo.dev](https://expo.dev).

### הגדרת Firebase/Google Services

הפרויקט כבר מוגדר עם קובץ `google-services-12.json`. ודא שהקובץ קיים בתיקיית הבסיס של הפרויקט.

אם אתה צריך לעדכן את קובץ ה-Google Services:
1. היכנס ל-[Firebase Console](https://console.firebase.google.com)
2. בחר את הפרויקט שלך
3. הורד את קובץ `google-services.json` החדש
4. החלף את `google-services-12.json` בתיקיית הבסיס

### הגדרת Project ID

לפני הבנייה הראשונה, עדכן את ה-URL של עדכוני OTA ב-`app.json`:

1. הרץ את הפקודה הבאה כדי לקבל את ה-Project ID שלך:
   ```bash
   npx eas project:info
   ```

2. עדכן את השורה הבאה ב-`app.json`:
   ```json
   "updates": {
     "url": "https://u.expo.dev/YOUR_PROJECT_ID"
   }
   ```
   החלף `YOUR_PROJECT_ID` ב-ID האמיתי שקיבלת.

---

## בנייה ראשונה

### סוגי Build

הפרויקט מוגדר עם 3 פרופילי build:

#### 1. Development Build
- **מטרה**: פיתוח עם dev client
- **פורמט**: APK
- **שימוש**: להתקנה על מכשירים לפיתוח

```bash
npm run build:dev
```

או:

```bash
npx eas build --platform android --profile development
```

#### 2. Preview Build
- **מטרה**: בדיקות פנימיות
- **פורמט**: APK
- **שימוש**: לבדיקות לפני שחרור לייצור

```bash
npm run build:preview
```

או:

```bash
npx eas build --platform android --profile preview
```

#### 3. Production Build
- **מטרה**: שחרור לייצור
- **פורמט**: AAB (Android App Bundle)
- **שימוש**: להעלאה ל-Google Play Store

```bash
npm run build:production
```

או:

```bash
npx eas build --platform android --profile production
```

### תהליך הבנייה

1. **הרצת פקודת Build**
   ```bash
   npm run build:preview
   ```

2. **מעקב אחר התהליך**
   - ה-build מתבצע בענן של Expo
   - תוכל לעקוב אחר ההתקדמות בטרמינל
   - קישור לדף ה-build יופיע בטרמינל

3. **הורדת ה-Build**
   - כשה-build מסתיים, תקבל קישור להורדה
   - הורד את קובץ ה-APK/AAB
   - התקן על המכשיר שלך (APK) או העלה ל-Play Store (AAB)

### התקנת APK על מכשיר Android

1. הורד את קובץ ה-APK למכשיר שלך
2. אפשר "התקנה ממקורות לא ידועים" בהגדרות
3. פתח את קובץ ה-APK והתקן

---

## עדכוני OTA

### מהם עדכוני OTA?

OTA (Over-The-Air) Updates מאפשרים לך לשלוח עדכונים לאפליקציה ללא צורך בבנייה חדשה או העלאה ל-Play Store.

### מתי להשתמש ב-OTA?

✅ **מתאים ל-OTA:**
- שינויים ב-JavaScript/TypeScript
- עדכוני UI ועיצוב
- תיקוני באגים בקוד
- שינויי לוגיקה עסקית
- עדכוני תוכן

❌ **לא מתאים ל-OTA (דורש build חדש):**
- שינויים ב-native code
- הוספת/הסרת native dependencies
- שינויים ב-`app.json` שמשפיעים על native configuration
- שינויי הרשאות (permissions)
- עדכון גרסת Expo SDK

### שליחת עדכון OTA

#### לסביבת Preview

```bash
npm run update:preview "תיאור העדכון"
```

או:

```bash
npx eas update --branch preview --message "תיאור העדכון"
```

#### לסביבת Production

```bash
npm run update:production "תיאור העדכון"
```

או:

```bash
npx eas update --branch production --message "תיאור העדכון"
```

### ניהול Channels

כל build profile מקושר ל-channel מסוים:
- **development** → channel: development
- **preview** → channel: preview
- **production** → channel: production

כשאתה שולח עדכון ל-branch מסוים, רק המכשירים שמריצים build מה-profile המתאים יקבלו את העדכון.

### בדיקת עדכונים

האפליקציה מוגדרת לבדוק עדכונים בכל הפעלה (`checkOnLaunch: "ALWAYS"`).

אם תרצה לשנות את ההתנהגות, ערוך את `app.json`:

```json
"updates": {
  "checkOnLaunch": "WIFI_ONLY",  // או "NEVER"
  "fallbackToCacheTimeout": 0
}
```

---

## טיפים ושגיאות נפוצות

### טיפים חשובים

1. **Runtime Version**
   - הפרויקט משתמש ב-`"policy": "appVersion"`
   - זה אומר שה-runtime version תואם לגרסת האפליקציה ב-`app.json`
   - כשמשנים את הגרסה, צריך build חדש

2. **עדכון גרסה**
   - לפני build production חדש, עדכן את `version` ו-`versionCode` ב-`app.json`:
   ```json
   "version": "1.0.1",
   "android": {
     "versionCode": 2
   }
   ```

3. **בדיקות לפני שחרור**
   - תמיד בדוק ב-preview לפני production
   - שלח OTA update ל-preview ובדוק על מכשיר אמיתי
   - רק אחרי אימות, שלח ל-production

4. **גיבוי**
   - שמור את כל קבצי ה-APK/AAB שבנית
   - תעד איזה build שוחרר מתי

### שגיאות נפוצות ופתרונות

#### שגיאה: "Google Services file not found"

**פתרון:**
- ודא שקובץ `google-services-12.json` קיים בתיקיית הבסיס
- בדוק שהנתיב ב-`app.json` נכון:
  ```json
  "googleServicesFile": "./google-services-12.json"
  ```

#### שגיאה: "Package name already exists"

**פתרון:**
- שנה את ה-package name ב-`app.json`:
  ```json
  "android": {
    "package": "com.yourcompany.happyhart"
  }
  ```

#### שגיאה: "Update is incompatible with the current runtime"

**פתרון:**
- זה קורה כשה-runtime version לא תואם
- צריך לבנות build חדש עם הגרסה המעודכנת
- לא ניתן לפתור עם OTA update

#### Build נכשל עם שגיאת Gradle

**פתרון:**
1. נקה את ה-cache:
   ```bash
   npx expo start --clear
   ```
2. נסה build שוב
3. אם עדיין נכשל, בדוק את הלוגים בקונסול של EAS

#### OTA Update לא מתקבל במכשיר

**פתרון:**
1. ודא שהמכשיר מחובר לאינטרנט
2. בדוק שה-channel נכון (preview/production)
3. סגור את האפליקציה לחלוטין ופתח מחדש
4. בדוק את הלוגים:
   ```bash
   npx expo start
   ```

---

## פקודות מהירות

### Build
```bash
# Development
npm run build:dev

# Preview
npm run build:preview

# Production
npm run build:production
```

### OTA Updates
```bash
# Preview
npm run update:preview "תיאור העדכון"

# Production
npm run update:production "תיאור העדכון"
```

### מידע על הפרויקט
```bash
# קבלת Project ID
npx eas project:info

# רשימת builds
npx eas build:list

# רשימת updates
npx eas update:list
```

---

## תמיכה ומשאבים

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Updates Documentation](https://docs.expo.dev/versions/latest/sdk/updates/)
- [EAS CLI Reference](https://docs.expo.dev/eas/cli/)
- [Firebase Console](https://console.firebase.google.com)
- [Expo Dashboard](https://expo.dev)

---

**הצלחה! 🚀**
