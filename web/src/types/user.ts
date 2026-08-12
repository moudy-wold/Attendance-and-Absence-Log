export interface User {
  id: number
  username: string
  fullName: string
  email: string | null
  phone: string
  isAdmin: boolean
  isEntry: boolean
  isActive: boolean
  isRegular: boolean
  isEmployee: boolean
  deviceId: string | null
  /** Not implemented by the backend yet — always false until it is. */
  mustChangePassword: boolean
}

/** Raw shape returned by the backend's UserSerializer (snake_case). */
export interface RawUser {
  id: number
  username: string
  full_name: string
  email: string | null
  phone: string
  is_admin: boolean
  is_entry: boolean
  is_active: boolean
  is_regular: boolean
  is_employee: boolean
  device_id: string | null
}

export function mapUser(raw: RawUser): User {
  return {
    id: raw.id,
    username: raw.username,
    fullName: raw.full_name,
    email: raw.email,
    phone: raw.phone,
    isAdmin: raw.is_admin,
    isEntry: raw.is_entry,
    isActive: raw.is_active,
    isRegular: raw.is_regular,
    isEmployee: raw.is_employee,
    deviceId: raw.device_id,
    mustChangePassword: false,
  }
}
