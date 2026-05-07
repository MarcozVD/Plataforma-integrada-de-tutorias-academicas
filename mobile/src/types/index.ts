export interface TutoringSession {
  id: number;
  subject: string;
  tutor_name: string;
  date: string;
  time: string;
  duration: number;
  location?: string;
  room?: string;
  capacity: number;
  enrolled: number;
  is_virtual: boolean;
  accessibility_type?: string;
  is_enrolled?: boolean;
}

export interface Room {
  id: number;
  name: string;
  building: string;
  capacity: number;
  floor?: number;
  has_wheelchair_access: boolean;
  has_visual_support: boolean;
  has_hearing_support: boolean;
  available: boolean;
  equipment?: string[];
}

export interface Notification {
  id: number;
  type: 'reminder' | 'change' | 'cancellation' | 'recommendation';
  title: string;
  message: string;
  created_at: string;
  session_id?: number;
}

export interface EnrolledSession extends TutoringSession {
  status: 'upcoming' | 'completed' | 'cancelled';
}

export interface StudentEnrollment {
  student_id: string;
  full_name: string;
  carrera?: string;
  disability_type?: string;
}

export interface AdminUser {
  id: string;
  university_id: string;
  full_name: string;
  email: string;
  user_type: string;
  carrera?: string;
  disability_type?: string;
  enrolled_sessions?: EnrolledSession[];
}

export interface ScheduleEntry {
  id: string;
  name: string;
  day: string;
  start: string;
  end: string;
  type: 'class' | 'activity';
  color?: string;
}

export interface SubjectPreference {
  subject: string;
  selected: boolean;
}
