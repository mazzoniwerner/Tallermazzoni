/* =============================================
   KineApp — Authentication System
   ============================================= */

const Auth = {
    SESSION_KEY: 'kineapp_session',

    // ── Login ──
    login(usuario, password) {
        const user = Store.findUser(usuario, password);
        if (!user) return { success: false, error: 'Usuario o contraseña incorrectos' };

        const session = {
            userId: user.id,
            usuario: user.usuario,
            rol: user.rol,
            nombre: user.nombre,
            kinesioId: user.kinesioId || null,
            loggedInAt: Utils.now()
        };

        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        return { success: true, session };
    },

    // ── Logout ──
    logout() {
        localStorage.removeItem(this.SESSION_KEY);
        App.navigate('login');
    },

    // ── Get current session ──
    getSession() {
        const data = localStorage.getItem(this.SESSION_KEY);
        return data ? JSON.parse(data) : null;
    },

    // ── Check if logged in ──
    isLoggedIn() {
        return this.getSession() !== null;
    },

    // ── Check role ──
    isAdmin() {
        const session = this.getSession();
        return session && session.rol === 'admin';
    },

    isKinesiologo() {
        const session = this.getSession();
        return session && session.rol === 'kinesiologo';
    },

    // ── Get current user name ──
    getName() {
        const session = this.getSession();
        return session ? session.nombre : '';
    },

    // ── Get current user role label ──
    getRoleLabel() {
        const session = this.getSession();
        if (!session) return '';
        return session.rol === 'admin' ? 'Administrador' : 'Kinesiólogo';
    }
};
