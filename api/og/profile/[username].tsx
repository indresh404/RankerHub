import { ImageResponse } from '@vercel/og'

export const config = {
  runtime: 'edge',
}

// Example usage:
// /api/og/profile/jdoe?rank=12&streak=5&college=IIT&badges=mentor,top-contributor

export default function handler(req: Request) {
  try {
    const url = new URL(req.url)
    const usernameRaw = url.pathname.split('/').pop() || 'user'
    const username = decodeURIComponent(usernameRaw) || 'user'
    const rank = url.searchParams.get('rank') || '—'
    const streak = url.searchParams.get('streak') || '0'
    const college = url.searchParams.get('college') || ''
    const badgesParam = url.searchParams.get('badges') || ''
    const badges = badgesParam ? badgesParam.split(',') : []

    const width = 1200
    const height = 630

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg,#0f172a,#0b1220)',
            color: 'white',
            fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
            padding: '48px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 120, height: 120, borderRadius: 16, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 700 }}>
                {username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 44, fontWeight: 700 }}>{username}</div>
                <div style={{ fontSize: 18, color: '#93c5fd', marginTop: 6 }}>{college}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 36, alignItems: 'center' }}>
              <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.06)', borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>Rank</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{rank}</div>
              </div>
              <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.06)', borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>Streak</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{streak}d</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 8 }}>
                {badges.slice(0, 5).map((b, i) => (
                  <div key={i} style={{ padding: '8px 12px', borderRadius: 9999, background: 'rgba(255,255,255,0.04)', fontSize: 14 }}>{b}</div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ width: 380, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
            <div style={{ textAlign: 'right', color: '#9ca3af', fontSize: 14 }}>RankerHub</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>Shareable Profile Card</div>
          </div>
        </div>
      ),
      {
        width,
        height,
      }
    )
  } catch (e) {
    console.error('OG generation error', e)
    return new Response('Failed to generate image', { status: 500 })
  }
}
