# Release Management Guide

Comprehensive release procedures for Enterprise HRIS Platform.

---

## Release Cycle

### Schedule

- **Major Releases (X.0.0)**: Annually (Q1)
- **Minor Releases (1.X.0)**: Quarterly
- **Patch Releases (1.1.X)**: As needed (critical bugs, security)

### Version Numbering (SemVer)

```
MAJOR.MINOR.PATCH

MAJOR: Breaking changes, major new features
MINOR: New features, backward compatible
PATCH: Bug fixes, security patches
```

**Examples:**
- `1.0.0` → `2.0.0`: Breaking API changes
- `1.0.0` → `1.1.0`: New recruitment module
- `1.0.0` → `1.0.1`: Bug fix for leave calculation

---

## Release Process

### Phase 1: Planning (T-4 weeks)

**Week 1: Requirements Gathering**

1. Review feature requests and bug reports
2. Prioritize using MoSCoW method:
   - **Must Have**: Critical features/fixes
   - **Should Have**: Important but not critical
   - **Could Have**: Nice to have
   - **Won't Have**: Out of scope

3. Create release milestone in GitHub
4. Assign issues to milestone

**Week 2: Design & Specification**

1. Technical design documents for new features
2. Database migration planning
3. API changes documentation
4. Security review for new features

---

### Phase 2: Development (T-3 to T-1 weeks)

**Development Guidelines:**

```bash
# Create release branch from main
git checkout main
git pull origin main
git checkout -b release/v1.1.0

# Feature branches merge into release branch
git checkout -b feature/new-training-module release/v1.1.0
# ... develop feature
git push origin feature/new-training-module
# Create PR to release/v1.1.0
```

**Code Review Checklist:**
- [ ] Code follows style guide
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.logs or debug code
- [ ] TypeScript types properly defined
- [ ] Error handling implemented
- [ ] Performance considered
- [ ] Security reviewed

**Continuous Testing:**
```bash
# Run on every commit
pnpm test

# Run before PR approval
pnpm test:coverage
pnpm lint
pnpm type-check
```

---

### Phase 3: Testing (T-1 week)

**Week Before Release:**

**1. Integration Testing**
```bash
# Deploy to staging environment
git checkout release/v1.1.0
pnpm install
pnpm build
pnpm migrate:staging

# Run full test suite
pnpm test:integration
pnpm test:e2e
```

**2. User Acceptance Testing (UAT)**
- Share staging environment with stakeholders
- Provide test accounts
- Collect feedback
- Document bugs

**3. Performance Testing**
```bash
# Load testing
k6 run tests/load/api-load-test.js

# Database performance
EXPLAIN ANALYZE queries
Review slow query log

# Frontend performance
Lighthouse audit
Bundle size analysis
```

**4. Security Testing**
```bash
# Dependency audit
npm audit
pnpm audit

# OWASP ZAP scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://staging.hris.your-company.com

# Manual security review
- Check for sensitive data in logs
- Verify RBAC enforcement
- Test rate limiting
- Review error messages (no leaks)
```

**5. Documentation Review**
- [ ] API documentation updated
- [ ] User manual updated
- [ ] CHANGELOG.md updated
- [ ] Migration guide (if breaking changes)
- [ ] Release notes drafted

---

### Phase 4: Pre-Release (T-3 days)

**Database Migration Dry Run:**
```bash
# Backup production database
pg_dump -U hris_user hris_db > backup_pre_v1.1.0.sql

# Restore to test database
psql -U postgres -c "CREATE DATABASE hris_test_migration;"
psql -U postgres hris_test_migration < backup_pre_v1.1.0.sql

# Run migrations
DATABASE_URL="postgresql://postgres@localhost/hris_test_migration" \
  pnpm --filter @hris/database prisma migrate deploy

# Verify data integrity
psql -U postgres hris_test_migration -c "SELECT COUNT(*) FROM employees;"
```

**Rollback Plan:**
```bash
# Document rollback procedure
cat > rollback_v1.1.0.md << 'ROLLBACK'
# Rollback Procedure v1.1.0 → v1.0.0

1. Stop application:
   pm2 stop hris-api hris-web

2. Restore database:
   psql -U postgres -c "DROP DATABASE hris_db;"
   psql -U postgres -c "CREATE DATABASE hris_db OWNER hris_user;"
   psql -U postgres hris_db < backup_pre_v1.1.0.sql

3. Revert code:
   git checkout v1.0.0
   pnpm install
   pnpm build

4. Restart application:
   pm2 restart hris-api hris-web

5. Verify:
   curl http://localhost:3001/api/health
ROLLBACK
```

**Final Checklist:**
- [ ] All tests passing
- [ ] Code freeze (no new features)
- [ ] Staging environment stable for 48 hours
- [ ] Database migration tested
- [ ] Rollback plan documented and tested
- [ ] Deployment runbook prepared
- [ ] On-call engineer assigned
- [ ] Stakeholders notified of maintenance window

---

### Phase 5: Release Day

**Maintenance Window:** Saturday 2 AM - 6 AM (low traffic)

**Release Runbook:**

```bash
#!/bin/bash
# /opt/scripts/deploy-v1.1.0.sh

set -e  # Exit on error

echo "=== Starting Deployment: v1.1.0 ==="
echo "Time: $(date)"

# 1. Enable maintenance mode
echo "✓ Enabling maintenance mode..."
touch /opt/hris/MAINTENANCE_MODE
nginx -s reload

# 2. Backup database
echo "✓ Backing up database..."
pg_dump -U hris_user hris_db | gzip > /opt/backups/pre_v1.1.0_$(date +%Y%m%d_%H%M%S).sql.gz

# 3. Stop application
echo "✓ Stopping application..."
pm2 stop hris-api hris-web

# 4. Pull latest code
echo "✓ Pulling code..."
cd /opt/hris
git fetch origin
git checkout v1.1.0

# 5. Install dependencies
echo "✓ Installing dependencies..."
pnpm install --frozen-lockfile

# 6. Build application
echo "✓ Building..."
pnpm build

# 7. Run database migrations
echo "✓ Running migrations..."
pnpm --filter @hris/database prisma migrate deploy

# 8. Verify database
echo "✓ Verifying database..."
psql -U hris_user -d hris_db -c "SELECT COUNT(*) FROM employees;" > /dev/null
if [ $? -eq 0 ]; then
    echo "  Database OK"
else
    echo "  Database ERROR - Rolling back!"
    exit 1
fi

# 9. Start application
echo "✓ Starting application..."
pm2 start hris-api
pm2 start hris-web

# 10. Health check
echo "✓ Health check..."
sleep 5
HEALTH=$(curl -s http://localhost:3001/api/health | jq -r '.status')
if [ "$HEALTH" = "healthy" ]; then
    echo "  API is healthy"
else
    echo "  API is unhealthy - Rolling back!"
    exit 1
fi

# 11. Disable maintenance mode
echo "✓ Disabling maintenance mode..."
rm /opt/hris/MAINTENANCE_MODE
nginx -s reload

# 12. Smoke tests
echo "✓ Running smoke tests..."
curl -s http://localhost:3001/api/health > /dev/null
curl -s http://localhost:3000 > /dev/null

echo "=== Deployment Complete ==="
echo "Version: v1.1.0"
echo "Time: $(date)"
echo "Deployment duration: $SECONDS seconds"

# Send notification
curl -X POST https://hooks.slack.com/YOUR_WEBHOOK \
  -H 'Content-Type: application/json' \
  -d "{\"text\":\"✅ HRIS v1.1.0 deployed successfully\"}"
```

**Monitoring (First 2 Hours):**
```bash
# Monitor logs
pm2 logs hris-api --lines 100

# Watch error rate
watch -n 10 "tail -n 100 /var/log/hris/api.log | grep -i error | wc -l"

# Monitor database
psql -U hris_user -d hris_db -c "
SELECT 
  COUNT(*) as active_connections,
  MAX(query_start) as last_query
FROM pg_stat_activity
WHERE datname = 'hris_db';
"

# Check response times
ab -n 100 -c 10 https://hris.your-company.com/api/health
```

---

### Phase 6: Post-Release

**Day 1:**
- [ ] Monitor error logs
- [ ] Review user feedback
- [ ] Check performance metrics
- [ ] Verify scheduled jobs running
- [ ] Update status page

**Week 1:**
- [ ] Review analytics
- [ ] Document any issues
- [ ] Plan hotfixes if needed
- [ ] Team retrospective

**Post-Release Retrospective:**
```markdown
# Release v1.1.0 Retrospective

## What Went Well
- Deployment completed in 45 minutes (under 4-hour RTO)
- Zero data loss
- No user-facing issues

## What Could Be Improved
- Migration took longer than expected (30 minutes)
- Documentation had minor gaps
- One test flaky in CI/CD

## Action Items
- [ ] Optimize large table migrations
- [ ] Improve documentation review process
- [ ] Fix flaky test

## Metrics
- Deployment time: 45 minutes
- Downtime: 45 minutes
- Bugs found: 0 critical, 2 minor
- Performance impact: None
```

---

## Hotfix Process

**For Critical Bugs:**

```bash
# Create hotfix branch from main
git checkout main
git checkout -b hotfix/v1.1.1

# Fix the bug
# ... make changes

# Test thoroughly
pnpm test
pnpm test:integration

# Commit with issue reference
git commit -m "fix: Critical bug in payroll calculation (#1234)"

# Merge to main
git checkout main
git merge --no-ff hotfix/v1.1.1

# Tag release
git tag -a v1.1.1 -m "Hotfix: Payroll calculation bug"
git push origin main --tags

# Deploy immediately
./deploy-hotfix.sh v1.1.1

# Merge back to develop
git checkout develop
git merge main
```

**Hotfix Deployment (Expedited):**
```bash
# Can deploy during business hours if critical
# Shorter maintenance window (15-30 minutes)
# Follow same deployment steps but skip some testing
# Immediate rollback if issues
```

---

## Release Artifacts

### 1. Release Notes

```markdown
# Release Notes - v1.1.0

**Release Date:** March 15, 2026  
**Type:** Minor Release

## 🎉 New Features

### Training & Development Module
- Track employee training records
- Manage certifications with expiry dates
- Training request workflow
- Skills matrix tracking

### Enhanced Reporting
- Export reports to Excel/PDF
- Custom report builder
- Scheduled report delivery

## 🔧 Improvements

- Performance: 30% faster dashboard load times
- UI: Improved mobile responsiveness
- API: Response time reduced by 20%
- Database: Optimized query performance

## 🐛 Bug Fixes

- Fixed leave balance calculation for mid-year hires (#1123)
- Corrected GOSI percentage for part-time employees (#1145)
- Resolved attendance check-in GPS accuracy issue (#1167)

## 🔒 Security

- Updated dependencies with security patches
- Enhanced rate limiting on authentication endpoints
- Improved input validation across all forms

## 📚 Documentation

- New training module user guide
- Updated API documentation
- Migration guide for v1.0.0 users

## ⚠️ Breaking Changes

None - fully backward compatible

## 🔄 Migration

No manual migration required. Database migrations run automatically.

## 📦 Dependencies

- Node.js 20+ (no change)
- PostgreSQL 16+ (no change)
- Redis 7+ (no change)

## 🙏 Contributors

- Ahmed Al-Farsi (@ahmed)
- Sarah Hassan (@sarah)
- Mohammed Ali (@mohammed)

## 📞 Support

Questions? Contact support@your-company.com
```

### 2. CHANGELOG.md Update

```markdown
## [1.1.0] - 2026-03-15

### Added
- Training & development module with certifications tracking
- Custom report builder with Excel/PDF export
- Scheduled report delivery

### Changed
- Improved dashboard performance (30% faster load)
- Enhanced mobile UI responsiveness
- Optimized database queries

### Fixed
- Leave balance calculation for mid-year hires (#1123)
- GOSI calculation for part-time employees (#1145)
- GPS accuracy in attendance check-in (#1167)

### Security
- Updated 15 dependencies with security patches
- Enhanced authentication rate limiting
```

---

## Communication Plan

### Stakeholder Notifications

**T-2 Weeks:**
```
Subject: Upcoming HRIS Release - v1.1.0

Dear Team,

We're excited to announce the upcoming release of HRIS v1.1.0!

🗓️ Release Date: Saturday, March 15, 2026, 2 AM - 6 AM
⏱️ Expected Downtime: 4 hours

🎉 What's New:
- Training & Development module
- Enhanced reporting capabilities
- Performance improvements

📋 Action Required:
- Review the release notes (link)
- Attend training webinar on March 18

Thank you for your patience during the maintenance window.

Best regards,
HRIS Team
```

**Release Day:**
```
Subject: ✅ HRIS v1.1.0 Released Successfully

The system is back online with exciting new features!

Login and explore: https://hris.your-company.com

Training: March 18, 2 PM
Release Notes: (link)
```

---

## Rollback Criteria

**Trigger Rollback If:**
- Critical functionality broken (login, check-in, payroll)
- Data corruption detected
- Performance degradation >50%
- Error rate >5%
- Unable to resolve issue within 2 hours

**Rollback Procedure:**
```bash
# Execute rollback script
/opt/scripts/rollback-v1.1.0.sh

# Verify previous version working
curl http://localhost:3001/api/health
psql -U hris_user -d hris_db -c "SELECT version();"

# Notify team
echo "Rollback executed at $(date)" | mail -s "HRIS Rollback" team@company.com
```

---

## Release Metrics

**Track:**
- Deployment duration
- Downtime duration
- Bugs found in first week
- Performance impact
- User satisfaction (survey)
- Rollback count

**Goals:**
- Deployment: <1 hour
- Downtime: <2 hours
- Critical bugs: 0
- Performance: No degradation
- Rollback rate: <5%

---

## Continuous Improvement

**After Each Release:**
1. Update runbook based on learnings
2. Automate manual steps
3. Improve testing coverage
4. Enhance monitoring
5. Document tribal knowledge

---

**Remember:** A successful release is boring. If deployment is stressful, improve the process!
