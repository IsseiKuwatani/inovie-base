import Link from 'next/link'
import './globals.css'
import { LayoutDashboard, FolderKanban, FlaskConical, Settings } from 'lucide-react'
import SidebarFooter from '@/components/SidebarFooter'
import Breadcrumbs from '@/components/Breadcrumbs'

export const metadata = {
  title: 'Inovie',
  description: '仮説・検証をもっとスマートに',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="flex min-h-screen bg-gray-50 text-gray-900">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 text-white flex flex-col px-6 py-8">
          <div className="text-2xl font-bold tracking-wide mb-12">Inovie</div>
          <nav className="space-y-4">
            <NavItem href="/" icon={<LayoutDashboard size={20} />}>ダッシュボード</NavItem>
            <NavItem href="/projects" icon={<FolderKanban size={20} />}>プロジェクト</NavItem>
            <NavItem href="#" icon={<FlaskConical size={20} />}>仮説</NavItem>
            <NavItem href="#" icon={<Settings size={20} />}>設定</NavItem>
          </nav>

          <SidebarFooter />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10 space-y-6">
          <Breadcrumbs /> {/* パンくずリストを常設！ */}
          {children}
        </main>
      </body>
    </html>
  )
}

function NavItem({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 hover:text-yellow-400 transition-colors"
    >
      {icon}
      <span className="text-sm font-medium">{children}</span>
    </Link>
  )
}
