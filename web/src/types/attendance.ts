import type { User, RawUser } from './user'

export interface Attendance {
  id: number
  date: string
  checkIn: string
  checkOut: string | null
}

export interface RawAttendance {
  id: number
  date: string
  check_in: string
  check_out: string | null
}

export function mapAttendance(raw: RawAttendance): Attendance {
  return {
    id: raw.id,
    date: raw.date,
    checkIn: raw.check_in,
    checkOut: raw.check_out,
  }
}

export interface EmployeeAttendance extends User {
  attendance: Attendance[]
}

export interface RawEmployeeAttendance extends RawUser {
  attendance: RawAttendance[]
  present_days: number
  absent_days: number
  late_minutes: number
  early_leave_minutes: number
}
