const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export const tokenService = {
  getAccess(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  setTokens(access: string, refresh: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  },

  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },

  clearAndRedirect() {
    tokenService.clear()
    window.location.href = '/login'
  },
}
