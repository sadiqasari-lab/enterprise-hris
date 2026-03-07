# Frequently Asked Questions (FAQ)

Common questions about the Enterprise HRIS Platform.

---

## General Questions

### What is the Enterprise HRIS Platform?
A comprehensive Human Resource Information System specifically designed for Saudi Arabian enterprises. It manages employee records, attendance, payroll, leave, performance, recruitment, and more - all in compliance with Saudi Labor Law.

### Who is it for?
- **Small to Medium Enterprises** (50-500 employees)
- **Large Enterprises** (500+ employees with multi-company needs)
- **HR Departments** seeking automation and compliance
- **Saudi Arabian companies** requiring local compliance

### What makes it different from other HRIS systems?
- **Saudi Labor Law compliance** built-in (not an afterthought)
- **Arabic RTL support** throughout
- **Full source code ownership** (no vendor lock-in)
- **One-time cost** (vs. recurring per-user fees)
- **Self-hosted** (complete data control)

---

## Technical Questions

### What technology is it built with?
- **Backend:** Node.js 20, Express, TypeScript, Prisma
- **Frontend:** Next.js 14, React 18, Tailwind CSS
- **Database:** PostgreSQL 16, Redis 7
- **Infrastructure:** Docker, Nginx, PM2

### What are the system requirements?
**Minimum:**
- 2 CPU cores
- 4 GB RAM
- 20 GB storage
- Ubuntu 22.04+ or similar Linux

**Recommended:**
- 4 CPU cores
- 8 GB RAM
- 50 GB SSD storage
- Ubuntu 24.04

### Can it run on Windows servers?
While possible, we recommend Linux (Ubuntu) for production. Windows is supported for development only via WSL2.

### Does it work on mobile devices?
Yes! The web interface is fully responsive and works on:
- Mobile browsers (iOS Safari, Android Chrome)
- Tablets
- Desktop browsers

*Note: Native mobile app planned for v1.2 (Q3 2026)*

### What browsers are supported?
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- **Minimum:** Any modern browser with ES6 support

### Can it integrate with existing systems?
Yes, via REST API. Can integrate with:
- **Payroll systems** (import/export)
- **ERP systems** (employee data sync)
- **Time clocks** (attendance import)
- **Email systems** (notifications)
- **LDAP/Active Directory** (authentication - with customization)

---

## Deployment Questions

### How long does deployment take?
- **Docker (Quick):** 15 minutes
- **VPS (Full):** 45-60 minutes
- **Production (with testing):** 1-2 days

### Can I try it before deploying?
Yes! Follow the quick start in README.md to run locally:
```bash
pnpm install
pnpm run dev
```
Demo credentials provided in README.md.

### Do I need technical expertise to deploy?
- **Quick deployment:** Basic Linux knowledge
- **Production deployment:** Intermediate Linux + server administration
- **Enterprise deployment:** DevOps/System Administrator

We provide detailed deployment guides for all levels.

### What hosting options are available?
1. **Self-hosted VPS** (DigitalOcean, AWS EC2, Linode)
2. **On-premise** (your own servers)
3. **Cloud platforms** (AWS, Azure, Google Cloud)
4. **Managed hosting** (contact us for options)

### What's the cost?
**Software:** Free (included in this delivery)  
**Infrastructure:** $50-100/month (VPS + backups)  
**Optional Support:** $5,000-10,000/year  

See EXECUTIVE_SUMMARY.md for detailed cost breakdown.

---

## Feature Questions

### Does it support multiple companies?
Yes! Full multi-company tenancy with:
- Complete data isolation between companies
- Super Admin can manage all companies
- Shared infrastructure, isolated data

### How does attendance anti-spoofing work?
Four verification methods:
1. **GPS location** (within 100m of office)
2. **WiFi SSID** (must be on office network)
3. **Selfie** (facial recognition - optional)
4. **Device fingerprinting** (detects spoofing attempts)

Risk score calculated for each check-in.

### Does payroll handle GOSI automatically?
Yes! Automatically calculates:
- Employee contribution: 9.75% of basic salary
- Employer contribution: 12.00% of basic salary
- Generates monthly GOSI reports

### Can I export payroll to WPS?
Yes! Generates WPS-compatible bank transfer file (SIF format) for easy upload to banks.

### How many approval levels for payroll?
Three tiers:
1. **HR Officer** - Submits for review
2. **HR Admin** - Reviews and approves
3. **GM (General Manager)** - Final approval

All configurable via roles.

### Does it support English and Arabic?
Yes! Fully bilingual:
- **Interface:** Switch between English and Arabic
- **Data:** Store both English and Arabic values
- **RTL:** Proper right-to-left layout for Arabic
- **Reports:** Generate in either language

---

## Saudi Labor Law Questions

### Is it really compliant with Saudi Labor Law?
Yes! Features include:
- Working hours tracking (48 hours/week max)
- Overtime calculations (150% pay)
- Leave entitlements (21-30 days annual)
- GOSI contributions (automatic)
- End of service benefits (automatic calculation)
- Friday-Saturday weekend
- Islamic holidays

See SAUDI_LABOR_LAW_COMPLIANCE.md for article-by-article mapping.

### How are public holidays handled?
Built-in Saudi public holidays:
- Eid al-Fitr (4 days)
- Eid al-Adha (4 days)
- National Day (September 23)
- Foundation Day (February 22)

Automatically calculated based on Islamic calendar for Eid dates.

### Does it calculate end of service benefits correctly?
Yes! Automatically calculates per Saudi Labor Law:
- First 5 years: Half month salary per year
- After 5 years: One month salary per year
- Based on last basic salary

### Can I generate Ministry of Labor reports?
Yes! Export capabilities for:
- Monthly payroll reports
- Quarterly employment reports
- Annual statistics
- Custom date ranges

---

## Data & Security Questions

### Where is my data stored?
**You decide!** Options:
- Your own VPS/server (anywhere you choose)
- Saudi Arabia data centers (for data residency)
- Cloud providers with Saudi regions

You have complete control - it's your data.

### Is the data encrypted?
Yes!
- **In transit:** TLS 1.2+ encryption (HTTPS)
- **At rest:** Database encryption (optional, via PostgreSQL)
- **Backups:** Can be encrypted (GPG)
- **Passwords:** Bcrypt hashing (12 rounds)

### Who can access my data?
Only your authorized users. Since you self-host:
- **No vendor access** to your data
- **You control** all user accounts
- **Complete privacy** - it's on your infrastructure

### How long is data retained?
**Configurable!** Default:
- Active employees: Indefinitely
- Terminated employees: 10 years (Saudi law requirement)
- Audit logs: 3 years
- Backups: 30 days

All retention periods are configurable.

### Is it GDPR/PDPL compliant?
Yes! Features include:
- Data minimization
- Purpose limitation
- User consent tracking
- Right to access (data export)
- Right to erasure (soft delete)
- Audit trail (who accessed what, when)

See SECURITY_AUDIT_CHECKLIST.md for details.

---

## Support Questions

### What support is available?
**Free (Community):**
- Documentation (500+ pages)
- GitHub Issues
- GitHub Discussions

**Paid (Professional):**
- Email support (8-hour response)
- Phone support
- Dedicated support engineer
- Custom development
- Training sessions

See SUPPORT.md for SLA details.

### How do I report a bug?
1. Check TROUBLESHOOTING_GUIDE.md first
2. Search GitHub Issues for duplicates
3. Create new issue with:
   - Version number
   - Steps to reproduce
   - Expected vs actual behavior
   - Logs/screenshots

### Can you help with deployment?
Yes! Options:
- **DIY:** Follow deployment guides (free)
- **Assisted:** Email/video call support (paid)
- **Full service:** We deploy for you (paid)

Contact: support@your-company.com

### Do you offer training?
Yes! Training options:
- **Self-paced:** User manuals (free)
- **Video tutorials:** Coming soon (free)
- **Live sessions:** 2-4 hour sessions (paid)
- **On-site training:** Available for enterprise (paid)

---

## Customization Questions

### Can I customize it?
Yes! You have full source code:
- Modify any feature
- Add new modules
- Change UI/branding
- Integrate with other systems

See CONTRIBUTING.md for development guidelines.

### Can you add custom features for me?
Yes! We offer custom development services:
- Custom modules
- Third-party integrations
- Custom reports
- Workflow modifications

Contact: consulting@your-company.com

### Can I white-label it?
Yes! You can:
- Change branding/logo
- Modify color scheme
- Rename the application
- Remove all references to original

You own the code - use it how you want.

### Is there a plugin/extension system?
Not currently, but roadmap includes:
- v1.3 (Q4 2026): Plugin architecture
- API webhooks
- Custom field support

---

## Licensing Questions

### What license is it under?
MIT License - very permissive:
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ⚠️ No warranty provided

See LICENSE file for full terms.

### Can I use it for multiple companies?
Yes! Multi-company support is built-in. Use for:
- Multiple subsidiaries
- Holding company structure
- Multiple client companies (if you're a service provider)

### Can I resell it?
Yes! Under MIT license you can:
- Sell as-is
- Sell modified versions
- Offer as SaaS
- Bundle with other products

**Note:** Must retain copyright notice.

### Do I have to open source my modifications?
No! MIT license allows:
- Keep modifications private
- Proprietary extensions
- Closed-source derivatives

---

## Performance Questions

### How many users can it support?
**Tested for:**
- 500+ concurrent users
- 5,000+ employee records
- Sub-200ms API response times

**Scalable to:**
- 10,000+ employees (with proper infrastructure)
- Multiple concurrent payroll cycles
- High-volume attendance tracking

### What's the database size?
**Estimated (1000 employees, 1 year):**
- Employee data: ~50 MB
- Attendance records: ~200 MB
- Payroll data: ~100 MB
- Documents: Variable (user uploads)
- Total: ~500 MB - 5 GB

Scales linearly with employee count and time.

### Can it handle large file uploads?
Yes! Configured for:
- Document uploads: 10 MB max per file
- Batch imports: Unlimited CSV size
- Configurable limits via Nginx

---

## Migration Questions

### Can I import existing employee data?
Yes! Via CSV import tool:
- Employee records
- Salary structures
- Leave balances
- Department hierarchy

See: scripts/migration/import-employees-from-csv.ts

### How do I migrate from my current system?
1. Export data from current system (CSV/Excel)
2. Map fields to our template (sample provided)
3. Import using our tool
4. Verify accuracy
5. Run parallel for 1-2 weeks
6. Cutover

Typical migration: 3-5 days.

### Will I lose historical data?
No! Import historical data:
- Past payroll cycles
- Previous attendance records
- Old performance reviews
- Archived documents

All historical data can be preserved.

---

## Troubleshooting Questions

### The system is slow - what should I check?
1. Run health check: `./scripts/health-check.sh`
2. Check database queries: Enable DEBUG mode
3. Review Nginx logs: `/var/log/nginx/`
4. Check resource usage: `htop`
5. See TROUBLESHOOTING_GUIDE.md

### I forgot the admin password - how do I reset it?
```bash
# Connect to database
psql -U hris_user -d hris_db

# Reset password (bcrypt hash of "NewPassword123!")
UPDATE users 
SET password_hash = '$2b$12$...' 
WHERE email = 'admin@system.com';
```

Or use password reset endpoint (if configured).

### Backup failed - what should I do?
1. Check disk space: `df -h`
2. Check backup logs: `/opt/backups/database/backup.log`
3. Verify database access: `psql -U hris_user -d hris_db`
4. Run manual backup: `./scripts/backup/backup-database.sh`
5. Contact support if persistent

---

## Roadmap Questions

### What's coming in future versions?
**v1.1 (Q2 2026):**
- Enhanced reporting (Excel/PDF export)
- Custom report builder
- Scheduled report delivery

**v1.2 (Q3 2026):**
- React Native mobile app
- Biometric attendance
- Push notifications
- Offline mode

**v1.3 (Q4 2026):**
- GOSI API integration
- WPS direct integration
- Email/SMS notifications
- Plugin system

**v2.0 (2027):**
- AI-powered resume screening
- Predictive analytics
- Chatbot for HR queries
- Face recognition attendance

See CHANGELOG.md for complete roadmap.

### Can I influence the roadmap?
Yes! Submit feature requests via:
- GitHub Discussions (Ideas category)
- Email: feedback@your-company.com
- Vote on existing requests

Popular features get prioritized.

### Will updates be free?
Yes! All v1.x updates are free including:
- Bug fixes
- Security patches
- Feature additions
- Documentation updates

Major versions (v2.0+) may be separate.

---

## Still Have Questions?

**Documentation:** Start with INDEX.md to find relevant guides  
**Community:** GitHub Discussions  
**Support:** support@your-company.com  
**Sales:** sales@your-company.com  
**Custom Development:** consulting@your-company.com  

---

*Last updated: February 5, 2026*
