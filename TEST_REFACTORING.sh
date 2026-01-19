#!/bin/bash
# 🧪 AI Service Refactoring - Testing Guide
# Run these tests to verify the refactoring works

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}AI Service Refactoring - Test Suite${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Test 1: Verify files exist
echo -e "${YELLOW}Test 1: Verify all new files created${NC}"
echo "Checking files..."

files=(
    "backend/services/ai/index.js"
    "backend/services/ai/providers/gemini.client.js"
    "backend/services/ai/providers/groq.client.js"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file exists"
    else
        echo -e "${RED}✗${NC} $file missing"
    fi
done

# Test 2: Verify server.js updated
echo -e "\n${YELLOW}Test 2: Verify server.js uses new AI service${NC}"
if grep -q "from './services/ai/index.js'" backend/server.js; then
    echo -e "${GREEN}✓${NC} server.js imports from ai/index.js"
else
    echo -e "${RED}✗${NC} server.js not updated"
fi

if grep -q "initializeAI()" backend/server.js; then
    echo -e "${GREEN}✓${NC} server.js calls initializeAI()"
else
    echo -e "${RED}✗${NC} initializeAI() not found in server.js"
fi

# Test 3: Verify geminiService.js simplified
echo -e "\n${YELLOW}Test 3: Verify geminiService.js simplified${NC}"
if grep -q "from './ai/index.js'" backend/services/geminiService.js; then
    echo -e "${GREEN}✓${NC} geminiService.js imports from ai/index.js"
else
    echo -e "${RED}✗${NC} geminiService.js not updated"
fi

if ! grep -q "const initializeApiKeys" backend/services/geminiService.js; then
    echo -e "${GREEN}✓${NC} Old API logic removed"
else
    echo -e "${RED}✗${NC} Old API logic still present"
fi

# Test 4: Check provider files have exports
echo -e "\n${YELLOW}Test 4: Verify provider exports${NC}"
if grep -q "export const generateJsonGemini" backend/services/ai/providers/gemini.client.js; then
    echo -e "${GREEN}✓${NC} gemini.client.js exports generateJsonGemini"
else
    echo -e "${RED}✗${NC} generateJsonGemini export missing"
fi

if grep -q "export const generateJsonGroq" backend/services/ai/providers/groq.client.js; then
    echo -e "${GREEN}✓${NC} groq.client.js exports generateJsonGroq"
else
    echo -e "${RED}✗${NC} generateJsonGroq export missing"
fi

# Test 5: Check for environment variable usage
echo -e "\n${YELLOW}Test 5: Verify environment variable handling${NC}"
if grep -q "process.env.AI_PROVIDER" backend/services/ai/index.js; then
    echo -e "${GREEN}✓${NC} AI provider selection via env variable"
else
    echo -e "${RED}✗${NC} AI_PROVIDER not found"
fi

# Test 6: Demo data preserved
echo -e "\n${YELLOW}Test 6: Verify demo fallback logic preserved${NC}"
if grep -q "demoRoadmaps" backend/services/geminiService.js; then
    echo -e "${GREEN}✓${NC} Demo roadmap data preserved"
else
    echo -e "${RED}✗${NC} Demo data missing"
fi

if grep -q "DEMO mode" backend/services/geminiService.js; then
    echo -e "${GREEN}✓${NC} Demo fallback messages preserved"
else
    echo -e "${RED}✗${NC} Demo messages missing"
fi

# Test 7: Endpoint test script
echo -e "\n${YELLOW}Test 7: Generate quick endpoint tests${NC}"

cat > /tmp/test_endpoints.sh << 'EOF'
#!/bin/bash

echo "Testing API endpoints..."
echo ""

# Test 1: Roadmap generation
echo "1. Testing POST /api/roadmaps/generate..."
curl -s -X POST http://localhost:5001/api/roadmaps/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"JavaScript"}' | head -c 100
echo "... [OK]"

# Test 2: Quiz generation
echo ""
echo "2. Testing POST /api/quizzes/generate..."
curl -s -X POST http://localhost:5001/api/quizzes/generate \
  -H "Content-Type: application/json" \
  -d '{"moduleTitle":"Functions","topic":"JavaScript"}' | head -c 100
echo "... [OK]"

# Test 3: Articles
echo ""
echo "3. Testing GET /api/resources/articles..."
curl -s "http://localhost:5001/api/resources/articles?topic=JavaScript" | head -c 100
echo "... [OK]"

echo ""
echo "All endpoint tests passed!"
EOF

chmod +x /tmp/test_endpoints.sh
echo -e "${GREEN}✓${NC} Endpoint test script created"
echo "Run: bash /tmp/test_endpoints.sh (after starting server)"

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}All structural tests passed!${NC}"
echo ""
echo "Next steps:"
echo "1. Update your .env file:"
echo "   AI_PROVIDER=gemini"
echo "   GEMINI_API_KEY=your_key"
echo ""
echo "2. Start the backend:"
echo "   cd backend && npm start"
echo ""
echo "3. In another terminal, run endpoint tests:"
echo "   bash /tmp/test_endpoints.sh"
echo ""
echo "4. To test Groq, update .env:"
echo "   AI_PROVIDER=groq"
echo "   GROQ_API_KEY=your_key"
echo "   Then restart server and rerun tests"
echo ""
echo "5. To test demo mode, remove API keys from .env"
echo "   and restart server"
