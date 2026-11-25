import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/ui/SiteHeader';
import SiteFooter from '@/components/ui/SiteFooter';
import { figures, martialArts, places, sects } from '@/lib/data';

export const metadata: Metadata = {
  title: '사이트 소개',
  description: '무림여지도가 무엇을, 어떤 기준으로 기록하는지 소개합니다.',
};

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'contact@example.com';

export default function AboutPage() {
  const stats = [
    { label: '문파', value: sects.length },
    { label: '무공', value: martialArts.length },
    { label: '인물', value: figures.length },
    { label: '명소', value: places.length },
  ];
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-3xl px-4 pb-8 pt-8 sm:px-6">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">
          무림여지도 <span className="text-2xl font-normal text-ink-muted">武林輿地圖</span>
        </h1>
        <p className="mt-4 text-[1.0625rem] leading-[1.8]">
          무림여지도는 무협 소설 속 문파·무공·인물·지리를 한 장의 수묵 고지도 위에 모아, 어느 문파가 어디에 자리 잡고 누구와
          겨루는지 한눈에 볼 수 있게 만든 아카이브입니다.
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-line bg-hanji-deep p-4 text-center">
              <dt className="text-sm text-ink-muted">{s.label}</dt>
              <dd className="font-serif text-3xl font-bold">{s.value}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-10 font-serif text-2xl font-bold">기록 원칙</h2>
        <ul className="mt-3 space-y-3 leading-relaxed">
          <li>모든 고유명사는 처음 나올 때 한글과 한자를 함께 적습니다.</li>
          <li>기록마다 출처 작품을 밝히고, 원작 문장을 옮기지 않고 직접 요약합니다.</li>
          <li className="flex flex-wrap items-center gap-2">
            설정의 근거를 두 가지로 구분합니다: <span className="rounded-full border border-ink-soft px-2.5 py-0.5 text-sm text-ink-soft">정통고증</span> 김용·고룡 등 중국 고전 무협 원작,
            <span className="rounded-full border border-dashed border-accent px-2.5 py-0.5 text-sm text-accent">신무협</span> 한국 무협·웹소설에서 정착한 설정.
          </li>
          <li>배경 지도는 저작권이 소멸한 퍼블릭 도메인 고지도를 씁니다.</li>
        </ul>

        <h2 className="mt-10 font-serif text-2xl font-bold">오류 제보·문의</h2>
        <p className="mt-3 leading-relaxed">
          잘못된 고증이나 빠진 문파를 알려 주시면 확인 후 반영합니다:{' '}
          <a href={`mailto:${CONTACT}`} className="underline">
            {CONTACT}
          </a>
        </p>

        <Link href="/" className="mt-10 inline-flex min-h-12 items-center rounded-lg bg-ink px-5 font-serif font-bold text-hanji hover:bg-ink-soft">
          강호 지도 펼치기 →
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
