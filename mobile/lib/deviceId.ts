import * as Crypto from 'expo-crypto'
import * as SecureStore from 'expo-secure-store'

const DEVICE_ID_KEY = 'device_id'

/** Persisted per-install id — this is what binds an account to a single phone. */
export async function getDeviceId(): Promise<string> {
  let id = await SecureStore.getItemAsync(DEVICE_ID_KEY)
  if (!id) {
    id = Crypto.randomUUID()
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id)
  }
  return id
}
