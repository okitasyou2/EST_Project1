(() => {
  async function render() {
    const email = document.querySelector('#account-email');
    try {
      const {data, error} = await window.gameSupabase.auth.getSession();
      if (error) throw error;
      email.textContent = data.session?.user?.email || '이메일을 확인할 수 없습니다.';
    } catch { email.textContent = '계정 정보를 불러오지 못했습니다.'; }
    const count = document.querySelector('#account-candidates');
    try {
      const items = await window.candidates.list();
      count.textContent = `${items.length}개`;
    } catch { count.textContent = '저장된 후보를 확인할 수 없습니다.'; }
  }
  if (window.authReady) render();
  else window.addEventListener('app-auth-ready', render, {once:true});
})();
