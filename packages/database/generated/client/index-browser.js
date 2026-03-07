
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.CompanyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  name_ar: 'name_ar',
  code: 'code',
  settings: 'settings',
  created_at: 'created_at',
  updated_at: 'updated_at',
  deleted_at: 'deleted_at'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  password_hash: 'password_hash',
  company_id: 'company_id',
  employee_id: 'employee_id',
  is_active: 'is_active',
  last_login: 'last_login',
  created_at: 'created_at',
  updated_at: 'updated_at',
  deleted_at: 'deleted_at'
};

exports.Prisma.EmployeeScalarFieldEnum = {
  id: 'id',
  company_id: 'company_id',
  employee_number: 'employee_number',
  first_name: 'first_name',
  first_name_ar: 'first_name_ar',
  last_name: 'last_name',
  last_name_ar: 'last_name_ar',
  email: 'email',
  phone: 'phone',
  hire_date: 'hire_date',
  department_id: 'department_id',
  manager_id: 'manager_id',
  position: 'position',
  position_ar: 'position_ar',
  status: 'status',
  probation_end: 'probation_end',
  date_of_birth: 'date_of_birth',
  nationality: 'nationality',
  iqama_number: 'iqama_number',
  passport_number: 'passport_number',
  created_at: 'created_at',
  updated_at: 'updated_at',
  deleted_at: 'deleted_at'
};

exports.Prisma.DepartmentScalarFieldEnum = {
  id: 'id',
  company_id: 'company_id',
  name: 'name',
  name_ar: 'name_ar',
  code: 'code',
  parent_id: 'parent_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
  deleted_at: 'deleted_at'
};

exports.Prisma.RoleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  name_ar: 'name_ar',
  description: 'description',
  company_id: 'company_id',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.PermissionScalarFieldEnum = {
  id: 'id',
  resource: 'resource',
  action: 'action',
  scope: 'scope',
  description: 'description',
  created_at: 'created_at'
};

exports.Prisma.RolePermissionScalarFieldEnum = {
  role_id: 'role_id',
  permission_id: 'permission_id',
  granted_at: 'granted_at'
};

exports.Prisma.UserRoleScalarFieldEnum = {
  user_id: 'user_id',
  role_id: 'role_id',
  company_id: 'company_id',
  assigned_at: 'assigned_at',
  assigned_by: 'assigned_by'
};

exports.Prisma.JobPostingScalarFieldEnum = {
  id: 'id',
  company_id: 'company_id',
  title: 'title',
  title_ar: 'title_ar',
  description: 'description',
  description_ar: 'description_ar',
  department_id: 'department_id',
  requirements: 'requirements',
  status: 'status',
  published_at: 'published_at',
  closed_at: 'closed_at',
  created_by: 'created_by',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.ApplicantScalarFieldEnum = {
  id: 'id',
  job_posting_id: 'job_posting_id',
  first_name: 'first_name',
  last_name: 'last_name',
  email: 'email',
  phone: 'phone',
  resume_path: 'resume_path',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at',
  employee_id: 'employee_id'
};

exports.Prisma.InterviewScalarFieldEnum = {
  id: 'id',
  applicant_id: 'applicant_id',
  scheduled_at: 'scheduled_at',
  interviewer_ids: 'interviewer_ids',
  type: 'type',
  status: 'status',
  notes: 'notes',
  rating: 'rating',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.InterviewFeedbackScalarFieldEnum = {
  id: 'id',
  interview_id: 'interview_id',
  interviewer_id: 'interviewer_id',
  rating: 'rating',
  feedback: 'feedback',
  recommendation: 'recommendation',
  created_at: 'created_at'
};

exports.Prisma.OnboardingChecklistScalarFieldEnum = {
  id: 'id',
  employee_id: 'employee_id',
  status: 'status',
  completed_at: 'completed_at',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.OnboardingTaskScalarFieldEnum = {
  id: 'id',
  checklist_id: 'checklist_id',
  title: 'title',
  title_ar: 'title_ar',
  description: 'description',
  order: 'order',
  is_completed: 'is_completed',
  completed_at: 'completed_at',
  completed_by: 'completed_by',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.DocumentScalarFieldEnum = {
  id: 'id',
  company_id: 'company_id',
  employee_id: 'employee_id',
  title: 'title',
  title_ar: 'title_ar',
  category: 'category',
  file_path: 'file_path',
  file_type: 'file_type',
  file_size: 'file_size',
  current_version: 'current_version',
  expiry_date: 'expiry_date',
  status: 'status',
  allow_download: 'allow_download',
  require_signature: 'require_signature',
  created_by: 'created_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  deleted_at: 'deleted_at'
};

exports.Prisma.DocumentVersionScalarFieldEnum = {
  id: 'id',
  document_id: 'document_id',
  version_number: 'version_number',
  file_path: 'file_path',
  file_size: 'file_size',
  changes: 'changes',
  created_by: 'created_by',
  created_at: 'created_at'
};

exports.Prisma.DocumentApprovalChainScalarFieldEnum = {
  id: 'id',
  document_id: 'document_id',
  status: 'status',
  current_step: 'current_step',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.DocumentApprovalStepScalarFieldEnum = {
  id: 'id',
  chain_id: 'chain_id',
  step_order: 'step_order',
  approver_id: 'approver_id',
  approver_role: 'approver_role',
  status: 'status',
  approved_at: 'approved_at',
  rejection_reason: 'rejection_reason',
  created_at: 'created_at'
};

exports.Prisma.DocumentSignatureScalarFieldEnum = {
  id: 'id',
  document_id: 'document_id',
  signer_id: 'signer_id',
  signature_data: 'signature_data',
  signature_type: 'signature_type',
  signed_at: 'signed_at',
  ip_address: 'ip_address',
  user_agent: 'user_agent',
  device_info: 'device_info',
  geolocation: 'geolocation',
  order_in_chain: 'order_in_chain'
};

exports.Prisma.DocumentAccessLogScalarFieldEnum = {
  id: 'id',
  document_id: 'document_id',
  user_id: 'user_id',
  action: 'action',
  ip_address: 'ip_address',
  user_agent: 'user_agent',
  accessed_at: 'accessed_at'
};

exports.Prisma.AttendanceLocationScalarFieldEnum = {
  id: 'id',
  company_id: 'company_id',
  name: 'name',
  name_ar: 'name_ar',
  latitude: 'latitude',
  longitude: 'longitude',
  radius_meters: 'radius_meters',
  wifi_ssids: 'wifi_ssids',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.AttendanceRuleScalarFieldEnum = {
  id: 'id',
  location_id: 'location_id',
  name: 'name',
  require_gps: 'require_gps',
  require_selfie: 'require_selfie',
  require_wifi: 'require_wifi',
  require_device_binding: 'require_device_binding',
  allowed_check_in_start: 'allowed_check_in_start',
  allowed_check_in_end: 'allowed_check_in_end',
  allowed_check_out_start: 'allowed_check_out_start',
  allowed_check_out_end: 'allowed_check_out_end',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.AttendanceDeviceScalarFieldEnum = {
  id: 'id',
  employee_id: 'employee_id',
  device_model: 'device_model',
  device_os: 'device_os',
  device_fingerprint: 'device_fingerprint',
  is_approved: 'is_approved',
  approved_by: 'approved_by',
  approved_at: 'approved_at',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.AttendanceRecordScalarFieldEnum = {
  id: 'id',
  company_id: 'company_id',
  employee_id: 'employee_id',
  location_id: 'location_id',
  device_id: 'device_id',
  check_in_time: 'check_in_time',
  check_out_time: 'check_out_time',
  gps_latitude: 'gps_latitude',
  gps_longitude: 'gps_longitude',
  gps_accuracy: 'gps_accuracy',
  gps_altitude: 'gps_altitude',
  gps_speed: 'gps_speed',
  wifi_ssid: 'wifi_ssid',
  selfie_path: 'selfie_path',
  selfie_hash: 'selfie_hash',
  selfie_metadata: 'selfie_metadata',
  validation_result: 'validation_result',
  flags: 'flags',
  status: 'status',
  correction_requested: 'correction_requested',
  correction_reason: 'correction_reason',
  correction_approved_by: 'correction_approved_by',
  correction_approved_at: 'correction_approved_at',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.LeaveTypeScalarFieldEnum = {
  id: 'id',
  company_id: 'company_id',
  name: 'name',
  name_ar: 'name_ar',
  code: 'code',
  days_per_year: 'days_per_year',
  is_paid: 'is_paid',
  requires_approval: 'requires_approval',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.LeaveBalanceScalarFieldEnum = {
  id: 'id',
  employee_id: 'employee_id',
  leave_type_id: 'leave_type_id',
  year: 'year',
  total_days: 'total_days',
  used_days: 'used_days',
  remaining_days: 'remaining_days',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.LeaveRequestScalarFieldEnum = {
  id: 'id',
  employee_id: 'employee_id',
  leave_type_id: 'leave_type_id',
  start_date: 'start_date',
  end_date: 'end_date',
  total_days: 'total_days',
  reason: 'reason',
  status: 'status',
  approved_by: 'approved_by',
  approved_at: 'approved_at',
  rejection_reason: 'rejection_reason',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.HolidayScalarFieldEnum = {
  id: 'id',
  company_id: 'company_id',
  name: 'name',
  name_ar: 'name_ar',
  date: 'date',
  is_recurring: 'is_recurring',
  created_at: 'created_at'
};

exports.Prisma.PayrollCycleScalarFieldEnum = {
  id: 'id',
  company_id: 'company_id',
  period_start: 'period_start',
  period_end: 'period_end',
  status: 'status',
  prepared_by: 'prepared_by',
  prepared_at: 'prepared_at',
  reviewed_by: 'reviewed_by',
  reviewed_at: 'reviewed_at',
  approved_by_gm: 'approved_by_gm',
  approved_at_gm: 'approved_at_gm',
  executed_by: 'executed_by',
  executed_at: 'executed_at',
  is_locked: 'is_locked',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.SalaryStructureScalarFieldEnum = {
  id: 'id',
  employee_id: 'employee_id',
  basic_salary: 'basic_salary',
  housing_allowance: 'housing_allowance',
  transport_allowance: 'transport_allowance',
  other_allowances: 'other_allowances',
  effective_from: 'effective_from',
  effective_to: 'effective_to',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.PayrollRecordScalarFieldEnum = {
  id: 'id',
  cycle_id: 'cycle_id',
  employee_id: 'employee_id',
  basic_salary: 'basic_salary',
  allowances: 'allowances',
  overtime_amount: 'overtime_amount',
  bonuses: 'bonuses',
  gross_salary: 'gross_salary',
  deductions: 'deductions',
  total_deductions: 'total_deductions',
  net_salary: 'net_salary',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.PerformanceCycleScalarFieldEnum = {
  id: 'id',
  company_id: 'company_id',
  name: 'name',
  name_ar: 'name_ar',
  start_date: 'start_date',
  end_date: 'end_date',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.GoalScalarFieldEnum = {
  id: 'id',
  employee_id: 'employee_id',
  title: 'title',
  title_ar: 'title_ar',
  description: 'description',
  target_date: 'target_date',
  status: 'status',
  progress: 'progress',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.AppraisalScalarFieldEnum = {
  id: 'id',
  cycle_id: 'cycle_id',
  employee_id: 'employee_id',
  reviewer_id: 'reviewer_id',
  rating: 'rating',
  feedback: 'feedback',
  strengths: 'strengths',
  areas_for_improvement: 'areas_for_improvement',
  status: 'status',
  submitted_at: 'submitted_at',
  acknowledged_at: 'acknowledged_at',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.TrainingRecordScalarFieldEnum = {
  id: 'id',
  employee_id: 'employee_id',
  title: 'title',
  title_ar: 'title_ar',
  provider: 'provider',
  start_date: 'start_date',
  end_date: 'end_date',
  status: 'status',
  certificate_path: 'certificate_path',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.CertificationScalarFieldEnum = {
  id: 'id',
  employee_id: 'employee_id',
  name: 'name',
  name_ar: 'name_ar',
  issuing_org: 'issuing_org',
  issue_date: 'issue_date',
  expiry_date: 'expiry_date',
  certificate_path: 'certificate_path',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.DisciplinaryIncidentScalarFieldEnum = {
  id: 'id',
  company_id: 'company_id',
  employee_id: 'employee_id',
  incident_date: 'incident_date',
  type: 'type',
  description: 'description',
  severity: 'severity',
  reported_by: 'reported_by',
  status: 'status',
  resolution: 'resolution',
  resolved_at: 'resolved_at',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.DisciplinaryActionScalarFieldEnum = {
  id: 'id',
  incident_id: 'incident_id',
  action_type: 'action_type',
  action_date: 'action_date',
  description: 'description',
  approved_by: 'approved_by',
  approved_at: 'approved_at',
  created_at: 'created_at'
};

exports.Prisma.TerminationScalarFieldEnum = {
  id: 'id',
  company_id: 'company_id',
  employee_id: 'employee_id',
  termination_type: 'termination_type',
  notice_date: 'notice_date',
  last_working_day: 'last_working_day',
  reason: 'reason',
  status: 'status',
  approved_by: 'approved_by',
  approved_at: 'approved_at',
  final_settlement_amount: 'final_settlement_amount',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.ExitChecklistScalarFieldEnum = {
  id: 'id',
  termination_id: 'termination_id',
  items: 'items',
  is_completed: 'is_completed',
  completed_at: 'completed_at',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  timestamp: 'timestamp',
  user_id: 'user_id',
  company_id: 'company_id',
  action: 'action',
  resource_type: 'resource_type',
  resource_id: 'resource_id',
  ip_address: 'ip_address',
  user_agent: 'user_agent',
  changes: 'changes',
  metadata: 'metadata'
};

exports.Prisma.SystemSettingScalarFieldEnum = {
  id: 'id',
  key: 'key',
  value: 'value',
  description: 'description',
  updated_at: 'updated_at',
  updated_by: 'updated_by'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  Company: 'Company',
  User: 'User',
  Employee: 'Employee',
  Department: 'Department',
  Role: 'Role',
  Permission: 'Permission',
  RolePermission: 'RolePermission',
  UserRole: 'UserRole',
  JobPosting: 'JobPosting',
  Applicant: 'Applicant',
  Interview: 'Interview',
  InterviewFeedback: 'InterviewFeedback',
  OnboardingChecklist: 'OnboardingChecklist',
  OnboardingTask: 'OnboardingTask',
  Document: 'Document',
  DocumentVersion: 'DocumentVersion',
  DocumentApprovalChain: 'DocumentApprovalChain',
  DocumentApprovalStep: 'DocumentApprovalStep',
  DocumentSignature: 'DocumentSignature',
  DocumentAccessLog: 'DocumentAccessLog',
  AttendanceLocation: 'AttendanceLocation',
  AttendanceRule: 'AttendanceRule',
  AttendanceDevice: 'AttendanceDevice',
  AttendanceRecord: 'AttendanceRecord',
  LeaveType: 'LeaveType',
  LeaveBalance: 'LeaveBalance',
  LeaveRequest: 'LeaveRequest',
  Holiday: 'Holiday',
  PayrollCycle: 'PayrollCycle',
  SalaryStructure: 'SalaryStructure',
  PayrollRecord: 'PayrollRecord',
  PerformanceCycle: 'PerformanceCycle',
  Goal: 'Goal',
  Appraisal: 'Appraisal',
  TrainingRecord: 'TrainingRecord',
  Certification: 'Certification',
  DisciplinaryIncident: 'DisciplinaryIncident',
  DisciplinaryAction: 'DisciplinaryAction',
  Termination: 'Termination',
  ExitChecklist: 'ExitChecklist',
  AuditLog: 'AuditLog',
  SystemSetting: 'SystemSetting'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
