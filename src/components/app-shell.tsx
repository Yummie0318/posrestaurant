'use client';

import Link from 'next/link';
import { LayoutDashboard, LogOut, Menu, ReceiptText, Settings, ShoppingCart, Soup, Users2, UtensilsCrossed, X } from 'lucide-react';
import { useState } from 'react';
import { UserRole } from '@prisma/client';
import { cn } from '@/lib/utils';
import { Button, Card } from '@/components/ui';

type NavItem = { href: string; label: string; roles: UserRole[]; icon: React.ComponentType<{ className?: string }> };
type AppShellVariant = 'default' | 'pos';

const navItems: NavItem[] = [
  { href: '/cashier', label: 'Cashier', roles: [UserRole.ADMIN, UserRole.CASHIER], icon: ShoppingCart },
  { href: '/kitchen', label: 'Kitchen', roles: [UserRole.ADMIN, UserRole.KITCHEN], icon: Soup },
  { href: '/admin', label: 'Dashboard', roles: [UserRole.ADMIN], icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', roles: [UserRole.ADMIN], icon: ReceiptText },
  { href: '/admin/menu', label: 'Menu', roles: [UserRole.ADMIN], icon: UtensilsCrossed },
  { href: '/admin/users', label: 'Users', roles: [UserRole.ADMIN], icon: Users2 },
  { href: '/admin/settings', label: 'Settings', roles: [UserRole.ADMIN], icon: Settings },
];

function roleLabel(role: UserRole) {
  return role === UserRole.ADMIN ? 'Administrator' : role === UserRole.CASHIER ? 'Cashier' : 'Kitchen';
}

export function AppShell({
  children,
  pathname,
  user,
  variant = 'default',
  title,
  subtitle,
  hideSidebar = false,
  headerLogout = false,
}: {
  children: React.ReactNode;
  pathname: string;
  user: { name: string; role: UserRole };
  variant?: AppShellVariant;
  title?: string;
  subtitle?: string;
  hideSidebar?: boolean;
  headerLogout?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const showSidebar = !hideSidebar;
  const isPos = variant === 'pos';

  const sidebar = (
    <Card className="flex h-full flex-col overflow-hidden rounded-3xl border-transparent bg-[#111439] p-3 text-white shadow-[0_1px_2px_rgba(17,20,57,0.08)]">
      <div className="border-b border-white/10 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#5B6CFF_0%,#8B5CF6_100%)] text-sm font-bold text-white shadow-lg">{initials}</div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">PosPancitan</p>
              <p className="font-semibold text-white">{user.name}</p>
              <p className="text-xs text-white/60">{roleLabel(user.role)}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white lg:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.filter((item) => item.roles.includes(user.role)).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition',
                active ? 'bg-[linear-gradient(135deg,#3946C5_0%,#7C3AED_100%)] text-white shadow-sm' : 'text-white/72 hover:bg-white/8 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <form action="/api/auth/logout" method="post" className="p-2">
        <Button variant="outline" className="w-full justify-center border-white/14 bg-white/6 text-white hover:bg-white/10 hover:text-white">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </form>
    </Card>
  );

  return (
    <div className={cn('h-dvh overflow-hidden bg-[var(--background)] text-[var(--foreground)]')}>
      <div className={cn('mx-auto grid h-full gap-4 p-3 lg:p-4', showSidebar ? 'max-w-[1600px] lg:grid-cols-[260px_minmax(0,1fr)]' : 'max-w-[1700px]')}>
        {showSidebar ? <aside className="hidden h-full overflow-hidden lg:block">{sidebar}</aside> : null}
        {showSidebar ? (
          <div
            className={cn(
              'fixed inset-0 z-50 p-3 lg:hidden transition-all duration-300 ease-in-out',
              mobileOpen ? 'visible bg-[rgba(17,20,57,0.22)] backdrop-blur-sm' : 'invisible bg-transparent backdrop-blur-none pointer-events-none',
            )}
            onClick={() => setMobileOpen(false)}
          >
            <div
              className={cn(
                'h-full w-[300px] transition-transform duration-300 ease-in-out',
                mobileOpen ? 'translate-x-0' : '-translate-x-full',
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {sidebar}
            </div>
          </div>
        ) : null}

        <div className="flex min-h-0 flex-col gap-4 overflow-hidden">
          {/* Slim header */}
          <Card className="shrink-0 rounded-3xl border-[var(--border)] bg-white/92 px-4 py-2.5 shadow-none backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              {/* Left: hamburger (mobile) + page title */}
              <div className="flex min-w-0 items-center gap-2.5">
                {showSidebar ? (
                  <Button type="button" variant="outline" size="icon" className="shrink-0 lg:hidden" onClick={() => setMobileOpen(true)}>
                    <Menu className="h-4 w-4" />
                  </Button>
                ) : null}
                <h1 className="truncate text-base font-semibold text-[var(--foreground)]">
                  {title ?? (isPos ? 'Cashier POS' : 'Panciteria Operations')}
                </h1>
              </div>

              {/* Right: logout (if headerLogout) or just initials avatar on mobile */}
              <div className="flex shrink-0 items-center gap-2">
                {headerLogout ? (
                  <form action="/api/auth/logout" method="post">
                    <Button variant="outline" size="sm" className="h-8 rounded-xl px-3 text-xs">
                      <LogOut className="h-3.5 w-3.5" />
                      Logout
                    </Button>
                  </form>
                ) : null}
                {/* Avatar only shows on mobile since sidebar already shows it on desktop */}
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--primary)] text-xs font-bold text-white lg:hidden">
                  {initials}
                </div>
              </div>
            </div>
          </Card>

          <main className={cn('min-h-0 flex-1 overflow-hidden')}>{children}</main>
        </div>
      </div>
    </div>
  );
}