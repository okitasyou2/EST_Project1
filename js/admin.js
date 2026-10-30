(() => {
  async function fetchRows(table, columns) {
    const rows = [];
    const pageSize = 500;
    for (let offset = 0; ; offset += pageSize) {
      const {data, error} = await window.gameSupabase.from(table).select(columns).order('id').range(offset, offset + pageSize - 1);
      if (error) throw error;
      rows.push(...data);
      if (data.length < pageSize) return rows;
    }
  }

  function renderRows(prefix, rows, cells, emptyMessage) {
    const message = document.getElementById(`${prefix}-message`);
    const table = document.getElementById(`${prefix}-list`);
    const body = document.getElementById(`${prefix}-body`);
    body.replaceChildren();
    if (!rows.length) { message.textContent = emptyMessage; table.hidden = true; return; }
    for (const row of rows) {
      const tr = document.createElement('tr');
      for (const value of cells(row)) {
        const td = document.createElement('td');
        td.textContent = value == null || value === '' ? '—' : String(value);
        tr.appendChild(td);
      }
      body.appendChild(tr);
    }
    message.textContent = `${rows.length}개`;
    table.hidden = false;
  }

  async function load(prefix, table, columns, cells, emptyMessage) {
    try { renderRows(prefix, await fetchRows(table, columns), cells, emptyMessage); }
    catch {
      document.getElementById(`${prefix}-message`).textContent = '목록을 불러오지 못했습니다. 데이터베이스 연결과 관리자 조회 권한을 확인해 주세요.';
      document.getElementById(`${prefix}-list`).hidden = true;
    }
  }

  function initialize() {
    load('members', 'profiles', 'id,email,role', row => [row.email, row.role, row.id], '등록된 회원이 없습니다.');
    load('candidates', 'saved_candidates', 'id,game_name,user_email,user_id,status,analysis', row => [row.game_name, row.user_email || row.user_id, row.status, row.analysis?.summary], '저장된 관심 후보가 없습니다.');
  }
  if (window.authReady) initialize();
  else window.addEventListener('app-auth-ready', initialize, {once:true});
})();
