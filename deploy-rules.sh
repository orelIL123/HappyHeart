#!/bin/bash

# 🚀 Deploy Firebase Security Rules
# שימוש: ./deploy-rules.sh

echo "🔐 מפרוס Firebase Security Rules..."
echo ""

# בדיקה אם firebase-tools מותקן
if ! command -v firebase &> /dev/null
then
    echo "❌ Firebase CLI לא מותקן!"
    echo "התקן עם: npm install -g firebase-tools"
    exit 1
fi

# בדיקה אם מחובר ל-Firebase
if ! firebase projects:list &> /dev/null
then
    echo "❌ לא מחובר ל-Firebase!"
    echo "התחבר עם: firebase login"
    exit 1
fi

echo "✅ Firebase CLI מוכן"
echo ""

# הצגת הפרויקט הנוכחי
echo "📋 פרויקט נוכחי:"
firebase use

echo ""
echo "🔄 מפרוס Firestore Rules..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo "✅ Firestore Rules נפרסו בהצלחה!"
else
    echo "❌ שגיאה בפריסת Firestore Rules"
    exit 1
fi

echo ""
echo "🔄 מפרוס Storage Rules..."
firebase deploy --only storage

if [ $? -eq 0 ]; then
    echo "✅ Storage Rules נפרסו בהצלחה!"
else
    echo "❌ שגיאה בפריסת Storage Rules"
    exit 1
fi

echo ""
echo "🎉 כל ה-Rules נפרסו בהצלחה!"
echo ""
echo "📝 בדיקות מומלצות:"
echo "  1. נסה להתחבר כמשתמש רגיל"
echo "  2. ודא שליצן מאושר יכול לראות פעילויות"
echo "  3. ודא שרק מארגנים יכולים ליצור פעילויות"
echo "  4. בדוק שמשתמשים יכולים להוסיף לייקים ותגובות"
echo "  5. ודא שמנהלים יכולים למחוק תגובות"
echo ""
echo "God bless! 🙏"
