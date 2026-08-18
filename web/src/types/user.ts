export interface User {
  id: number
  username: string
  firstName: string
  lastName: string
  fullName: string
  email: string | null
  phone: string
  type: string | null
  tc: string | null
  entity: string | null
  isAdmin: boolean
  isEntry: boolean
  isActive: boolean
  isRegular: boolean
  isEmployee: boolean
  deviceId: string | null
  isFirstLogin: boolean
}

/** Raw shape returned by the backend's UserSerializer (snake_case). */
export interface RawUser {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string | null
  phone: string
  type: string | null
  tc: string | null
  entity: string | null
  is_admin: boolean
  is_entry: boolean
  is_active: boolean
  is_regular: boolean
  is_employee: boolean
  device_id: string | null
  is_first_login: boolean
}

export function mapUser(raw: RawUser): User {
  return {
    id: raw.id,
    username: raw.username,
    firstName: raw.first_name,
    lastName: raw.last_name,
    fullName: `${raw.first_name} ${raw.last_name}`.trim() || raw.username,
    email: raw.email,
    phone: raw.phone,
    type: raw.type,
    tc: raw.tc,
    entity: raw.entity,
    isAdmin: raw.is_admin,
    isEntry: raw.is_entry,
    isActive: raw.is_active,
    isRegular: raw.is_regular,
    isEmployee: raw.is_employee,
    deviceId: raw.device_id,
    isFirstLogin: raw.is_first_login,
  }
}
