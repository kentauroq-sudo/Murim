import type { Metadata } from 'next';
import SiteHeader from '@/components/ui/SiteHeader';
import SiteFooter from '@/components/ui/SiteFooter';

export const metadata: Metadata = { title: '개인정보처리방침' };

// 배포 전 연락처와 시행일을 실제 값으로 바꾼다.
const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'contact@example.com';
const EFFECTIVE_DATE = '2026년 12월 1일';

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-3xl px-4 pb-8 pt-8 sm:px-6 [&_h2]:mt-8 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-bold [&_li]:mt-1 [&_p]:mt-3 [&_p]:leading-relaxed [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
        <h1 className="font-serif text-3xl font-bold">개인정보처리방침</h1>
        <p className="text-sm text-ink-muted">시행일: {EFFECTIVE_DATE}</p>

        <h2>1. 수집하는 정보</h2>
        <p>
          무림여지도(이하 &lsquo;사이트&rsquo;)는 회원가입이나 로그인 기능이 없으며, 이름·연락처 등 개인을 직접 식별하는 정보를
          수집하지 않습니다.
        </p>

        <h2>2. 광고와 쿠키</h2>
        <p>사이트는 운영비 마련을 위해 Google 애드센스 광고를 게재합니다.</p>
        <ul>
          <li>Google을 포함한 제3자 광고 사업자는 쿠키를 사용해 이용자가 이 사이트나 다른 사이트를 방문한 기록을 바탕으로 광고를 게재합니다.</li>
          <li>Google은 광고 쿠키를 사용해 이용자의 방문 기록에 근거한 맞춤 광고를 제공할 수 있습니다.</li>
          <li>
            이용자는{' '}
            <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="underline">
              Google 광고 설정
            </a>
            에서 맞춤 광고를 끌 수 있으며,{' '}
            <a href="https://www.aboutads.info/choices" target="_blank" rel="noopener noreferrer" className="underline">
              aboutads.info
            </a>
            에서 다른 제3자 사업자의 맞춤 광고 쿠키도 거부할 수 있습니다.
          </li>
          <li>
            Google이 수집한 정보를 어떻게 쓰는지는{' '}
            <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="underline">
              Google 파트너 사이트 정책
            </a>
            에서 확인할 수 있습니다.
          </li>
        </ul>

        <h2>3. 브라우저 저장소</h2>
        <p>
          사이트는 필터 설정 등 화면 편의 기능을 위해 이용자 브라우저의 저장소를 쓸 수 있습니다. 이 정보는 이용자 기기에만
          남고 사이트 운영자에게 전송되지 않으며, 브라우저 설정에서 언제든 지울 수 있습니다.
        </p>

        <h2>4. 문의</h2>
        <p>
          개인정보 관련 문의: <a href={`mailto:${CONTACT}`} className="underline">{CONTACT}</a>
        </p>

        <h2>5. 변경</h2>
        <p>이 방침이 바뀌면 이 페이지에 시행일과 함께 알립니다.</p>
      </main>
      <SiteFooter />
    </>
  );
}
