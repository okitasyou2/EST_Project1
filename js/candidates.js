(() => {
  async function user() {
    const {data, error} = await window.gameSupabase.auth.getSession();
    if (error) throw error;
    if (!data.session?.user?.id) throw new Error('로그인이 필요합니다.');
    return data.session.user;
  }

  const toItem = row => ({
    id: row.id, name: row.game_name, game: row.analysis, status: row.status,
    values: {count: row.monthly_count ?? '', profit: row.profit_per_trade ?? '', cost: row.monthly_cost ?? ''}
  });
  const numberOrNull = value => String(value ?? '').trim() === '' ? null : Number(value);
  window.candidates = {
    async list() {
      const current = await user();
      const {data, error} = await window.gameSupabase.from('saved_candidates').select('*').eq('user_id', current.id);
      if (error) throw error;
      return data.map(toItem);
    },
    async save(item) {
      const current = await user();
      const values = {
        game_name: item.name, analysis: item.game,
        monthly_count: numberOrNull(item.values.count),
        profit_per_trade: numberOrNull(item.values.profit),
        monthly_cost: numberOrNull(item.values.cost)
      };
      const query = item.id
        ? window.gameSupabase.from('saved_candidates').update(values).eq('id', item.id).eq('user_id', current.id)
        : window.gameSupabase.from('saved_candidates').insert({...values, user_id: current.id, user_email: current.email ?? null, status: item.status});
      const {data, error} = await query.select().single();
      if (error) throw error;
      return toItem(data);
    },
    async setStatus(id, status) {
      const current = await user();
      const {data, error} = await window.gameSupabase.from('saved_candidates').update({status}).eq('id', id).eq('user_id', current.id).select().single();
      if (error) throw error;
      return toItem(data);
    },
    async remove(id) {
      const current = await user();
      const {data, error} = await window.gameSupabase.from('saved_candidates').delete().eq('id', id).eq('user_id', current.id).select('id').single();
      if (error) throw error;
      return data;
    }
  };
})();
