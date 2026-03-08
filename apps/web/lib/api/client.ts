import axios, { AxiosInstance, AxiosError } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

class APIClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired - try to refresh
          const refreshed = await this.refreshToken()
          if (refreshed && error.config) {
            // Retry original request
            return this.client.request(error.config)
          } else {
            // Refresh failed - redirect to login
            this.clearTokens()
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login'
            }
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // Token management
  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('accessToken')
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('refreshToken')
  }

  setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
  }

  clearTokens(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken()
      if (!refreshToken) return false

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      })

      const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens
      this.setTokens(accessToken, newRefreshToken)
      return true
    } catch (error) {
      return false
    }
  }

  // Auth API
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password })
    return response.data
  }

  async logout() {
    const response = await this.client.post('/auth/logout')
    this.clearTokens()
    return response.data
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile')
    return response.data
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await this.client.post('/auth/change-password', {
      currentPassword,
      newPassword,
    })
    return response.data
  }

  // Attendance API
  async checkIn(data: {
    locationId: string
    gps?: any
    selfie?: string
    wifiSSID?: string
    deviceInfo?: any
  }) {
    const response = await this.client.post('/attendance/check-in', data)
    return response.data
  }

  async clockIn(data: {
    locationId: string
    gps?: any
    selfie?: string
    wifiSSID?: string
    deviceInfo?: any
  }) {
    const response = await this.client.post('/attendance/clock-in', data)
    return response.data
  }

  async checkOut() {
    const response = await this.client.post('/attendance/check-out')
    return response.data
  }

  async clockOut() {
    const response = await this.client.post('/attendance/clock-out')
    return response.data
  }

  async getAttendanceRecords(params?: {
    startDate?: string
    endDate?: string
    status?: string
  }) {
    const response = await this.client.get('/attendance/records', { params })
    return response.data
  }

  async getAttendanceSummary(month: number, year: number) {
    const response = await this.client.get('/attendance/summary', {
      params: { month, year },
    })
    return response.data
  }

  async getAttendanceMonthly(month: number, year: number) {
    const response = await this.client.get('/attendance/monthly', {
      params: { month, year },
    })
    return response.data
  }

  // Mobile Attendance API
  async mobileCheckIn(data: {
    locationId?: string
    gps?: any
    selfie?: string
    wifiSSID?: string
    deviceInfo?: any
  }) {
    const response = await this.client.post('/mobile/attendance/check-in', data)
    return response.data
  }

  async mobileCheckOut() {
    const response = await this.client.post('/mobile/attendance/check-out')
    return response.data
  }

  async getMobileAttendanceStatus() {
    const response = await this.client.get('/mobile/attendance/status')
    return response.data
  }

  async getMobileAttendanceHistory(params?: {
    startDate?: string
    endDate?: string
    status?: string
    page?: number
    limit?: number
  }) {
    const response = await this.client.get('/mobile/attendance/history', { params })
    return response.data
  }

  // Mobile Profile API
  async getMobileProfile() {
    const response = await this.client.get('/mobile/profile/me')
    return response.data
  }

  async updateMobileProfile(data: {
    firstName?: string
    lastName?: string
    phone?: string
    dateOfBirth?: string
    nationality?: string
  }) {
    const response = await this.client.put('/mobile/profile/me', data)
    return response.data
  }

  // Mobile Leave API
  async getMobileLeaveTypes() {
    const response = await this.client.get('/mobile/leave/types')
    return response.data
  }

  async getMobileLeaveBalances(year?: number) {
    const response = await this.client.get('/mobile/leave/balances', {
      params: year ? { year } : undefined,
    })
    return response.data
  }

  async getMobileLeaveRequests(params?: {
    status?: string
    year?: number
    page?: number
    limit?: number
  }) {
    const response = await this.client.get('/mobile/leave/requests', { params })
    return response.data
  }

  async mobileCreateLeaveRequest(data: {
    leaveTypeId: string
    startDate: string
    endDate: string
    reason?: string
  }) {
    const response = await this.client.post('/mobile/leave/requests', data)
    return response.data
  }

  async mobileCancelLeaveRequest(requestId: string) {
    const response = await this.client.post(`/mobile/leave/requests/${requestId}/cancel`)
    return response.data
  }

  // Mobile Payslip API
  async getMobilePayslips(year?: number) {
    const response = await this.client.get('/mobile/payslips', {
      params: year ? { year } : undefined,
    })
    return response.data
  }

  async getMobilePayslipDetail(cycleId: string) {
    const response = await this.client.get(`/mobile/payslips/${cycleId}`)
    return response.data
  }

  // Payroll API
  async getPayslips() {
    const response = await this.client.get('/payroll/payslips/my')
    return response.data
  }

  async getPayslipsSummary() {
    const response = await this.client.get('/payslips')
    return response.data
  }

  async getPayrollCycles() {
    const response = await this.client.get('/payroll/cycles')
    return response.data
  }

  async createPayrollCycle(data: {
    periodStart: string
    periodEnd: string
  }) {
    const response = await this.client.post('/payroll/cycles', data)
    return response.data
  }

  async submitPayrollForReview(cycleId: string) {
    const response = await this.client.post(`/payroll/cycles/${cycleId}/submit`)
    return response.data
  }

  async reviewPayroll(cycleId: string, approved: boolean, rejectionReason?: string) {
    const response = await this.client.post(`/payroll/cycles/${cycleId}/review`, {
      approved,
      rejectionReason,
    })
    return response.data
  }

  async gmApprovePayroll(cycleId: string, approved: boolean, rejectionReason?: string) {
    const response = await this.client.post(`/payroll/cycles/${cycleId}/gm-approval`, {
      approved,
      rejectionReason,
    })
    return response.data
  }

  async executePayroll(cycleId: string) {
    const response = await this.client.post(`/payroll/cycles/${cycleId}/execute`)
    return response.data
  }

  // Documents API
  async uploadDocument(formData: FormData) {
    const response = await this.client.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async getDocuments(params?: {
    employeeId?: string
    category?: string
    status?: string
  }) {
    const response = await this.client.get('/documents', { params })
    return response.data
  }

  async getDocument(documentId: string) {
    const response = await this.client.get(`/documents/${documentId}`)
    return response.data
  }

  async initiateSignature(documentId: string, approvalChain: any) {
    const response = await this.client.post(`/documents/${documentId}/initiate-signature`, {
      approvalChain,
    })
    return response.data
  }

  async signDocument(documentId: string, signatureData: string, geolocation?: any) {
    const response = await this.client.post(`/documents/${documentId}/sign`, {
      signatureData,
      geolocation,
    })
    return response.data
  }

  async rejectDocument(documentId: string, rejectionReason: string) {
    const response = await this.client.post(`/documents/${documentId}/reject`, {
      rejectionReason,
    })
    return response.data
  }

  async getPendingSignatures() {
    const response = await this.client.get('/documents/pending-signatures/my')
    return response.data
  }

  async downloadDocument(documentId: string) {
    const response = await this.client.get(`/documents/${documentId}/download`, {
      responseType: 'blob',
    })
    return response.data
  }

  async getExpiringDocuments(days = 30) {
    const response = await this.client.get('/documents/expiring/list', {
      params: { days },
    })
    return response.data
  }

  async deleteDocument(documentId: string) {
    const response = await this.client.delete(`/documents/${documentId}`)
    return response.data
  }


  // ── Employees API ──────────────────────────────────────────
  async getEmployees(params?: { search?: string; departmentId?: string; status?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/employees', { params })
    return response.data
  }

  async getEmployee(id: string) {
    const response = await this.client.get(`/employees/${id}`)
    return response.data
  }

  async createEmployee(data: any) {
    const response = await this.client.post('/employees', data)
    return response.data
  }

  async updateEmployee(id: string, data: any) {
    const response = await this.client.put(`/employees/${id}`, data)
    return response.data
  }

  async getDepartments() {
    const response = await this.client.get('/employees/departments')
    return response.data
  }

  async getDepartmentStats() {
    const response = await this.client.get('/employees/stats/departments')
    return response.data
  }

  async createSalaryStructure(employeeId: string, data: any) {
    const response = await this.client.post(`/employees/${employeeId}/salary`, data)
    return response.data
  }

  // ── Leave API ───────────────────────────────────────────────
  async getLeaveTypes() {
    const response = await this.client.get('/leave/types')
    return response.data
  }

  async createLeaveType(data: any) {
    const response = await this.client.post('/leave/types', data)
    return response.data
  }

  async getMyLeaveBalances(year?: number) {
    const response = await this.client.get('/leave/balances/my', { params: year ? { year } : undefined })
    return response.data
  }

  async getLeaveBalance(year?: number) {
    const response = await this.client.get('/leave/balance', { params: year ? { year } : undefined })
    return response.data
  }

  async getLeaveBalances(employeeId: string, year?: number) {
    const response = await this.client.get(`/leave/balances/${employeeId}`, { params: year ? { year } : undefined })
    return response.data
  }

  async createLeaveRequest(data: { leaveTypeId: string; startDate: string; endDate: string; reason?: string }) {
    const response = await this.client.post('/leave/requests', data)
    return response.data
  }

  async getMyLeaveRequests(params?: { status?: string; year?: number }) {
    const response = await this.client.get('/leave/requests/my', { params })
    return response.data
  }

  async getLeaveRequests(params?: { status?: string; employeeId?: string; year?: number; page?: number; limit?: number }) {
    const response = await this.client.get('/leave/requests', { params })
    return response.data
  }

  async approveLeaveRequest(requestId: string) {
    const response = await this.client.post(`/leave/requests/${requestId}/approve`)
    return response.data
  }

  async rejectLeaveRequest(requestId: string, reason: string) {
    const response = await this.client.post(`/leave/requests/${requestId}/reject`, { reason })
    return response.data
  }

  async cancelLeaveRequest(requestId: string) {
    const response = await this.client.post(`/leave/requests/${requestId}/cancel`)
    return response.data
  }

  // ── Performance API ─────────────────────────────────────────
  async getPerformanceCycles(status?: string) {
    const response = await this.client.get('/performance/cycles', { params: status ? { status } : undefined })
    return response.data
  }

  async createPerformanceCycle(data: any) {
    const response = await this.client.post('/performance/cycles', data)
    return response.data
  }

  async getGoals(params?: { employeeId?: string; status?: string }) {
    const response = await this.client.get('/performance/goals', { params })
    return response.data
  }

  async createGoal(employeeId: string, data: any) {
    const response = await this.client.post(`/performance/employees/${employeeId}/goals`, data)
    return response.data
  }

  async updateGoalProgress(goalId: string, progress: number, status?: string) {
    const response = await this.client.put(`/performance/goals/${goalId}/progress`, { progress, status })
    return response.data
  }

  async getAppraisals(params?: { cycleId?: string; employeeId?: string; status?: string }) {
    const response = await this.client.get('/performance/appraisals', { params })
    return response.data
  }

  async submitAppraisal(appraisalId: string, data: any) {
    const response = await this.client.post(`/performance/appraisals/${appraisalId}/submit`, data)
    return response.data
  }

  // ── Recruitment API ─────────────────────────────────────────
  async getJobPostings(params?: { status?: string; departmentId?: string }) {
    const response = await this.client.get('/recruitment/postings', { params })
    return response.data
  }

  async createJobPosting(data: any) {
    const response = await this.client.post('/recruitment/postings', data)
    return response.data
  }

  async updatePostingStatus(postingId: string, status: string) {
    const response = await this.client.patch(`/recruitment/postings/${postingId}/status`, { status })
    return response.data
  }

  async getApplicants(params?: { jobPostingId?: string; status?: string; page?: number }) {
    const response = await this.client.get('/recruitment/applicants', { params })
    return response.data
  }

  async updateApplicantStatus(applicantId: string, status: string) {
    const response = await this.client.patch(`/recruitment/applicants/${applicantId}/status`, { status })
    return response.data
  }

  async scheduleInterview(applicantId: string, data: any) {
    const response = await this.client.post(`/recruitment/applicants/${applicantId}/interviews`, data)
    return response.data
  }

  async hireApplicant(applicantId: string, data: any) {
    const response = await this.client.post(`/recruitment/applicants/${applicantId}/hire`, data)
    return response.data
  }

  // ── Training API ────────────────────────────────────────────
  async getTrainings(params?: { employeeId?: string; status?: string }) {
    const response = await this.client.get('/training/trainings', { params })
    return response.data
  }

  // ── Audit API ───────────────────────────────────────────────
  async getAuditLogs(params?: { resourceType?: string; action?: string; startDate?: string; endDate?: string; page?: number }) {
    const response = await this.client.get('/audit/logs', { params })
    return response.data
  }

  // ── Companies API ───────────────────────────────────────────
  async getCompanies() {
    const response = await this.client.get('/companies')
    return response.data
  }

  async getCompanyStats(companyId: string) {
    const response = await this.client.get(`/companies/${companyId}/stats`)
    return response.data
  }

  // Generic methods
  async get<T = any>(url: string, params?: any): Promise<T> {
    const response = await this.client.get(url, { params })
    return response.data
  }

  async getActivityFeed(params?: { limit?: number }): Promise<any> {
    return this.get('/activity/feed', params)
  }

  async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.client.post(url, data)
    return response.data
  }

  async put<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.client.put(url, data)
    return response.data
  }

  async delete<T = any>(url: string): Promise<T> {
    const response = await this.client.delete(url)
    return response.data
  }
}

export const apiClient = new APIClient()
