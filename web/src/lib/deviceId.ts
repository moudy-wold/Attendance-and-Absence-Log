const DEVICE_ID_KEY = 'kiosk_device_id'

/** Persisted per-browser id used only by the kiosk (is_entry) login flow. */
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}
