/** 낙관(落款)풍 로고 — 이미지 없이 글자로 */
export default function BrandSeal({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.6 }}
      className="grid shrink-0 place-items-center rounded-[5px] bg-accent font-serif font-bold leading-none text-hanji"
    >
      武
    </span>
  );
}
