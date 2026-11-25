import type { Metadata } from 'next';
import SiteHeader from '@/components/ui/SiteHeader';
import SiteFooter from '@/components/ui/SiteFooter';
import FiguresBrowser from '@/components/search/FiguresBrowser';
import { figures, martialArts, sects } from '@/lib/data';

export const metadata: Metadata = {
  title: '인물 열전',
  description: '무림여지도의 인물 48명 — 시대·세력·경지로 찾아보는 강호 인물록.',
};

export default function FiguresPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-5 pb-20 pt-8 font-serif text-ink">
        <h1 className="text-3xl font-bold">인물 열전</h1>
        <p className="mt-2 text-sm text-ink-soft">
          전대 고수와 당대 인물 {figures.length}명. 경지는 한국 신무협의 관습 체계로 옮긴 값이며, 원작에 경지가
          명시된 경우에만 <span className="text-xs">원작묘사</span>로 적습니다.
        </p>
        <div className="mt-6">
          <FiguresBrowser figures={figures} sects={sects} arts={martialArts} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
