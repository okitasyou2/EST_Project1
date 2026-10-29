// The publishable key is intended for browser use; access is controlled by Supabase permissions and RLS.
(() => {
  if (!window.supabase?.createClient) {
    console.error('Supabase 라이브러리를 불러오지 못했습니다.');
    return;
  }
  window.gameSupabase = window.supabase.createClient(
    'https://jtubngjnkykkfmutriro.supabase.co',
    'sb_publishable_o2l3cOgzzgE09VGiHE_5Fw_NZjrinba'
  );
})();
