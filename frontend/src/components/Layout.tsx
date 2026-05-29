import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'

export function Layout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto min-w-0 pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  )
}
