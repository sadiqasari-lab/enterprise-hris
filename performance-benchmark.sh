#!/bin/bash
#
# Performance Benchmarking Script
# Tests API endpoints and database query performance
#
# Usage: ./performance-benchmark.sh

set -e

API_URL="${API_URL:-http://localhost:3001/api}"
BENCHMARK_RUNS="${BENCHMARK_RUNS:-100}"
CONCURRENCY="${CONCURRENCY:-10}"

echo "========================================="
echo "HRIS Performance Benchmark"
echo "========================================="
echo "API URL: $API_URL"
echo "Runs: $BENCHMARK_RUNS"
echo "Concurrency: $CONCURRENCY"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Login first to get token
echo "🔐 Authenticating..."
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"hr.admin@alnoor.com","password":"Hris2026!"}' \
  | jq -r '.data.tokens.accessToken')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "❌ Authentication failed. Check credentials and API URL."
    exit 1
fi
echo "✓ Authenticated"
echo ""

# Function to run benchmark
benchmark() {
    local name="$1"
    local url="$2"
    local method="${3:-GET}"
    
    echo "Testing: $name"
    
    local result=$(ab -n $BENCHMARK_RUNS -c $CONCURRENCY -H "Authorization: Bearer $TOKEN" "$url" 2>&1)
    
    local req_per_sec=$(echo "$result" | grep "Requests per second" | awk '{print $4}')
    local mean_time=$(echo "$result" | grep "Time per request.*mean" | head -1 | awk '{print $4}')
    local p95_time=$(echo "$result" | grep "95%" | awk '{print $2}')
    local failed=$(echo "$result" | grep "Failed requests" | awk '{print $3}')
    
    printf "  Requests/sec:  %s\n" "$req_per_sec"
    printf "  Mean time:     %s ms\n" "$mean_time"
    printf "  95th %ile:     %s ms\n" "$p95_time"
    
    if [ "$failed" -eq 0 ]; then
        echo -e "  Failed:        ${GREEN}0${NC}"
    else
        echo -e "  Failed:        ${RED}$failed${NC}"
    fi
    
    # Performance rating
    local mean_int=$(printf "%.0f" "$mean_time")
    if [ "$mean_int" -lt 100 ]; then
        echo -e "  Rating:        ${GREEN}EXCELLENT${NC}"
    elif [ "$mean_int" -lt 200 ]; then
        echo -e "  Rating:        ${GREEN}GOOD${NC}"
    elif [ "$mean_int" -lt 500 ]; then
        echo -e "  Rating:        ${YELLOW}ACCEPTABLE${NC}"
    else
        echo -e "  Rating:        ${RED}NEEDS OPTIMIZATION${NC}"
    fi
    
    echo ""
}

echo "📊 API Endpoint Benchmarks"
echo "-----------------------------------------"

benchmark "Health Check" "$API_URL/health"
benchmark "Auth Profile" "$API_URL/auth/profile"
benchmark "List Employees" "$API_URL/employees?limit=20"
benchmark "Leave Types" "$API_URL/leave/types"
benchmark "Leave Balances" "$API_URL/leave/balances/my"
benchmark "Departments" "$API_URL/employees/departments"

echo ""
echo "💾 Database Query Benchmarks"
echo "-----------------------------------------"

# Database benchmark
if command -v psql > /dev/null; then
    DB_NAME="${DB_NAME:-hris_db}"
    DB_USER="${DB_USER:-hris_user}"
    
    echo "Testing: Count Active Employees"
    time_start=$(date +%s%3N)
    PGPASSWORD="$PGPASSWORD" psql -h localhost -U $DB_USER -d $DB_NAME -tAc "
        SELECT COUNT(*) FROM employees WHERE status = 'ACTIVE'
    " > /dev/null
    time_end=$(date +%s%3N)
    duration=$((time_end - time_start))
    echo "  Query time: ${duration}ms"
    
    if [ $duration -lt 50 ]; then
        echo -e "  Rating: ${GREEN}EXCELLENT${NC}"
    elif [ $duration -lt 100 ]; then
        echo -e "  Rating: ${GREEN}GOOD${NC}"
    else
        echo -e "  Rating: ${YELLOW}NEEDS INDEX${NC}"
    fi
    echo ""
    
    echo "Testing: Join Query (Employees + Departments)"
    time_start=$(date +%s%3N)
    PGPASSWORD="$PGPASSWORD" psql -h localhost -U $DB_USER -d $DB_NAME -tAc "
        SELECT e.first_name, d.name 
        FROM employees e 
        JOIN departments d ON e.department_id = d.id 
        LIMIT 100
    " > /dev/null
    time_end=$(date +%s%3N)
    duration=$((time_end - time_start))
    echo "  Query time: ${duration}ms"
    
    if [ $duration -lt 100 ]; then
        echo -e "  Rating: ${GREEN}EXCELLENT${NC}"
    elif [ $duration -lt 200 ]; then
        echo -e "  Rating: ${GREEN}GOOD${NC}"
    else
        echo -e "  Rating: ${YELLOW}NEEDS OPTIMIZATION${NC}"
    fi
    echo ""
fi

echo "========================================="
echo "Benchmark Complete"
echo "========================================="
echo ""
echo "💡 Performance Tips:"
echo "  - API responses < 200ms = GOOD"
echo "  - Database queries < 50ms = EXCELLENT"
echo "  - Add indexes if queries > 100ms"
echo "  - Enable Redis caching for read-heavy endpoints"
echo "  - Use CDN for static assets"
echo ""
