/**
 * TopProgressBar
 * A slim YouTube / GitHub-style top loading bar used as a Suspense fallback.
 * It runs an infinite animated shimmer so it looks alive while a lazy chunk loads.
 * It renders nothing into the normal document flow — purely fixed-position overlay.
 */
export default function TopProgressBar() {
  return (
    <>
      <style>{`
        @keyframes topbar-slide {
          0%   { transform: translateX(-100%); }
          60%  { transform: translateX(0%);    }
          100% { transform: translateX(0%);    }
        }
        @keyframes topbar-shimmer {
          0%   { opacity: 0.7; }
          50%  { opacity: 1;   }
          100% { opacity: 0.7; }
        }
      `}</style>

      {/* Slim progress bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          zIndex: 9999,
          background: 'transparent',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            height: '100%',
            width: '100%',
            background: 'linear-gradient(90deg, #f5c518 0%, #e8a200 40%, #f5c518 80%, #ffe066 100%)',
            backgroundSize: '200% 100%',
            animation: 'topbar-slide 0.8s cubic-bezier(0.4,0,0.2,1) forwards, topbar-shimmer 1.2s ease-in-out infinite',
          }}
        />
      </div>

      {/* Subtle full-page dim — keeps the old page visible underneath */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(255,255,255,0.15)',
          zIndex: 9998,
          pointerEvents: 'none',
          backdropFilter: 'blur(0px)',
        }}
      />
    </>
  )
}
