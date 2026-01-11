#!/bin/bash
# Deploy College Central to a specific college's Firebase project
# Usage: ./scripts/deploy-college.sh <college-id> [--preview]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}Usage:${NC} $0 <college-id> [--preview]"
    echo ""
    echo "Available colleges:"
    ls -1 colleges/ 2>/dev/null | grep -v template || echo "  (none)"
    exit 1
fi

COLLEGE=$1
PREVIEW=$([[ "$2" == "--preview" ]] && echo true || echo false)
ENV_FILE="colleges/$COLLEGE/.env.production"

if [ ! -d "colleges/$COLLEGE" ]; then
    echo -e "${RED}Error:${NC} College '$COLLEGE' not found"
    exit 1
fi

echo -e "${BLUE}Deploying College Central for:${NC} $COLLEGE"

# Load env
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" .env
elif [ -f "colleges/$COLLEGE/.env.production.template" ]; then
    echo -e "${RED}Error:${NC} Only template found. Create .env.production with actual values."
    exit 1
else
    echo -e "${RED}Error:${NC} No env file found"
    exit 1
fi

# Build
echo -e "${BLUE}Building...${NC}"
npm run build

# Get project ID
PROJECT_ID=$(grep VITE_FIREBASE_PROJECT_ID .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")

# Deploy
echo -e "${BLUE}Deploying to Firebase...${NC}"
if [ "$PREVIEW" = true ]; then
    firebase hosting:channel:deploy preview --project "$PROJECT_ID"
else
    firebase deploy --only hosting --project "$PROJECT_ID"
fi

rm -f .env
echo -e "${GREEN}✅ Deployed successfully!${NC}"
