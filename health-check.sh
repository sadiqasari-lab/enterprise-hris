#!/bin/bash
#
# System Health Check Script
# Monitors all HRIS services and alerts on issues
#
# Usage: ./health-check.sh
# Cron: */5 * * * * /opt/hris/scripts/health-check.sh

set -e

# Configuration
API_URL="${API_URL:-http://localhost:3001}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-hris_db}"
DB_USER="${DB_USER:-hris_user}"
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
ALERT_EMAIL="${ALERT_EMAIL:-}"
LOG_FILE="/var/log/hris/health-check.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check function
check() {
    local name="$1"
    local command="$2"
    local critical="${3:-true}"
    
    ((TOTAL_CHECKS++))
    printf "%-40s ... " "$name"
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        ((PASSED_CHECKS++))
        return 0
    else
        if [ "$critical" = "true" ]; then
            echo -e "${RED}✗ FAILED${NC}"
            ((FAILED_CHECKS++))
            log "CRITICAL: $name failed"
        else
            echo -e "${YELLOW}⚠ WARNING${NC}"
            ((WARNING_CHECKS++))
            log "WARNING: $name warning"
        fi
        return 1
    fi
}

echo "========================================="
echo "HRIS System Health Check"
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="
echo ""

# 1. PostgreSQL Database
echo "📊 Database Services"
echo "-----------------------------------------"
check "PostgreSQL running" "systemctl is-active postgresql"
check "Database accessible" "PGPASSWORD=$PGPASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c 'SELECT 1'"
check "Database connections < 80%" "test \$(PGPASSWORD=$PGPASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc \"SELECT count(*) FROM pg_stat_activity WHERE datname='$DB_NAME'\") -lt 80"
check "Database size < 90% disk" "test \$(PGPASSWORD=$PGPASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc \"SELECT pg_database_size('$DB_NAME')\") -lt 9000000000" "false"

echo ""
echo "🔴 Redis Cache"
echo "-----------------------------------------"
check "Redis running" "systemctl is-active redis-server"
check "Redis responding" "redis-cli -h $REDIS_HOST -p $REDIS_PORT PING | grep -q PONG"
check "Redis memory < 80%" "test \$(redis-cli -h $REDIS_HOST -p $REDIS_PORT INFO memory | grep used_memory_rss: | cut -d: -f2 | tr -d '\r') -lt 800000000" "false"

echo ""
echo "🚀 Application Services"
echo "-----------------------------------------"
check "API service running" "pm2 describe hris-api | grep -q 'status.*online'"
check "Web service running" "pm2 describe hris-web | grep -q 'status.*online'"
check "API health endpoint" "curl -sf $API_URL/api/health"
check "Web homepage accessible" "curl -sf $WEB_URL | grep -q 'Enterprise HRIS'" "false"

echo ""
echo "🌐 Nginx Web Server"
echo "-----------------------------------------"
check "Nginx running" "systemctl is-active nginx"
check "Nginx config valid" "nginx -t"
check "SSL certificate valid" "test \$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/*/fullchain.pem 2>/dev/null | cut -d= -f2 | xargs -I {} date -d '{}' +%s) -gt \$(date +%s)" "false"

echo ""
echo "💾 System Resources"
echo "-----------------------------------------"
check "Disk usage < 80%" "test \$(df / | tail -1 | awk '{print \$5}' | sed 's/%//') -lt 80"
check "Memory usage < 85%" "test \$(free | grep Mem | awk '{print (\$3/\$2) * 100}' | cut -d. -f1) -lt 85"
check "CPU load < 4.0" "test \$(uptime | awk -F'load average:' '{print \$2}' | awk -F, '{print \$1}' | xargs | cut -d. -f1) -lt 4"
check "No zombie processes" "test \$(ps aux | grep -c 'defunct') -eq 0" "false"

echo ""
echo "🔐 Security Checks"
echo "-----------------------------------------"
check "Firewall active" "ufw status | grep -q 'Status: active'"
check "Fail2ban running" "systemctl is-active fail2ban" "false"
check "No root SSH" "grep -q '^PermitRootLogin no' /etc/ssh/sshd_config" "false"

echo ""
echo "📂 Backup Status"
echo "-----------------------------------------"
LATEST_BACKUP=$(find /opt/backups/database -name "hris_backup_*.sql.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2)
if [ -n "$LATEST_BACKUP" ]; then
    BACKUP_AGE=$(( ($(date +%s) - $(stat -c %Y "$LATEST_BACKUP")) / 3600 ))
    check "Backup exists < 24h old" "test $BACKUP_AGE -lt 24"
    check "Latest backup not empty" "test \$(stat -c%s '$LATEST_BACKUP') -gt 1000000"
else
    echo -e "Latest backup                            ... ${RED}✗ NOT FOUND${NC}"
    ((FAILED_CHECKS++))
fi

echo ""
echo "========================================="
echo "Health Check Summary"
echo "========================================="
echo "Total Checks:    $TOTAL_CHECKS"
echo -e "Passed:          ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Warnings:        ${YELLOW}$WARNING_CHECKS${NC}"
echo -e "Failed:          ${RED}$FAILED_CHECKS${NC}"

# Calculate health score
HEALTH_SCORE=$(( PASSED_CHECKS * 100 / TOTAL_CHECKS ))
echo ""
echo -n "Health Score:    "
if [ $HEALTH_SCORE -ge 95 ]; then
    echo -e "${GREEN}${HEALTH_SCORE}% - EXCELLENT${NC}"
    EXIT_CODE=0
elif [ $HEALTH_SCORE -ge 85 ]; then
    echo -e "${YELLOW}${HEALTH_SCORE}% - GOOD (some warnings)${NC}"
    EXIT_CODE=0
elif [ $HEALTH_SCORE -ge 70 ]; then
    echo -e "${YELLOW}${HEALTH_SCORE}% - DEGRADED${NC}"
    EXIT_CODE=1
else
    echo -e "${RED}${HEALTH_SCORE}% - CRITICAL${NC}"
    EXIT_CODE=2
fi

echo "========================================="

# Send alert email if critical
if [ $FAILED_CHECKS -gt 0 ] && [ -n "$ALERT_EMAIL" ]; then
    SUBJECT="HRIS Health Check FAILED - $FAILED_CHECKS critical issues"
    BODY="Health check completed at $(date).
    
Health Score: $HEALTH_SCORE%
Passed: $PASSED_CHECKS
Failed: $FAILED_CHECKS
Warnings: $WARNING_CHECKS

Please check the system immediately.

Log file: $LOG_FILE"
    
    echo "$BODY" | mail -s "$SUBJECT" "$ALERT_EMAIL"
    log "Alert email sent to $ALERT_EMAIL"
fi

exit $EXIT_CODE
