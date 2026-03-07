# Frontend Panels - Complete Guide

## Overview

Modern, production-ready Next.js 14 web application with 6 distinct panels for different user roles in the HRIS platform.

## Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom components with Radix UI primitives
- **State Management:** React Hooks
- **API Client:** Axios with interceptors
- **Icons:** Lucide React
- **Charts:** Recharts

## Project Structure

```
apps/web/
├── app/
│   ├── (super-admin)/     # Super Admin panel routes
│   ├── (hr-admin)/        # HR Admin panel routes
│   ├── (hr-officer)/      # HR Officer panel routes
│   ├── (gm)/              # GM panel routes
│   ├── (manager)/         # Manager panel routes
│   ├── (employee)/        # Employee panel routes
│   ├── auth/              # Authentication pages
│   │   └── login/         # Login page
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── input.tsx
│   ├── forms/             # Form components
│   └── layout/            # Layout components
│       └── DashboardLayout.tsx
├── lib/
│   ├── api/               # API client
│   │   └── client.ts
│   ├── hooks/             # Custom React hooks
│   └── utils.ts           # Utility functions
├── styles/
│   └── globals.css        # Global styles
├── next.config.js
├── tailwind.config.js
└── package.json
```

## Panels Overview

### 1. Employee Self-Service Panel (`/employee`)

**Navigation:**
- Dashboard
- Attendance (Check-in/Check-out)
- Leave Management
- Payslips
- Documents
- Profile

**Key Features:**
- ✅ Quick check-in/check-out buttons
- ✅ Attendance statistics (present, late, absent)
- ✅ Leave balance display
- ✅ Latest payslip view
- ✅ Pending actions widget
- ✅ Recent activity timeline
- ✅ Company announcements

**Dashboard Widgets:**
- Attendance This Month (with breakdown)
- Leave Balance (annual, sick, emergency)
- Latest Payslip (with download)
- Pending Actions (signatures, corrections)
- Recent Activity Feed
- Announcements

### 2. HR Admin Panel (`/hr-admin`)

**Navigation:**
- Dashboard
- Employees
- Recruitment
- Attendance
- Leave Management
- Payroll
- Documents
- Performance
- Reports
- Settings

**Key Features:**
- ✅ Total employees metric
- ✅ Active recruitment tracker
- ✅ Pending leave approvals
- ✅ Flagged attendance review
- ✅ Payroll cycle status (with GM approval tracking)
- ✅ Pending approvals queue
- ✅ Recent HR activity log
- ✅ Department overview

**Critical Workflows:**
- Payroll preparation (Step 1)
- Payroll review & send to GM (Step 2)
- Flagged attendance approval
- Leave request management
- Document management

### 3. GM Panel (`/gm`)

**Navigation:**
- Dashboard
- Payroll Approval (⚠️ CRITICAL)
- Reports
- Documents
- Analytics

**Key Features:**
- ✅ **Prominent payroll approval alert**
- ✅ Executive metrics (workforce, payroll, growth)
- ✅ Company health indicators
- ✅ Recent approval history
- ✅ Department performance scores
- ✅ Financial overview

**Critical Feature:**
- **Payroll Final Approval Widget**
  - Shows pending amount, employee count
  - Displays prepared by, reviewed by
  - Three action buttons: Approve, Review, Reject
  - Color-coded urgency (yellow alert)

### 4. HR Officer Panel (`/hr-officer`)

**Navigation:**
- Dashboard
- Employee Management
- Attendance Review
- Leave Processing
- Payroll Preparation
- Documents
- Recruitment Support

**Key Features:**
- Operational task dashboard
- Payroll preparation (Step 1)
- Day-to-day employee management
- Attendance data entry
- Leave request processing

### 5. Manager Panel (`/manager`)

**Navigation:**
- Dashboard
- My Team
- Attendance
- Leave Approvals
- Performance Reviews
- Reports

**Key Features:**
- Team-only visibility
- Team attendance overview
- Leave approval workflow
- Performance review interface
- Team reports

### 6. Super Admin Panel (`/super-admin`)

**Navigation:**
- Dashboard
- Companies
- System Settings
- Users & Roles
- Group Analytics
- Audit Logs

**Key Features:**
- Multi-company management
- System-wide settings
- User role management
- Cross-company analytics
- Audit trail review

## Component Library

### UI Components

#### Button
```tsx
<Button variant="default" size="default" loading={false}>
  Click Me
</Button>

// Variants: default, destructive, outline, secondary, ghost, link
// Sizes: default, sm, lg, icon
```

#### Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
  <CardFooter>
    Footer actions
  </CardFooter>
</Card>
```

#### Input
```tsx
<Input
  type="text"
  placeholder="Enter value"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

### Layout Components

#### DashboardLayout
```tsx
<DashboardLayout
  navigation={[
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    // ... more nav items
  ]}
  userInfo={{
    name: 'John Doe',
    role: 'HR Admin'
  }}
>
  {children}
</DashboardLayout>
```

**Features:**
- Collapsible sidebar
- Mobile-responsive
- Active route highlighting
- User info display
- Logout functionality
- Top navigation bar with search and notifications

## API Integration

### API Client (`lib/api/client.ts`)

**Features:**
- Automatic token management
- Token refresh on 401
- Request/response interceptors
- Type-safe methods

**Usage:**
```typescript
import { apiClient } from '@/lib/api/client'

// Authentication
const response = await apiClient.login(email, password)

// Attendance
await apiClient.checkIn({
  locationId,
  gps,
  selfie,
  wifiSSID,
  deviceInfo
})

// Payroll
await apiClient.gmApprovePayroll(cycleId, true)

// Documents
await apiClient.signDocument(documentId, signatureData)
```

## Styling & Theming

### Tailwind Configuration

**Custom Colors:**
- `primary`: Main brand color
- `secondary`: Secondary actions
- `destructive`: Danger actions
- `muted`: Subtle backgrounds
- `accent`: Highlights

**Custom Utilities:**
- `.hover-lift`: Lift on hover effect
- `.glass-card`: Glassmorphism effect
- `.skeleton`: Loading shimmer

### RTL Support

```tsx
<div dir="rtl">
  {/* Arabic content */}
</div>
```

## State Management

### Local State
```tsx
const [data, setData] = useState(initialData)
```

### API State
```tsx
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')

try {
  setLoading(true)
  const data = await apiClient.getSomething()
} catch (err) {
  setError(err.message)
} finally {
  setLoading(false)
}
```

## Authentication Flow

### Login
```tsx
// 1. User enters credentials
// 2. API call to /auth/login
// 3. Store tokens in localStorage
// 4. Redirect based on role

const handleLogin = async () => {
  const response = await apiClient.login(email, password)
  apiClient.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken)
  
  // Redirect based on role
  const role = response.data.user.roles[0]
  router.push(roleRoutes[role])
}
```

### Protected Routes
```tsx
// Middleware checks for valid token
// Redirects to /auth/login if not authenticated
```

### Token Refresh
```tsx
// Automatic refresh on 401 response
// Retry failed request with new token
// Logout if refresh fails
```

## Responsive Design

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1400px

### Mobile-First Approach
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  {/* Responsive grid */}
</div>
```

## Performance Optimization

### Code Splitting
- Route-based splitting with Next.js App Router
- Dynamic imports for heavy components

### Image Optimization
```tsx
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority
/>
```

### Loading States
```tsx
<Button loading={isSubmitting}>
  Submit
</Button>

<div className="skeleton h-10 w-full" />
```

## Accessibility

### ARIA Labels
```tsx
<button aria-label="Close menu">
  <X />
</button>
```

### Keyboard Navigation
- Tab order maintained
- Focus indicators
- Escape to close modals

### Screen Reader Support
- Semantic HTML
- Proper heading hierarchy
- Alt text for images

## Development Workflow

### Setup
```bash
cd apps/web
npm install
npm run dev
```

### Build
```bash
npm run build
npm start
```

### Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Common Patterns

### Data Fetching
```tsx
useEffect(() => {
  const fetchData = async () => {
    try {
      const data = await apiClient.getData()
      setData(data)
    } catch (err) {
      setError(err.message)
    }
  }
  fetchData()
}, [])
```

### Form Handling
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  try {
    await apiClient.submitForm(formData)
    toast.success('Success!')
  } catch (err) {
    toast.error(err.message)
  }
}
```

### Pagination
```tsx
const [page, setPage] = useState(1)
const [data, setData] = useState([])

const fetchPage = async (pageNum: number) => {
  const result = await apiClient.getData({ page: pageNum })
  setData(result.data)
}
```

## Best Practices

1. **Type Safety:** Use TypeScript for all components
2. **Reusability:** Extract common patterns into components
3. **Error Handling:** Always handle API errors gracefully
4. **Loading States:** Show loading indicators for async operations
5. **Accessibility:** Follow WCAG guidelines
6. **Mobile First:** Design for mobile, enhance for desktop
7. **Performance:** Lazy load heavy components
8. **Security:** Never expose sensitive data in client-side code

## Testing

### Unit Tests
```tsx
import { render, screen } from '@testing-library/react'
import Button from './button'

test('renders button', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByText('Click me')).toBeInTheDocument()
})
```

### E2E Tests
```tsx
// Playwright or Cypress tests
test('user can login', async () => {
  await page.goto('/auth/login')
  await page.fill('[name="email"]', 'test@test.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/dashboard')
})
```

## Deployment

### Build Output
```bash
npm run build
# Output: .next/
```

### Environment
- Node.js 18+
- Environment variables configured
- API URL set correctly

### Hosting Options
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Self-hosted with PM2

---

## Summary

The frontend provides a complete, production-ready interface for all HRIS platform users with:
- ✅ 6 distinct role-based panels
- ✅ Modern, responsive design
- ✅ Full API integration
- ✅ Authentication & authorization
- ✅ Mobile-optimized
- ✅ Accessibility compliant
- ✅ Performance optimized

All panels are ready for further feature development and customization based on specific business requirements.
