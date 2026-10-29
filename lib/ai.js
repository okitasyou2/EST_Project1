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

module.exports = { generate };
