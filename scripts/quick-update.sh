#!/bin/bash

# Quick Update Script for EAS
# This script helps you push updates quickly to your users

set -e

echo "🚀 Quick Update Script for HappyHart"
echo "=================================="
echo ""

# Check if message is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide an update message"
    echo ""
    echo "Usage: ./scripts/quick-update.sh \"Your update message\""
    echo ""
    echo "Examples:"
    echo "  ./scripts/quick-update.sh \"Fixed Android UI issues\""
    echo "  ./scripts/quick-update.sh \"Added new feature\""
    exit 1
fi

MESSAGE="$1"
BRANCH="${2:-preview}"

echo "📝 Update Message: $MESSAGE"
echo "🌿 Target Branch: $BRANCH"
echo ""

# Confirm
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "📦 Publishing update to EAS..."
eas update --branch "$BRANCH" --message "$MESSAGE"

echo ""
echo "✅ Update published successfully!"
echo ""
echo "📱 Users will receive the update within 30-60 seconds"
echo "   - Android: Auto-install"
echo "   - iOS: Prompt to install"
echo ""
echo "🔍 Check status: https://expo.dev/accounts/orel_895/projects/happyHart/updates"
