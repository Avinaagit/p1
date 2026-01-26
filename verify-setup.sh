#!/bin/bash

# Employee Pulse System - Setup Verification Script
# This script checks if all components are properly set up

echo "======================================"
echo "Employee Pulse System Setup Verification"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
PASSED=0
FAILED=0

# Check Node.js
echo "1. Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION${NC}"
    PASSED=$((PASSED+1))
else
    echo -e "${RED}✗ Node.js not found. Please install Node.js 18+${NC}"
    FAILED=$((FAILED+1))
fi

# Check npm
echo ""
echo "2. Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm installed: $NPM_VERSION${NC}"
    PASSED=$((PASSED+1))
else
    echo -e "${RED}✗ npm not found${NC}"
    FAILED=$((FAILED+1))
fi

# Check dependencies
echo ""
echo "3. Checking npm dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ node_modules directory exists${NC}"
    PASSED=$((PASSED+1))
    
    # Check specific packages
    echo ""
    echo "   Checking key packages:"
    for package in "@prisma/client" "next" "react" "jose" "sentiment" "compromise"; do
        if npm list "$package" > /dev/null 2>&1; then
            VERSION=$(npm list "$package" 2>/dev/null | grep "$package" | head -1 | awk '{print $2}')
            echo -e "   ${GREEN}✓${NC} $package@$VERSION"
        else
            echo -e "   ${RED}✗${NC} $package not installed"
        fi
    done
else
    echo -e "${YELLOW}⚠ node_modules not found. Run: npm install${NC}"
    FAILED=$((FAILED+1))
fi

# Check environment file
echo ""
echo "4. Checking .env.local..."
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓ .env.local exists${NC}"
    PASSED=$((PASSED+1))
    
    # Check specific variables
    echo ""
    echo "   Checking environment variables:"
    
    if grep -q "DATABASE_URL=" .env.local; then
        echo -e "   ${GREEN}✓${NC} DATABASE_URL configured"
    else
        echo -e "   ${RED}✗${NC} DATABASE_URL not found - configure MSSQL connection"
    fi
    
    if grep -q "JWT_SECRET=" .env.local; then
        echo -e "   ${GREEN}✓${NC} JWT_SECRET configured"
    else
        echo -e "   ${RED}✗${NC} JWT_SECRET missing"
    fi
else
    echo -e "${YELLOW}⚠ .env.local not found${NC}"
    FAILED=$((FAILED+1))
fi

# Check Prisma schema
echo ""
echo "5. Checking Prisma setup..."
if [ -f "prisma/schema.prisma" ]; then
    echo -e "${GREEN}✓ Prisma schema found${NC}"
    PASSED=$((PASSED+1))
    
    MODELS=$(grep "^model " prisma/schema.prisma | wc -l)
    echo "   Models defined: $MODELS"
else
    echo -e "${RED}✗ Prisma schema not found${NC}"
    FAILED=$((FAILED+1))
fi

# Check project structure
echo ""
echo "6. Checking project structure..."
STRUCTURE_OK=true

for dir in "app/api/v1" "app/_lib" "app/_components" "app/dashboard" "app/surveys" "app/tasks" "app/analytics" "prisma"; do
    if [ -d "$dir" ]; then
        echo -e "   ${GREEN}✓${NC} $dir/"
    else
        echo -e "   ${RED}✗${NC} $dir/ missing"
        STRUCTURE_OK=false
    fi
done

if [ "$STRUCTURE_OK" = true ]; then
    PASSED=$((PASSED+1))
else
    FAILED=$((FAILED+1))
fi

# Check API routes
echo ""
echo "7. Checking API routes..."
API_OK=true

for route in "auth/login" "surveys" "analytics" "tasks" "exports"; do
    if [ -d "app/api/v1/$route" ] || [ -f "app/api/v1/$route/route.ts" ]; then
        echo -e "   ${GREEN}✓${NC} /api/v1/$route/"
    else
        echo -e "   ${RED}✗${NC} /api/v1/$route/ missing"
        API_OK=false
    fi
done

if [ "$API_OK" = true ]; then
    PASSED=$((PASSED+1))
else
    FAILED=$((FAILED+1))
fi

# Check components
echo ""
echo "8. Checking React components..."
COMPONENTS_OK=true

for component in "LoginForm" "SurveyList" "EngagementDashboard" "TaskList" "Navigation"; do
    if [ -f "app/_components/${component}.tsx" ]; then
        echo -e "   ${GREEN}✓${NC} ${component}.tsx"
    else
        echo -e "   ${RED}✗${NC} ${component}.tsx missing"
        COMPONENTS_OK=false
    fi
done

if [ "$COMPONENTS_OK" = true ]; then
    PASSED=$((PASSED+1))
else
    FAILED=$((FAILED+1))
fi

# Check utilities
echo ""
echo "9. Checking utility libraries..."
UTILS_OK=true

for util in "auth" "db" "rbac" "dal" "nlp"; do
    if [ -f "app/_lib/${util}.ts" ]; then
        echo -e "   ${GREEN}✓${NC} ${util}.ts"
    else
        echo -e "   ${RED}✗${NC} ${util}.ts missing"
        UTILS_OK=false
    fi
done

if [ "$UTILS_OK" = true ]; then
    PASSED=$((PASSED+1))
else
    FAILED=$((FAILED+1))
fi

# Check documentation
echo ""
echo "10. Checking documentation..."
DOC_OK=true

for doc in "SYSTEM_DOCUMENTATION.md" "QUICKSTART.md" "IMPLEMENTATION_SUMMARY.md"; do
    if [ -f "$doc" ]; then
        echo -e "   ${GREEN}✓${NC} $doc"
    else
        echo -e "   ${RED}✗${NC} $doc missing"
        DOC_OK=false
    fi
done

if [ "$DOC_OK" = true ]; then
    PASSED=$((PASSED+1))
else
    FAILED=$((FAILED+1))
fi

# Final summary
echo ""
echo "======================================"
echo "Verification Summary"
echo "======================================"
echo -e "${GREEN}✓ Passed: $PASSED${NC}"
echo -e "${RED}✗ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! System is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Update DATABASE_URL in .env.local with your MSSQL connection"
    echo "2. Run: npm run db:migrate"
    echo "3. Run: npm run db:seed"
    echo "4. Run: npm run dev"
    echo "5. Visit: http://localhost:3000"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please fix issues above.${NC}"
    exit 1
fi
