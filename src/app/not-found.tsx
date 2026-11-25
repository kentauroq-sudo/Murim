import Link from 'next/link';
import SiteHeader from '@/components/ui/SiteHeader';

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <p className="font-serif text-6xl font-bold text-accent">迷路</p>
        <h1 className="mt-4 font-serif text-2xl font-bold">길을 잃으셨습니다</h1>
        <p className="mt-2 text-ink-soft">찾으시는 기록이 없거나 주소가 바뀌었습니다.</p>
        <Link href="/" className="mt-8 rounded-lg bg-ink px-5 py-3 text-hanji hover:bg-ink-soft">
          강호 지도로 돌아가기
        </Link>
      </main>
    </>
  );
}
