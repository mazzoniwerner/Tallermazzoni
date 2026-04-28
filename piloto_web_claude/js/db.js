const DB = {
  C: {
    USERS:        'kc_users',
    PATIENTS:     'kc_patients',
    KINES:        'kc_kines',
    SESSIONS:     'kc_sessions',
    AVAILABILITY: 'kc_availability',
  },

  _get(col) {
    try { return JSON.parse(localStorage.getItem(col)) || []; }
    catch { return []; }
  },
  _set(col, data) { localStorage.setItem(col, JSON.stringify(data)); },

  uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },

  all(col)       { return this._get(col); },
  find(col, id)  { return this._get(col).find(r => r.id === id) || null; },
  where(col, fn) { return this._get(col).filter(fn); },

  insert(col, record) {
    const rows = this._get(col);
    record.id = record.id || this.uid();
    rows.push(record);
    this._set(col, rows);
    return record;
  },

  update(col, id, changes) {
    const rows = this._get(col);
    const i = rows.findIndex(r => r.id === id);
    if (i === -1) return null;
    rows[i] = { ...rows[i], ...changes };
    this._set(col, rows);
    return rows[i];
  },

  remove(col, id) {
    this._set(col, this._get(col).filter(r => r.id !== id));
  },

  seed() {
    if (localStorage.getItem('kc_seeded')) return;
    this._set(this.C.USERS,        SEED_USERS);
    this._set(this.C.KINES,        SEED_KINES);
    this._set(this.C.PATIENTS,     SEED_PATIENTS);
    this._set(this.C.SESSIONS,     []);
    this._set(this.C.AVAILABILITY, []);
    localStorage.setItem('kc_seeded', '1');
  },

  reset() {
    Object.values(this.C).forEach(k => localStorage.removeItem(k));
    localStorage.removeItem('kc_seeded');
    location.reload();
  },
};
