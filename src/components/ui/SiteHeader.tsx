'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BrandSeal from './BrandSeal';
import { NAV_ITEMS } from '@/config/nav';

export default function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href.replace(/\/$/, ''));

  return (
    <header
      className={
        overlay
          ? 'pointer-events-none absolute inset-x-0 top-0 z-[900] px-3 py-3 sm:px-4'
          : 'sticky top-0 z-[900] border-b border-line bg-hanji/95 px-3 py-2 backdrop-blur sm:px-4'
      }
    >
      <a href="#main" className="skip-link">
        본문으로 건너뛰기
      </a>
      <div
        className={
          overlay
            ? 'pointer-events-auto mx-auto flex max-w-7xl items-center gap-3 rounded-lg border border-line-strong bg-hanji/95 px-3 py-1.5 shadow-[var(--shadow-panel)] backdrop-blur'
            : 'mx-auto flex max-w-7xl items-center gap-3'
        }
      >
        <Link href="/" className="flex shrink-0 items-center gap-2 py-1">
          <BrandSeal />
          <span className="text-lg font-bold tracking-tight">무림여지도</span>
          <span className="hidden text-xs text-ink-muted sm:inline">武林輿地圖</span>
        </Link>
        <nav aria-label="주 메뉴" className="-mr-1 ml-auto flex min-w-0 items-center gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={
                isActive(item.href)
                  ? 'inline-flex min-h-10 shrink-0 items-center rounded-md bg-ink px-3 text-[0.9375rem] text-hanji'
                  : 'inline-flex min-h-10 shrink-0 items-center rounded-md px-3 text-[0.9375rem] text-ink-soft hover:bg-hanji-deep hover:text-ink'
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
