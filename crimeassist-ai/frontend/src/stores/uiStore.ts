import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  sidebarCollapsed: boolean
  darkMode: boolean
  notificationsOpen: boolean
  activePage: string
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleDarkMode: () => void
  setDarkMode: (dark: boolean) => void
  setActivePage: (page: string) => void
  toggleNotifications: () => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      darkMode: false,
      notificationsOpen: false,
      activePage: 'dashboard',

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleDarkMode: () =>
        set((s) => {
          const dark = !s.darkMode
          if (dark) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
          return { darkMode: dark }
        }),
      setDarkMode: (dark) => {
        if (dark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        set({ darkMode: dark })
      },
      setActivePage: (page) => set({ activePage: page }),
      toggleNotifications: () => set((s) => ({ notificationsOpen: !s.notificationsOpen })),
    }),
    {
      name: 'crimeassist-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        darkMode: state.darkMode,
      }),
    }
  )
)
