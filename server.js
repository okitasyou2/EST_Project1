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

const model = process.env.CORAL_MODEL || 'deepseek-v4.1-flash';
const fields = ['opportunity', 'target', 'fit', 'difficulty', 'summary', 'items', 'market', 'repeat', 'api', 'constraints', 'risks', 'checks', 'strengths', 'evidence'];
const send = (res, status, data) => { res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'}); res.end(JSON.stringify(data)); };
async function generate(type, name) {
  if (!process.env.CORAL_API_KEY) throw new Error('서버에 CORAL_API_KEY가 설정되지 않았습니다.');
  const format = type === 'discover'
    ? '실제로 출시된 개별 게임 3~5개를 추천하라. 각 name은 사용자가 바로 검색할 수 있는 고유한 게임 제목이어야 한다. MMORPG, RPG, 모바일 게임 같은 장르나 게임 유형, 가상의 게임명은 후보로 쓰지 마라. 출시 여부가 불확실한 게임은 제외하라. 각 후보의 수익 기회, 반복 작업과 선정 이유를 구체적으로 설명하되 최신 시장 수요와 정책은 검증되지 않았음을 분명히 하라. 객체 {"candidates":[{"name":"개별 게임의 정식 제목","opportunity":"수익 기회","target":"반복 작업","reason":"선정 이유"}]} 형식으로 반환하라.'
    : `객체 형식으로 다음 필드를 모두 문자열로 반환: ${fields.join(', ')}. name은 제외. fit과 difficulty는 높음, 보통, 낮음 또는 확인 필요. 게임: ${JSON.stringify(name)}`;
  const response = await fetch('https://inference.coralbricks.ai/v1/chat/completions', {
    method: 'POST', headers: {'Content-Type':'application/json', Authorization:`Bearer ${process.env.CORAL_API_KEY}`},
    body: JSON.stringify({model, response_format:{type:'json_object'}, messages:[{role:'system',content:'게임 시장과 반복 작업을 조사하는 한국어 분석가다. 웹 검색을 할 수 없으므로 최신 정보, 거래 수요, API 및 정책을 검증된 사실로 주장하지 말고 불확실하면 확인 필요라고 표시한다. 출처나 수치를 만들지 않는다. 자동 거래나 게임 약관 위반 가능성과 제약을 고려한다. JSON만 출력한다.'},{role:'user',content:format}]})
  });
  if (!response.ok) throw new Error(`AI 요청 실패 (HTTP ${response.status}). API 키, 잔액 및 모델 설정을 확인해 주세요.`);
  const payload = await response.json();
  let data;
  try { data = JSON.parse(payload.choices[0].message.content); } catch { throw new Error('AI 응답을 해석하지 못했습니다. 다시 시도해 주세요.'); }
  if (type === 'discover') {
    if (!Array.isArray(data.candidates)) throw new Error('후보 응답 형식이 올바르지 않습니다. 다시 시도해 주세요.');
    const candidates = data.candidates.filter(x => x && ['name','opportunity','target','reason'].every(k => typeof x[k] === 'string' && x[k].trim())).slice(0,5);
    if (candidates.length < 3) throw new Error('후보가 충분하지 않습니다. 다시 시도해 주세요.');
    return {candidates};
  }
  if (!data || fields.some(k => typeof data[k] !== 'string' || !data[k].trim())) throw new Error('분석 응답 형식이 올바르지 않습니다. 다시 시도해 주세요.');
  return {game: {name, ...Object.fromEntries(fields.map(k => [k, data[k]])), origin:'ai', analyzedAt:new Date().toISOString()}};
}
const files = {'/':'index.html','/index.html':'index.html','/detail.html':'detail.html','/list.html':'list.html','/js/app.js':'js/app.js','/css/style.css':'css/style.css','/assets/게임 수익성 분석 배너.png':'assets/게임 수익성 분석 배너.png'};
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
