// GET /version.json — คืนเวอร์ชันที่ deploy จริงเป็น JSON
// เดิมไม่มีไฟล์นี้ → CF Pages SPA fallback คืน index.html (HTTP 200 text/html) ทำให้
// สคริปต์/มอนิเตอร์ที่ fetch version.json ได้ HTML ไป parse แทน JSON
export async function onRequestGet(context) {
  const { env } = context;
  return new Response(
    JSON.stringify({
      version: env.STARVIA_APP_VERSION || '2.0.9',
      apiVersion: env.STARVIA_API_VERSION || null,
    }),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    }
  );
}
