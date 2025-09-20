export default function NotFoundPage() {
  return (
    <html lang="ja">
      <body
        style={{
          background: 'radial-gradient(circle at 30% 10%, #1a2035, #05060d 55%, #020308 100%)',
          color: '#f3f4f6',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif",
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>ページが見つかりません</h1>
          <p style={{ opacity: 0.75 }}>URL を確認してから再度アクセスしてください。</p>
        </div>
      </body>
    </html>
  );
}
