export interface User {
  id: string;
  email: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  name: string;
  college?: string;
  degree?: string;
  branch?: string;
  grad_year?: number;
  semester?: number;
  target_role?: string;
  target_companies?: string;
  preferred_domain?: string;
  placement_season?: string;
  daily_prep_hours?: number;
  dsa_level?: number;
  aptitude_level?: number;
  core_cs_level?: number;
  programming_level?: number;
  sql_level?: number;
  communication_level?: number;
  interview_level?: number;
  avatar_url?: string;
  theme?: string;
  accent_color?: string;
  onboarding_completed?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PlacementReadiness {
  overall: number;
  dsa: number;
  aptitude: number;
  coreCs: number;
  projects: number;
  communication: number;
  resume: number;
  mockInterviews: number;
}

export interface TodayTask {
  id: string;
  user_id: string;
  title: string;
  category: string;
  duration_minutes: number;
  is_completed: number;
  task_date: string;
  order_index: number;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: string;
  frequency: string;
  goal_days_per_week: number;
  color: string;
  icon: string;
  start_date: string;
  total_completions?: number;
  completed_today?: number;
}

export interface DSATopic {
  id: string;
  name: string;
  slug: string;
  order_index: number;
  description: string;
  total_target: number;
  solvedCount?: number;
  easyCount?: number;
  mediumCount?: number;
  hardCount?: number;
  confidence?: number;
  percentage?: number;
}

export interface CodingProblem {
  id: string;
  user_id: string;
  name: string;
  platform: 'LeetCode' | 'HackerRank' | 'CodeChef' | 'GeeksforGeeks' | 'SkillRack' | 'Codeforces' | string;
  url?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  status: 'NOT STARTED' | 'ATTEMPTED' | 'SOLVED' | 'NEEDS REVISION' | 'MASTERED';
  time_taken_minutes?: number;
  hint_used?: number;
  approach?: string;
  complexity?: string;
  notes?: string;
  confidence?: number;
  revision_date?: string;
  created_at: string;
}

export interface CoreTopic {
  id: string;
  subject_id: string;
  name: string;
  slug: string;
  order_index: number;
  key_concepts?: string;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface CoreSubject {
  id: string;
  name: string;
  slug: string;
  description?: string;
  order_index: number;
  topics: CoreTopic[];
  completedCount: number;
  totalCount: number;
  percentage: number;
}

export interface AptitudeQuestion {
  id: string;
  category: 'Quantitative' | 'Logical Reasoning' | 'Verbal';
  topic: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
  difficulty: string;
}

export interface SQLChallenge {
  id: string;
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  schema_desc: string;
  starter_sql: string;
  solution_sql: string;
  explanation?: string;
  status?: 'NOT STARTED' | 'ATTEMPTED' | 'SOLVED';
  savedQuery?: string;
}

export interface Resource {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  type: 'PDF' | 'VIDEO' | 'ARTICLE' | 'WEBSITE' | 'GITHUB' | 'CHEAT SHEET' | 'NOTES' | 'PRACTICE' | 'INTERVIEW' | 'ROADMAP';
  subject: string;
  topic?: string;
  difficulty: string;
  url?: string;
  tags?: string;
  estimated_time_minutes: number;
  is_global: number;
  is_bookmarked?: number;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  subject?: string;
  topic?: string;
  company?: string;
  project?: string;
  tags?: string;
  is_bookmarked?: number;
  created_at: string;
  updated_at: string;
}

export interface Mistake {
  id: string;
  user_id: string;
  problem_name: string;
  topic: string;
  mistake_desc: string;
  correct_approach: string;
  explanation?: string;
  lesson_learned: string;
  confidence: number;
  revision_date: string;
  is_resolved: number;
  created_at: string;
}

export interface RevisionItem {
  id: string;
  user_id: string;
  title: string;
  category: string;
  topic_or_subject: string;
  source_type: string;
  source_id?: string;
  due_date: string;
  interval_days: number;
  repetitions: number;
  ease_factor: number;
  last_reviewed_at?: string;
}

export interface Company {
  id: string;
  user_id: string;
  name: string;
  role: string;
  package_details?: string;
  eligibility?: string;
  application_date?: string;
  assessment_date?: string;
  interview_date?: string;
  status: 'WISHLIST' | 'APPLIED' | 'ONLINE ASSESSMENT' | 'TECHNICAL' | 'HR' | 'OFFER' | 'REJECTED';
  notes?: string;
  resources?: any[];
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  tech_stack?: string;
  github_url?: string;
  live_url?: string;
  status: 'IDEA' | 'IN PROGRESS' | 'COMPLETED';
  checklist_json?: string;
  architecture_notes?: string;
  demo_url?: string;
  interview_explanation?: string;
  created_at: string;
}

export interface ResumeData {
  id: string;
  user_id: string;
  checklist_json: string;
  skills_summary?: string;
  projects_highlight?: string;
  certifications?: string;
  notes?: string;
  updated_at: string;
}

export interface InterviewQuestion {
  id: string;
  category: 'TECHNICAL INTERVIEW' | 'HR INTERVIEW' | 'BEHAVIORAL INTERVIEW' | 'PROJECT INTERVIEW';
  question: string;
  sample_answer?: string;
  my_notes?: string;
  status: 'Not Started' | 'Practicing' | 'Can Explain' | 'Mastered';
  difficulty: string;
  is_global: number;
}

export interface MockInterview {
  id: string;
  user_id: string;
  company_name: string;
  role: string;
  interview_date: string;
  technical_score: number;
  communication_score: number;
  problem_solving_score: number;
  confidence: number;
  feedback?: string;
  improvement_areas?: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  category: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  is_completed?: number;
}
