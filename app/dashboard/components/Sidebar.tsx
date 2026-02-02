import Image from 'next/image';
import Link from 'next/link';

interface SidebarProps {
  userName: string;
  userRole: string;
  children: React.ReactNode;
}

export default function DashboardSidebar({ userName, userRole, children }: SidebarProps) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <Link href="/dashboard" className="p-6 border-b border-gray-200">
          <Image 
            src="/logo.png" 
            alt="Finora" 
            width={180} 
            height={50}
            priority
          />
        </Link>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-gray-900">{userName}</div>
              <div className="text-xs text-gray-500 uppercase">{userRole}</div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 text-center text-xs text-gray-500">
          © 2026 Finora
        </div>
      </div>
    </div>
  );
}