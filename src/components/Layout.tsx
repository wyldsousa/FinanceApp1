import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  Bell, 
  User, 
  Menu, 
  LogOut,
  Bot,
  FileText,
  Tags,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/banks', label: 'Bancos', icon: Building2 },
  { path: '/transactions', label: 'Transações', icon: Wallet },
  { path: '/cards', label: 'Cartões', icon: CreditCard },
  { path: '/investments', label: 'Investimentos', icon: TrendingUp },
  { path: '/categories', label: 'Categorias', icon: Tags },
  { path: '/reminders', label: 'Lembretes', icon: Bell },
  { path: '/reports', label: 'Relatórios', icon: FileText },
  { path: '/assistant', label: 'Assistente IA', icon: Bot },
  { path: '/profile', label: 'Perfil', icon: User },
];

export function Layout({ children }: LayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.id);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">Finanças</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3 mb-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.photoURL} />
            <AvatarFallback className="bg-blue-600 text-white">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-800"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="flex items-center justify-between p-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Finanças</span>
          </Link>
          <div className="flex items-center gap-2">
            {/* Mobile Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-white">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-slate-900 border-slate-800">
                <DropdownMenuLabel className="flex items-center justify-between text-white">
                  <span>Notificações</span>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-blue-400 hover:text-blue-300"
                      onClick={() => markAllAsRead()}
                    >
                      Marcar todas como lidas
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-800" />
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-sm">
                    Nenhuma notificação
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`flex flex-col items-start p-3 cursor-pointer ${
                        !notification.isRead ? 'bg-blue-500/10' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <span className="text-sm font-medium text-white">{notification.title}</span>
                      <span className="text-xs text-slate-400 line-clamp-2">{notification.message}</span>
                      <span className="text-xs text-slate-500 mt-1">
                        {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-slate-900 border-slate-800 p-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 bg-slate-900 border-r border-slate-800 z-40">
        <SidebarContent />
      </div>

      {/* Desktop Header with Notifications */}
      <div className="hidden lg:flex fixed top-0 right-0 left-72 h-16 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 z-30 items-center justify-end px-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-white hover:bg-slate-800">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-slate-900 border-slate-800">
            <DropdownMenuLabel className="flex items-center justify-between text-white">
              <span>Notificações</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-blue-400 hover:text-blue-300"
                  onClick={() => markAllAsRead()}
                >
                  Marcar todas como lidas
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-sm">
                Nenhuma notificação
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex flex-col items-start p-3 cursor-pointer ${
                    !notification.isRead ? 'bg-blue-500/10' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <span className="text-sm font-medium text-white">{notification.title}</span>
                  <span className="text-xs text-slate-400 line-clamp-2">{notification.message}</span>
                  <span className="text-xs text-slate-500 mt-1">
                    {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Content */}
      <div className="lg:ml-72 pt-16 lg:pt-16 min-h-screen">
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
