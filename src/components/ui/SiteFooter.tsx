import Link from 'next/link';
import { NAV_ITEMS, FOOTER_ITEMS } from '@/config/nav';

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-hanji-deep">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 text-sm text-ink-soft sm:grid-cols-[1fr_auto] sm:px-6">
        <div>
          <p className="font-serif text-base font-bold text-ink">무림여지도 武林輿地圖</p>
          <p className="mt-1 max-w-prose">
            무협 세계관의 문파·무공·인물·지리를 한 장의 지도로 정리한 비영리 아카이브입니다. 원작 문장은 싣지 않고
            직접 요약하며, 각 기록에 출처와 고증 구분을 밝힙니다.
          </p>
        </div>
        <nav aria-label="바닥글 메뉴" className="flex flex-wrap gap-x-5 gap-y-2 sm:flex-col">
          {[...NAV_ITEMS.filter((n) => n.href !== '/'), ...FOOTER_ITEMS].map((item) => (
            <Link key={item.href} href={item.href} className="py-1 hover:text-ink hover:underline">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
