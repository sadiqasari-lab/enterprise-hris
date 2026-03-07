# Release Checklist

Pre-release verification for new versions of Enterprise HRIS Platform.

---

## Release Information

**Version:** ____________  
**Release Date:** ____________  
**Release Manager:** ____________  
**Type:** ☐ Major  ☐ Minor  ☐ Patch  ☐ Hotfix

---

## Pre-Release (1 Week Before)

### Code Quality
- [ ] All tests passing locally
- [ ] CI/CD pipeline green
- [ ] Code coverage ≥ 60%
- [ ] No critical/high security vulnerabilities (`pnpm audit`)
- [ ] TypeScript compiles without errors
- [ ] ESLint passes with no errors
- [ ] No `console.log` statements in production code
- [ ] No hardcoded credentials or secrets

### Documentation
- [ ] CHANGELOG.md updated with all changes
- [ ] API documentation reflects new endpoints
- [ ] User manual updated (if UI changes)
- [ ] Migration guide written (if breaking changes)
- [ ] README.md version number updated
- [ ] Environment variable changes documented

### Database
- [ ] Migration scripts tested
- [ ] Rollback scripts prepared
- [ ] Migration tested on staging database
- [ ] Data integrity verified after migration
- [ ] Backup taken before migration
- [ ] Migration performance tested (if large data)

### Dependencies
- [ ] All dependencies up to date (or documented why not)
- [ ] Deprecated dependencies replaced
- [ ] License compliance verified
- [ ] Bundle size checked (no unexpected increases)

---

## Testing Phase (3-5 Days Before)

### Automated Testing
- [ ] Unit tests: All passing
- [ ] Integration tests: All passing
- [ ] E2E tests: All passing
- [ ] Load tests: Performance targets met
- [ ] Security scan: No critical issues

### Manual Testing
- [ ] Smoke tests completed on staging
- [ ] Critical user flows tested:
  - [ ] Employee login and check-in
  - [ ] Manager leave approval
  - [ ] HR payroll submission
  - [ ] GM payroll approval
  - [ ] Document signature workflow
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness verified
- [ ] Arabic RTL layout correct

### Regression Testing
- [ ] Existing features still work
- [ ] No performance degradation
- [ ] Previous bug fixes still valid
- [ ] Integration points functional

---

## Staging Deployment (2 Days Before)

### Pre-Deployment
- [ ] Staging environment matches production
- [ ] Database backup taken
- [ ] Deployment script tested
- [ ] Rollback plan prepared

### Deployment
- [ ] Code deployed to staging
- [ ] Database migrations applied
- [ ] Environment variables updated
- [ ] Services restarted successfully
- [ ] Health checks passing

### Post-Deployment Verification
- [ ] Application accessible
- [ ] Login working
- [ ] API endpoints responding
- [ ] Database queries performing well
- [ ] Logs show no errors
- [ ] Monitoring dashboards normal

### Stakeholder Review
- [ ] Product owner approved
- [ ] QA team signed off
- [ ] Key users tested on staging
- [ ] Security team reviewed (if security changes)

---

## Production Deployment Day

### Pre-Deployment (T-2 hours)

**Communication:**
- [ ] Deployment announcement sent to users
- [ ] Support team notified
- [ ] On-call engineer identified
- [ ] Stakeholders informed

**Preparation:**
- [ ] Production backup verified (< 24 hours old)
- [ ] Deployment window confirmed (low traffic time)
- [ ] Team members on standby
- [ ] Rollback plan reviewed

### Deployment Execution

**T-15 min: Final checks**
- [ ] No critical tickets open
- [ ] Staging still healthy
- [ ] Production metrics normal

**T-0: Begin deployment**
```bash
# 1. Enable maintenance mode (optional)
# 2. Create pre-deployment backup
./scripts/backup/backup-database.sh

# 3. Pull latest code
git fetch origin
git checkout v1.1.0  # Your release tag

# 4. Install dependencies
pnpm install --frozen-lockfile

# 5. Build applications
pnpm --filter @hris/api build
pnpm --filter @hris/web build

# 6. Run migrations
pnpx prisma migrate deploy --schema packages/database/schema.prisma

# 7. Restart services
pm2 restart all

# 8. Verify health
curl https://hris.your-company.com/api/health

# 9. Disable maintenance mode
```

**Deployment Checklist:**
- [ ] Code pulled successfully
- [ ] Dependencies installed
- [ ] Build completed without errors
- [ ] Migrations applied successfully
- [ ] Services restarted
- [ ] Health endpoint returning 200
- [ ] No errors in logs

---

## Post-Deployment (T+1 hour)

### Immediate Verification
- [ ] Homepage loads correctly
- [ ] Login working
- [ ] API responding (check multiple endpoints)
- [ ] Database queries executing normally
- [ ] No spike in error logs
- [ ] Performance metrics normal

### Smoke Tests (Production)
- [ ] Employee can check in
- [ ] Manager can view team
- [ ] HR can access employee list
- [ ] Payroll cycle accessible
- [ ] Documents can be viewed
- [ ] Reports generate correctly

### Monitoring
- [ ] Error rate < 1%
- [ ] Response times < 200ms P95
- [ ] CPU usage < 70%
- [ ] Memory usage < 80%
- [ ] Database connections healthy
- [ ] No security alerts

---

## Post-Release (Next 24 Hours)

### User Feedback
- [ ] Monitor support tickets
- [ ] Check user feedback channels
- [ ] Review social media mentions (if applicable)
- [ ] Address any urgent issues

### Performance Monitoring
- [ ] API latency normal
- [ ] Database performance stable
- [ ] Error rates acceptable
- [ ] Traffic patterns expected

### Analytics
- [ ] User engagement metrics tracked
- [ ] Feature adoption monitored
- [ ] Conversion rates stable

---

## Rollback Procedure (If Needed)

**Criteria for rollback:**
- Critical bug affecting >10% of users
- Data integrity issue discovered
- Performance degraded >50%
- Security vulnerability introduced

**Rollback steps:**
```bash
# 1. Stop current version
pm2 stop all

# 2. Checkout previous version
git checkout v1.0.0

# 3. Rebuild
pnpm install --frozen-lockfile
pnpm --filter @hris/api build
pnpm --filter @hris/web build

# 4. Rollback database (if migrations ran)
# Restore from pre-deployment backup
./scripts/backup/restore-database.sh /opt/backups/pre_v1.1.0_backup.sql.gz

# 5. Restart services
pm2 restart all

# 6. Verify
curl https://hris.your-company.com/api/health
```

**After rollback:**
- [ ] Users notified
- [ ] Post-mortem scheduled
- [ ] Root cause analysis started
- [ ] Fix plan created

---

## Communication Templates

### Pre-Deployment Announcement
```
Subject: HRIS System Maintenance - [Date] at [Time]

Dear Team,

We will be performing scheduled maintenance to deploy new features and improvements to the HRIS system.

Maintenance Window: [Date] from [Start Time] to [End Time]
Expected Downtime: [Duration] (minimal)
Impact: The system will be briefly unavailable

What's New:
- [Feature 1]
- [Feature 2]
- [Bug fix 1]

Please ensure any critical tasks are completed before the maintenance window.

Questions? Contact it-support@company.com

Thank you for your patience.
```

### Post-Deployment Success
```
Subject: HRIS System Update Complete

The HRIS system has been successfully updated with new features and improvements.

New Features:
- [Feature 1]: [Description]
- [Feature 2]: [Description]

Improvements:
- [Improvement 1]
- [Improvement 2]

The system is fully operational. For questions or issues, please contact support.

See full release notes: [Link to CHANGELOG]
```

### Rollback Notification
```
Subject: HRIS System Update Rolled Back

We encountered an issue with today's system update and have rolled back to the previous version to ensure stability.

Current Status: System fully operational on previous version
Impact: New features temporarily unavailable
Next Steps: We are investigating and will reschedule the update

We apologize for any inconvenience. The system is stable and all your data is safe.
```

---

## Post-Release Review (Within 1 Week)

### Metrics Review
- [ ] Deployment duration: _______ (Target: <30 min)
- [ ] Downtime: _______ (Target: <5 min)
- [ ] Issues reported: _______ (Target: <3)
- [ ] Rollback required: Yes / No

### What Went Well
- 
- 
- 

### What Could Improve
- 
- 
- 

### Action Items
1. [ ] _________________________ (Owner: ______, Due: ______)
2. [ ] _________________________ (Owner: ______, Due: ______)
3. [ ] _________________________ (Owner: ______, Due: ______)

---

## Release Sign-Off

### Pre-Deployment
- [ ] **Product Owner:** _______________ Date: _______
- [ ] **Engineering Lead:** _______________ Date: _______
- [ ] **QA Lead:** _______________ Date: _______

### Post-Deployment
- [ ] **Release Manager:** _______________ Date: _______
- [ ] **System stable for 24 hours:** Date: _______

---

## Version History

| Version | Date | Type | Notes |
|---------|------|------|-------|
| 1.0.0 | 2026-02-05 | Major | Initial release |
| 1.1.0 | TBD | Minor | Planned features |
| | | | |

---

**Next Release Scheduled:** ______________

**Release Manager:** ______________
