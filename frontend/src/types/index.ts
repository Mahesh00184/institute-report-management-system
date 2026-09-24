export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'DEPARTMENT' | 'VIEWER';
  department_id: number | null;
  is_active: boolean;
}

export interface Department {
  id: number;
  name: string;
  short_code: string;
  head_of_department?: string;
  email?: string;
  phone?: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
}

export interface AcademicYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  submission_deadline: string;
  description?: string;
  status: 'DRAFT' | 'OPEN' | 'SUBMISSION_CLOSED' | 'UNDER_COMPILATION' | 'PUBLISHED' | 'ARCHIVED';
}

export interface Faculty {
  id?: number;
  name: string;
  designation: string;
  qualification?: string;
  specialization?: string;
  experience_years: number;
}

export interface StudentStatistic {
  id?: number;
  total_students: number;
  male_students: number;
  female_students: number;
  ug_students: number;
  pg_students: number;
  graduating_students: number;
}

export interface Research {
  id?: number;
  title: string;
  authors: string;
  publication_type: string;
  journal_or_conference_name?: string;
  year?: number;
  doi_link?: string;
}

export interface Project {
  id?: number;
  title: string;
  project_type: string;
  student_names?: string;
  faculty_guide?: string;
  funding_amount: number;
  description?: string;
}

export interface Event {
  id?: number;
  event_name: string;
  event_type: string;
  event_date?: string;
  venue?: string;
  organizer?: string;
  participants_count: number;
  description?: string;
}

export interface Achievement {
  id?: number;
  title: string;
  person_or_team: string;
  category: string;
  date?: string;
  level: string;
  description?: string;
}

export interface Placement {
  id?: number;
  eligible_students: number;
  placed_students: number;
  highest_package: number;
  average_package: number;
  lowest_package: number;
  companies_visited: number;
}

export interface IndustryCollaboration {
  id?: number;
  company_name: string;
  mou_signed: boolean;
  date_signed?: string;
  collaborative_activities?: string;
}

export interface Infrastructure {
  id?: number;
  facility_name: string;
  lab_type: string;
  major_equipment?: string;
  cost: number;
  area_sqft: number;
}

export interface SupportingDocument {
  id: number;
  department_report_id: number;
  title: string;
  file_url: string;
  file_name: string;
  file_size: number;
  document_type: string;
  upload_date: string;
}

export interface ReportReviewComment {
  id: number;
  department_report_id: number;
  user_id: number;
  user_name?: string;
  section_name?: string;
  comment: string;
  created_at: string;
}

export interface ReportSubmissionHistory {
  id: number;
  department_report_id: number;
  action: string;
  actor_id: number;
  actor_name?: string;
  notes?: string;
  timestamp: string;
}

export interface DepartmentReport {
  id: number;
  department_id: number;
  academic_year_id: number;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CORRECTION_REQUIRED';
  submission_date?: string;
  last_updated?: string;
  admin_feedback?: string;
  department_name?: string;
  department_code?: string;
  academic_year_name?: string;
  department_info?: {
    name?: string;
    short_code?: string;
    head_of_department?: string;
    email?: string;
    phone?: string;
    overview?: string;
    vision?: string;
    mission?: string;
    hod_message?: string;
    contact_info?: string;
  };
  faculty: Faculty[];
  student_statistics?: StudentStatistic;
  research: Research[];
  projects: Project[];
  events: Event[];
  achievements: Achievement[];
  placement?: Placement;
  collaborations: IndustryCollaboration[];
  infrastructures: Infrastructure[];
  supporting_documents: SupportingDocument[];
  review_comments: ReportReviewComment[];
  history: ReportSubmissionHistory[];
}

export interface ReportSection {
  id: number;
  template_id: number;
  title: string;
  description?: string;
  order_index: number;
  is_required: boolean;
  is_enabled: boolean;
  section_type: string;
}

export interface ReportTemplate {
  id: number;
  academic_year_id: number;
  name: string;
  status: string;
  created_at: string;
  sections: ReportSection[];
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_email?: string;
  action: string;
  entity: string;
  entity_id?: number;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface DashboardStats {
  academic_year_id?: number;
  kpis: {
    total_departments: number;
    total_users: number;
    total_reports: number;
    draft_reports: number;
    submitted_reports: number;
    under_review_reports: number;
    approved_reports: number;
    correction_reports: number;
    rejected_reports: number;
    completion_percentage: number;
    total_faculty: number;
    total_students: number;
    total_ug_students: number;
    total_pg_students: number;
    total_graduating: number;
    total_male: number;
    total_female: number;
    total_publications: number;
    total_projects: number;
    total_events: number;
    total_achievements: number;
    total_eligible_placements: number;
    total_placed: number;
    overall_placement_rate: number;
    average_package_lpa: number;
    highest_package_lpa: number;
  };
  status_distribution: Array<{ name: string; value: number; color: string }>;
  department_metrics: Array<{
    department: string;
    code: string;
    status: string;
    faculty: number;
    research: number;
    projects: number;
    placed: number;
    placement_rate: number;
  }>;
}
