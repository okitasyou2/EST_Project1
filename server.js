const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

// Local configuration is never served to the browser.
try {
  for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z_0-9]*)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
} catch (error) { if (error.code !== 'ENOENT') throw error; }

const { generate } = require('./lib/ai');
const send = (res, status, data) => { res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'}); res.end(JSON.stringify(data)); };
const files = {'/':'index.html','/index.html':'index.html','/login.html':'login.html','/mypage.html':'mypage.html','/detail.html':'detail.html','/list.html':'list.html','/admin.html':'admin.html','/js/app.js':'js/app.js','/js/auth.js':'js/auth.js','/js/admin.js':'js/admin.js','/js/candidates.js':'js/candidates.js','/js/mypage.js':'js/mypage.js','/js/supabase-client.js':'js/supabase-client.js','/css/style.css':'css/style.css','/css/admin.css':'css/admin.css','/assets/게임 수익성 분석 배너.png':'assets/게임 수익성 분석 배너.png'};
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'POST' && (url.pathname === '/api/discover' || url.pathname === '/api/analyze')) {
    let body = '';
    try {
      for await (const chunk of req) { body += chunk; if (body.length > 4096) throw new Error('요청이 너무 큽니다.'); }
      const input = JSON.parse(body || '{}');
      const name = typeof input.name === 'string' ? input.name.trim() : '';
      if (url.pathname === '/api/analyze' && (!name || name.length > 100)) return send(res, 400, {error:'게임 이름을 1~100자로 입력해 주세요.'});
      return send(res, 200, await generate(url.pathname.endsWith('discover') ? 'discover' : 'analyze', name));
    } catch (error) { return send(res, 502, {error: error.message || '요청 처리 중 오류가 발생했습니다.'}); }
  }
  let pathname; try { pathname = decodeURIComponent(url.pathname); } catch { return send(res, 400, {error:'잘못된 주소입니다.'}); }
  const file = files[pathname];
  if (req.method !== 'GET' || !file) return send(res, 404, {error:'찾을 수 없습니다.'});
  fs.readFile(path.join(__dirname, file), (error, content) => {
    if (error) return send(res, 404, {error:'찾을 수 없습니다.'});
    const ext = path.extname(file); res.writeHead(200, {'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png'})[ext], 'X-Content-Type-Options':'nosniff'}); res.end(content);
  });
}).listen(Number(process.env.PORT) || 3000, '127.0.0.1', () => console.log(`http://localhost:${Number(process.env.PORT) || 3000}`));
