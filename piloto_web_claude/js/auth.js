const Auth = {
  KEY: 'kc_session',

  login(username, password) {
    const user = DB.where(DB.C.USERS, u => u.username === username && u.password === password)[0];
    if (!user) return null;
    const s = { userId: user.id, role: user.role, name: user.name, kinesiologistId: user.kinesiologistId };
    sessionStorage.setItem(this.KEY, JSON.stringify(s));
    return s;
  },

  logout() { sessionStorage.removeItem(this.KEY); },

  getSession() {
    try { return JSON.parse(sessionStorage.getItem(this.KEY)); }
    catch { return null; }
  },
};
