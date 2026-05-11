/**
 * ContentLoader — premium skeleton loader system
 *
 * Usage:
 *   <ContentLoader variant="products" />   → hero + filter bar + card grid skeleton
 *   <ContentLoader variant="projects" />   → split hero + card grid skeleton
 *   <ContentLoader variant="detail" />     → large hero + 2-col content skeleton
 *   <ContentLoader />                      → generic skeleton rows (fallback)
 */

const shimmer = `
  @keyframes sk-shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position: 600px 0;  }
  }
  .sk {
    background: linear-gradient(90deg,
      #e8eaed 0%, #e8eaed 40%,
      #f3f4f6 50%,
      #e8eaed 60%, #e8eaed 100%
    );
    background-size: 600px 100%;
    animation: sk-shimmer 1.4s ease-in-out infinite;
    border-radius: 2px;
  }
  .sk-dark {
    background: linear-gradient(90deg,
      rgba(255,255,255,0.07) 0%,  rgba(255,255,255,0.07) 40%,
      rgba(255,255,255,0.14) 50%,
      rgba(255,255,255,0.07) 60%, rgba(255,255,255,0.07) 100%
    );
    background-size: 600px 100%;
    animation: sk-shimmer 1.4s ease-in-out infinite;
    border-radius: 2px;
  }
`

// ── Shared Sk element ──────────────────────────────────────────────────────────
function Sk({ w = '100%', h = '14px', className = '', dark = false }) {
  return (
    <div
      className={`${dark ? 'sk-dark' : 'sk'} ${className}`}
      style={{ width: w, height: h }}
    />
  )
}

// ── Products skeleton ──────────────────────────────────────────────────────────
function ProductsSkeleton() {
  return (
    <div className="pt-32">
      {/* Hero bar */}
      <div className="w-full h-64 md:h-72 bg-primary/90 px-8 md:px-16 flex flex-col justify-center gap-5">
        <Sk w="140px" h="12px" dark />
        <Sk w="55%" h="56px" dark />
        <Sk w="35%" h="16px" dark />
      </div>

      {/* Filter bar */}
      <div className="bg-surface-container-low px-8 md:px-16 py-5 border-b border-outline-variant/10 flex items-center gap-3 flex-wrap">
        {['80px','110px','90px','100px'].map((w, i) => <Sk key={i} w={w} h="32px" />)}
        <div className="flex-1" />
        <Sk w="160px" h="32px" />
        <Sk w="200px" h="32px" />
      </div>

      {/* Card grid */}
      <div className="px-8 md:px-16 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-outline-variant/10 bg-surface-container-lowest flex flex-col">
            <Sk w="100%" h="240px" className="rounded-none" />
            <div className="p-8 space-y-4">
              <Sk w="80px" h="10px" />
              <Sk w="70%" h="22px" />
              <Sk w="90%" h="12px" />
              <Sk w="75%" h="12px" />
              <div className="pt-4 border-t border-outline-variant/10 flex justify-between items-center">
                <Sk w="100px" h="18px" />
                <Sk w="80px" h="14px" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Projects skeleton ──────────────────────────────────────────────────────────
function ProjectsSkeleton() {
  return (
    <div className="pt-32 pb-32">
      {/* Split hero */}
      <section className="px-4 sm:px-8 md:px-16 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border-l-4 border-primary/30 rtl:border-l-0 rtl:border-r-4">
          <div className="md:col-span-8 bg-[#f2f4f7] p-8 sm:p-12 lg:p-24 flex flex-col gap-5">
            <Sk w="120px" h="12px" />
            <Sk w="60%" h="64px" />
            <Sk w="80%" h="16px" />
            <Sk w="65%" h="16px" />
          </div>
          <div className="md:col-span-4 h-[280px] md:h-auto bg-slate-200">
            <div className="w-full h-full" style={{ background: 'linear-gradient(180deg, #1a2236 0%, #243050 100%)' }}>
              <div className="h-full p-8 flex flex-col justify-end gap-3">
                <Sk w="100px" h="10px" dark />
                <Sk w="75%" h="30px" dark />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter + cards */}
      <section className="px-4 sm:px-8 md:px-16">
        <div className="flex justify-between items-end border-b border-outline-variant/30 pb-6 mb-10 flex-wrap gap-4">
          <div className="space-y-2">
            <Sk w="160px" h="24px" />
            <Sk w="120px" h="12px" />
          </div>
          <div className="flex gap-3">
            {['80px','100px','90px'].map((w, i) => <Sk key={i} w={w} h="36px" />)}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Featured card */}
          <div className="lg:col-span-8 border border-outline-variant/15 bg-surface-container-lowest overflow-hidden">
            <Sk w="100%" h="320px" className="rounded-none" />
            <div className="p-6 space-y-4">
              <Sk w="55%" h="24px" />
              <Sk w="85%" h="14px" />
              <Sk w="70%" h="14px" />
              <div className="pt-4 border-t border-outline-variant/10 grid grid-cols-2 gap-3">
                <Sk w="100%" h="56px" />
                <Sk w="100%" h="56px" />
              </div>
            </div>
          </div>

          {/* Two side cards */}
          {[0, 1].map(i => (
            <div key={i} className="lg:col-span-4 border border-outline-variant/15 bg-surface-container-lowest overflow-hidden">
              <Sk w="100%" h="220px" className="rounded-none" />
              <div className="p-6 space-y-3">
                <Sk w="65%" h="20px" />
                <Sk w="90%" h="12px" />
                <Sk w="75%" h="12px" />
                <div className="pt-3 border-t border-outline-variant/10 flex justify-between items-center">
                  <Sk w="80px" h="12px" />
                  <Sk w="44px" h="44px" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// ── Detail skeleton (product-detail / project-detail) ─────────────────────────
function DetailSkeleton() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <div className="relative w-full h-[500px] bg-primary flex flex-col justify-end px-8 pb-16 max-w-7xl mx-auto">
        <div className="space-y-5">
          <Sk w="120px" h="28px" dark />
          <Sk w="65%" h="68px" dark />
        </div>
      </div>

      {/* 2-col grid */}
      <section className="py-16 px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left content */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-surface-container-low p-10 space-y-5">
              <Sk w="200px" h="28px" />
              <Sk w="100%" h="14px" />
              <Sk w="95%" h="14px" />
              <Sk w="80%" h="14px" />
              <Sk w="88%" h="14px" />
              <Sk w="70%" h="14px" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Sk w="100%" h="220px" className="rounded-none" />
              <Sk w="100%" h="220px" className="rounded-none" />
            </div>
          </div>
          {/* Right sidebar */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-primary p-8 space-y-6">
              <Sk w="100px" h="12px" dark />
              {['Client','Category','Budget'].map(f => (
                <div key={f} className="space-y-2">
                  <Sk w="70px" h="10px" dark />
                  <Sk w="140px" h="22px" dark />
                </div>
              ))}
            </div>
            <div className="bg-surface-container-low p-8 space-y-5">
              <Sk w="80px" h="12px" />
              {['Start','End','Duration'].map(f => (
                <div key={f} className="space-y-2">
                  <Sk w="60px" h="10px" />
                  <Sk w="110px" h="18px" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Product-detail skeleton ────────────────────────────────────────────────────
function ProductDetailSkeleton() {
  return (
    <div className="pt-32 pb-20 px-4 sm:px-8 max-w-screen-2xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Gallery column */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main image */}
          <Sk w="100%" h="420px" className="rounded-none" />
          {/* Thumbnails */}
          <div className="flex gap-4">
            {[0,1,2].map(i => <Sk key={i} w="80px" h="80px" className="rounded-none" />)}
          </div>
        </div>

        {/* Info column */}
        <div className="lg:col-span-5 space-y-8">
          {/* Category + title */}
          <div className="space-y-4">
            <Sk w="90px" h="24px" />
            <Sk w="80%" h="48px" />
            <Sk w="95%" h="14px" />
            <Sk w="85%" h="14px" />
            <Sk w="70%" h="14px" />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Sk w="60px" h="12px" />
            <Sk w="160px" h="36px" />
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <Sk w="100%" h="52px" className="rounded-none" />
            <Sk w="100%" h="44px" className="rounded-none" />
            <Sk w="100%" h="44px" className="rounded-none" />
          </div>
        </div>
      </div>
    </div>
  )
}


function GenericSkeleton({ rows }) {
  return (
    <div className="w-full py-24 px-8 space-y-6 max-w-3xl mx-auto">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Sk w={`${88 - i * 10}%`} h="18px" />
          <Sk w={`${65 - i * 8}%`} h="12px" />
        </div>
      ))}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function ContentLoader({ variant, rows = 4 }) {
  return (
    <>
      <style>{shimmer}</style>
      {variant === 'products'       && <ProductsSkeleton />}
      {variant === 'projects'       && <ProjectsSkeleton />}
      {variant === 'detail'         && <DetailSkeleton />}
      {variant === 'product-detail' && <ProductDetailSkeleton />}
      {!variant                     && <GenericSkeleton rows={rows} />}
    </>
  )
}
