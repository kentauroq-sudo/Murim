import type { Metadata } from 'next';
import SiteHeader from '@/components/ui/SiteHeader';
import SiteFooter from '@/components/ui/SiteFooter';
import MartialArtsBrowser from '@/components/search/MartialArtsBrowser';
import { figures, martialArts, sects } from '@/lib/data';

export const metadata: Metadata = {
  title: '무공 도감',
  description: '무림여지도의 무공 57종과 초식 172개를 한글·한자·초식 이름으로 찾아본다.',
};

export default function MartialArtsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-5 pb-20 pt-8 font-serif text-ink">
        <h1 className="text-3xl font-bold">무공 도감</h1>
        <p className="mt-2 text-sm text-ink-soft">
          문파·계통·등급으로 거르고, 초식 이름으로도 찾을 수 있습니다. 무공 {martialArts.length}종 · 초식{' '}
          {martialArts.reduce((n, a) => n + a.techniques.length, 0)}개.
        </p>
        <div className="mt-6">
          <MartialArtsBrowser arts={martialArts} sects={sects} figures={figures} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
