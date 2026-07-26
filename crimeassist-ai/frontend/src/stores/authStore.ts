import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthStore {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User) => void
  setAccessToken: (token: string) => void
  login: (user: User, accessToken: string, refreshToken?: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user }),
      setAccessToken: (token) => set({ accessToken: token }),

      login: (user, accessToken, refreshToken) => {
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken)
        }
        set({ user, accessToken, isAuthenticated: true, isLoading: false })
      },

      logout: () => {
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, isAuthenticated: false })
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'crimeassist-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
