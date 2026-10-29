(() => {
  const client = window.gameSupabase;
  const isLoginPage = document.body.dataset.page === 'login';
  const showMessage = (message, error = true) => {
    const target = document.querySelector(isLoginPage ? '#auth-message' : '#auth-status');
    if (target) { target.textContent = message; target.classList.toggle('error', error); }
  };
  if (!client) { const login = document.querySelector('#nav-login'); if (login) login.hidden = false; showMessage('인증 서비스를 불러오지 못했습니다. 인터넷 연결을 확인하고 새로고침해 주세요.'); return; }

  function updateSession(session) {
    if (isLoginPage) {
      if (session) location.replace('index.html');
      return;
    }
    const login = document.querySelector('#nav-login');
    const logout = document.querySelector('#nav-logout');
    if (login) login.hidden = Boolean(session);
    if (logout) logout.hidden = !session;
  }
  client.auth.onAuthStateChange((event, session) => { updateSession(session); if (!isLoginPage && event === 'SIGNED_OUT') location.assign('login.html'); });
  client.auth.getSession().then(({data, error}) => {
    if (error) { showMessage('로그인 상태를 확인하지 못했습니다. 새로고침해 주세요.'); return; }
    updateSession(data.session);
  }).catch(() => showMessage('인증 서비스에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.'));

  const logout = document.querySelector('#nav-logout');
  logout?.addEventListener('click', async () => {
    logout.disabled = true;
    try {
      const {error} = await client.auth.signOut();
      if (error) throw error;
      location.assign('login.html');
    } catch { showMessage('로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.'); logout.disabled = false; }
  });
  if (!isLoginPage) return;

  let signingUp = false;
  const form = document.querySelector('#auth-form');
  const password = document.querySelector('#auth-password');
  const submit = document.querySelector('#auth-submit');
  document.querySelector('#auth-switch').addEventListener('click', () => {
    signingUp = !signingUp;
    document.querySelector('#auth-title').textContent = signingUp ? '회원가입.' : '로그인.';
    document.querySelector('#auth-description').textContent = signingUp ? '이메일과 비밀번호로 계정을 만드세요.' : '이메일과 비밀번호로 로그인하세요.';
    document.querySelector('#auth-switch-copy').textContent = signingUp ? '이미 계정이 있으신가요?' : '계정이 없으신가요?';
    document.querySelector('#auth-switch').textContent = signingUp ? '로그인' : '회원가입';
    submit.textContent = signingUp ? '회원가입' : '로그인';
    password.autocomplete = signingUp ? 'new-password' : 'current-password';
    showMessage('', false);
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const email = document.querySelector('#auth-email').value.trim();
    submit.disabled = true; showMessage('처리 중입니다…', false);
    try {
      const result = signingUp
        ? await client.auth.signUp({email, password:password.value, options:{emailRedirectTo:new URL('login.html', location.href).href}})
        : await client.auth.signInWithPassword({email, password:password.value});
      if (result.error) throw result.error;
      if (result.data.session) { location.assign('index.html'); return; }
      showMessage('확인 메일이 발송되었다면 메일의 링크를 눌러 인증한 뒤 로그인해 주세요.', false);
    } catch (error) {
      const code = error.code || '';
      const message = code === 'invalid_credentials' ? '이메일 또는 비밀번호가 올바르지 않습니다.'
        : code === 'email_not_confirmed' ? '이메일 인증이 완료되지 않았습니다. 확인 메일을 확인해 주세요.'
        : code === 'user_already_exists' ? '이미 가입된 계정입니다. 로그인해 주세요.'
        : code === 'weak_password' ? '비밀번호가 보안 조건을 충족하지 않습니다. 더 강한 비밀번호를 사용해 주세요.'
        : code.includes('rate_limit') || error.status === 429 ? '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.'
        : '인증 요청을 처리하지 못했습니다. 입력 내용과 인터넷 연결을 확인한 뒤 다시 시도해 주세요.';
      showMessage(message);
    } finally { submit.disabled = false; }
  });
})();
