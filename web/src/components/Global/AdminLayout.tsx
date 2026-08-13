import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <main className="min-w-0 flex-1 pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  )
}
