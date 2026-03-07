import {
  Home,
  Users,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  Settings,
  Award,
  UserPlus,
  BarChart3,
  PieChart,
  User,
  Building2,
  ShieldCheck,
  Server,
} from 'lucide-react'

export const hrAdminNavigation = [
  { label: 'Dashboard', href: '/hr-admin', icon: Home },
  { label: 'Employees', href: '/hr-admin/employees', icon: Users },
  { label: 'Recruitment', href: '/hr-admin/recruitment', icon: UserPlus },
  { label: 'Attendance', href: '/hr-admin/attendance', icon: Clock },
  { label: 'Leave Management', href: '/hr-admin/leave', icon: Calendar },
  { label: 'Payroll', href: '/hr-admin/payroll', icon: DollarSign },
  { label: 'Documents', href: '/hr-admin/documents', icon: FileText },
  { label: 'Performance', href: '/hr-admin/performance', icon: Award },
  { label: 'Reports', href: '/hr-admin/reports', icon: TrendingUp },
  { label: 'Settings', href: '/hr-admin/settings', icon: Settings },
]

export const gmNavigation = [
  { label: 'Dashboard', href: '/gm', icon: Home },
  { label: 'Payroll Approval', href: '/gm/payroll', icon: DollarSign },
  { label: 'Reports', href: '/gm/reports', icon: BarChart3 },
  { label: 'Documents', href: '/gm/documents', icon: FileText },
  { label: 'Analytics', href: '/gm/analytics', icon: PieChart },
]

export const managerNavigation = [
  { label: 'Dashboard', href: '/manager', icon: Home },
  { label: 'My Team', href: '/manager/team', icon: Users },
  { label: 'Leave Approvals', href: '/manager/leave', icon: Calendar },
  { label: 'Performance', href: '/manager/performance', icon: Award },
  { label: 'Reports', href: '/manager/reports', icon: TrendingUp },
]

export const employeeNavigation = [
  { label: 'Dashboard', href: '/employee', icon: Home },
  { label: 'Attendance', href: '/employee/attendance', icon: Clock },
  { label: 'Leave', href: '/employee/leave', icon: Calendar },
  { label: 'Payslips', href: '/employee/payslips', icon: FileText },
  { label: 'Documents', href: '/employee/documents', icon: FileText },
  { label: 'Profile', href: '/employee/profile', icon: User },
]

export const superAdminNavigation = [
  { label: 'Dashboard', href: '/super-admin', icon: Home },
  { label: 'Companies', href: '/super-admin/companies', icon: Building2 },
  { label: 'Users', href: '/super-admin/users', icon: Users },
  { label: 'Audit Logs', href: '/super-admin/audit', icon: FileText },
  { label: 'System Health', href: '/super-admin/health', icon: Server },
  { label: 'Security', href: '/super-admin/security', icon: ShieldCheck },
]

export const hrOfficerNavigation = [
  { label: 'Dashboard', href: '/hr-officer', icon: Home },
  { label: 'Payroll', href: '/hr-admin/payroll', icon: DollarSign },
  { label: 'Attendance', href: '/hr-admin/attendance', icon: Clock },
  { label: 'Recruitment', href: '/hr-admin/recruitment', icon: UserPlus },
]
