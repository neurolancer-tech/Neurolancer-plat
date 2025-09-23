import { ImageResponse } from 'next/og'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background:
            'linear-gradient(135deg, #0D9E86 0%, #0d7377 35%, #0a4f50 100%)',
          color: '#ffffff',
          position: 'relative',
          padding: '48px',
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(800px 400px at 0% 0%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 60%), radial-gradient(600px 300px at 100% 100%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 60%)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 16,
              padding: '10px 20px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.25)',
              marginBottom: 24,
              fontSize: 20,
              letterSpacing: 1.2,
            }}
          >
            <span style={{ fontWeight: 700 }}>Neurolancer</span>
          </div>

          <h1
            style={{
              fontSize: 84,
              lineHeight: 1.05,
              margin: 0,
              fontWeight: 800,
              letterSpacing: -1.5,
              textShadow: '0 6px 24px rgba(0,0,0,0.3)',
            }}
          >
            Find Top AI Experts & Freelancers
          </h1>

          <p
            style={{
              marginTop: 18,
              fontSize: 30,
              opacity: 0.95,
              fontWeight: 500,
            }}
          >
            neurolancer.work
          </p>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 36,
            left: 48,
            right: 48,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'rgba(255,255,255,0.9)',
            fontSize: 22,
          }}
        >
          <span>AI Freelance Marketplace</span>
          <span style={{ opacity: 0.85 }}>Verified • Secure • Fast</span>
        </div>
      </div>
    ),
    size
  )
}
