const { generate } = require('./ai');

module.exports = type => async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({error:'POST 요청만 지원합니다.'});
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (type === 'analyze' && (!name || name.length > 100)) return res.status(400).json({error:'게임 이름을 1~100자로 입력해 주세요.'});
  try { return res.status(200).json(await generate(type, name)); }
  catch (error) { return res.status(502).json({error: error.message || '요청 처리 중 오류가 발생했습니다.'}); }
};
