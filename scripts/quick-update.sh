#!/bin/bash

# Quick Update Script for EAS
# This script helps you push updates quickly to your users.
# חשוב: לשלוח גם ל-production (אנדרואיד) – לא רק ל-preview!

set -e

echo "🚀 Quick Update Script for HappyHart"
echo "=================================="
echo ""

# Check if message is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide an update message"
    echo ""
    echo "Usage: ./scripts/quick-update.sh \"Your update message\" [branch]"
    echo ""
    echo "Branches: preview | production | both"
    echo "  preview    - רק ערוץ בדיקות (ברירת מחדל)"
    echo "  production - פרודקשן (כולל אנדרואיד בחנות)"
    echo "  both       - קודם preview ואז production (מומלץ אחרי בדיקה)"
    echo ""
    echo "Examples:"
    echo "  ./scripts/quick-update.sh \"Fixed bug\""
    echo "  ./scripts/quick-update.sh \"New feature\" production"
    echo "  ./scripts/quick-update.sh \"Release\" both"
    exit 1
fi

MESSAGE="$1"
BRANCH="${2:-preview}"

echo "📝 Update Message: $MESSAGE"
echo "🌿 Target: $BRANCH"
echo ""

if [ "$BRANCH" = "both" ]; then
    echo "📌 יישלח ל-preview ואז ל-production (כולל אנדרואיד)"
    echo ""
fi

# Confirm
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

if [ "$BRANCH" = "both" ]; then
    echo ""
    echo "📦 Publishing to preview..."
    eas update --branch preview --message "$MESSAGE"
    echo ""
    echo "📦 Publishing to production (Android + iOS)..."
    eas update --branch production --message "$MESSAGE"
else
    echo ""
    echo "📦 Publishing update to EAS..."
    eas update --branch "$BRANCH" --message "$MESSAGE"
fi

echo ""
echo "✅ Update published successfully!"
echo ""
echo "📱 Users will receive the update within 30-60 seconds"
echo "   - Android: Auto-install"
echo "   - iOS: Prompt to install"
if [ "$BRANCH" = "preview" ]; then
    echo ""
    echo "⚠️  נשלח רק ל-preview. לשלוח גם לאנדרואיד פרודקשן:"
    echo "   ./scripts/quick-update.sh \"$MESSAGE\" production"
    echo "   או: npm run update:production \"$MESSAGE\""
fi
echo ""
echo "🔍 Check status: https://expo.dev/accounts/orel_895/projects/happyHart/updates"
