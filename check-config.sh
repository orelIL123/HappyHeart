#!/bin/bash

# 🔍 בדיקת קונפיגורציה - שמחת הלב
# שימוש: ./check-config.sh

echo "🔍 בודק קונפיגורציה של האפליקציה..."
echo ""

# צבעים
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# מונה בעיות
ERRORS=0
WARNINGS=0

# פונקציה לבדיקת קובץ
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1 קיים"
    else
        echo -e "${RED}❌${NC} $1 חסר!"
        ERRORS=$((ERRORS + 1))
    fi
}

# פונקציה לבדיקת קובץ שלא צריך להיות ב-git
check_secret_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1 קיים"
        # בדיקה אם בגיט
        if git ls-files --error-unmatch "$1" 2> /dev/null; then
            echo -e "${RED}⚠️  אזהרה: $1 ב-Git! זה קובץ סודי!${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${YELLOW}⚠️${NC} $1 חסר (אבל אולי זה בסדר בפיתוח)"
        WARNINGS=$((WARNINGS + 1))
    fi
}

echo "📁 בדיקת קבצי קונפיגורציה:"
echo "================================"
check_file "app.json"
check_file "eas.json"
check_file "firebase.json"
check_file "package.json"
check_file ".gitignore"
check_file "firestore.rules"
check_file "storage.rules"

echo ""
echo "🔐 בדיקת קבצים סודיים:"
echo "================================"
check_secret_file ".env"
check_secret_file "google-services.json"
check_secret_file "GoogleService-Info-14.plist"

echo ""
echo "📋 בדיקת תיעוד:"
echo "================================"
check_file "README.md"
check_file "DEPLOYMENT.md"
check_file "TEST_CHECKLIST.md"
check_file ".env.example"

echo ""
echo "🔧 בדיקת משתני סביבה:"
echo "================================"
if [ -f ".env" ]; then
    required_vars=("EXPO_PUBLIC_FIREBASE_API_KEY" "EXPO_PUBLIC_FIREBASE_PROJECT_ID" "EXPO_PUBLIC_FIREBASE_APP_ID")
    for var in "${required_vars[@]}"; do
        if grep -q "$var=" .env; then
            value=$(grep "$var=" .env | cut -d '=' -f2)
            if [ -n "$value" ] && [ "$value" != "your_api_key_here" ] && [ "$value" != "your_project_id" ]; then
                echo -e "${GREEN}✅${NC} $var מוגדר"
            else
                echo -e "${RED}❌${NC} $var לא מוגדר נכון!"
                ERRORS=$((ERRORS + 1))
            fi
        else
            echo -e "${RED}❌${NC} $var חסר מ-.env!"
            ERRORS=$((ERRORS + 1))
        fi
    done
else
    echo -e "${RED}❌${NC} קובץ .env לא קיים!"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "📦 בדיקת packages:"
echo "================================"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅${NC} node_modules קיים"
else
    echo -e "${YELLOW}⚠️${NC} node_modules לא קיים - הרץ npm install"
    WARNINGS=$((WARNINGS + 1))
fi

# בדיקת packages חשובים
packages=("firebase" "expo" "expo-router" "react-native")
for pkg in "${packages[@]}"; do
    if grep -q "\"$pkg\":" package.json; then
        echo -e "${GREEN}✅${NC} $pkg מותקן"
    else
        echo -e "${RED}❌${NC} $pkg חסר!"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "🔥 בדיקת Firebase Rules:"
echo "================================"
if [ -f "firestore.rules" ]; then
    # בדיקה אם יש "allow read, write: if true" - מסוכן!
    if grep -q "allow read, write: if true" firestore.rules; then
        echo -e "${RED}⚠️  אזהרה: Firestore Rules פתוחות לגמרי! מסוכן לפרודקשן!${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✅${NC} Firestore Rules נראות מאובטחות"
    fi
fi

if [ -f "storage.rules" ]; then
    if grep -q "allow read, write: if true" storage.rules; then
        echo -e "${RED}⚠️  אזהרה: Storage Rules פתוחות לגמרי! מסוכן לפרודקשן!${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✅${NC} Storage Rules נראות מאובטחות"
    fi
fi

echo ""
echo "================================"
echo "סיכום:"
echo "================================"
echo -e "❌ שגיאות: ${RED}$ERRORS${NC}"
echo -e "⚠️  אזהרות: ${YELLOW}$WARNINGS${NC}"

echo ""
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 הכל נראה מצוין! האפליקציה מוכנה לפיתוח/פרסום${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  יש כמה אזהרות, אבל ניתן להמשיך${NC}"
    exit 0
else
    echo -e "${RED}❌ יש שגיאות שצריך לתקן לפני המשך!${NC}"
    exit 1
fi
