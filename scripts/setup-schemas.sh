#!/bin/bash

# Schema Setup Script for MedSystem
# This script configures all module schemas in the backend via API
# Usage: ./setup-schemas.sh <tenant_id> <api_url> <username> <password>

set -e

TENANT_ID="${1:-default_tenant}"
API_URL="${2:-http://localhost:3000}"
USERNAME="${3:-admin}"
PASSWORD="${4:-Admin123!}"

echo "=================================================="
echo "MedSystem Schema Configuration Setup"
echo "=================================================="
echo "Tenant ID: $TENANT_ID"
echo "API URL: $API_URL"
echo ""

# Step 1: Get JWT Token
echo "Step 1: Authenticating..."
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}" | jq -r '.access_token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "ERROR: Failed to authenticate. Check credentials and API URL."
  exit 1
fi

echo "✓ Authentication successful"
echo ""

# Step 2: Create Schemas
MODULES=("vendors" "purchase-orders" "sales-orders" "inventory" "doctors" "patients" "diagnostics" "hospital-billing")
SCHEMA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/schema-configs"

echo "Step 2: Creating field configurations..."
echo ""

for MODULE in "${MODULES[@]}"; do
  SCHEMA_FILE="$SCHEMA_DIR/$MODULE.json"

  if [ ! -f "$SCHEMA_FILE" ]; then
    echo "⚠ Warning: Schema file not found for module '$MODULE': $SCHEMA_FILE"
    continue
  fi

  echo "Setting up schema for: $MODULE"

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/tenants/$TENANT_ID/config/$MODULE/fields" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d @"$SCHEMA_FILE")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
  BODY=$(echo "$RESPONSE" | head -n -1)

  if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "  ✓ $MODULE schema configured successfully"
  else
    echo "  ✗ Failed to configure $MODULE (HTTP $HTTP_CODE)"
    echo "  Response: $BODY"
  fi
done

echo ""
echo "Step 3: Verifying configurations..."
echo ""

for MODULE in "${MODULES[@]}"; do
  RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/tenants/$TENANT_ID/schema?module=$MODULE" \
    -H "Authorization: Bearer $TOKEN")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
  BODY=$(echo "$RESPONSE" | head -n -1)

  if [ "$HTTP_CODE" = "200" ]; then
    FIELD_COUNT=$(echo "$BODY" | jq 'length')
    echo "  ✓ $MODULE: $FIELD_COUNT fields configured"
  else
    echo "  ✗ Failed to verify $MODULE (HTTP $HTTP_CODE)"
  fi
done

echo ""
echo "=================================================="
echo "Schema setup complete!"
echo "=================================================="
echo ""
echo "Next Steps:"
echo "1. Verify schemas in the UI"
echo "2. Create seed data for each module"
echo "3. Test frontend-backend integration"
echo ""
echo "For more information, see: SCHEMA_CONFIGURATION_GUIDE.md"
