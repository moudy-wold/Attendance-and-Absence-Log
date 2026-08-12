// axios.ts can't import AuthContext directly (circular: AuthContext calls the
// api layer). AuthProvider registers a handler here so a 401 can clear its
// in-memory user state; Expo Router's Stack.Protected guard then redirects.
type UnauthorizedHandler = () => void

let handler: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(fn: UnauthorizedHandler | null) {
  handler = fn
}

export function notifyUnauthorized() {
  handler?.()
}
