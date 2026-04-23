/* =============================================
   KineApp — Main App (Routing + Navigation)
   ============================================= */

const App = {
    currentView: null,

    // ══════════════════════════════════════════
    // INITIALIZATION
    // ══════════════════════════════════════════

    init() {
        Store.initialize();
        this.setupNavigation();
        this.handleRoute();
        window.addEventListener('hashchange', () => this.handleRoute());
    },

    // ══════════════════════════════════════════
    // ROUTING
    // ══════════════════════════════════════════

    navigate(view) {
        window.location.hash = view;
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'login';

        // Auth guard
        if (hash !== 'login' && !Auth.isLoggedIn()) {
            this.navigate('login');
            return;
        }

        // If logged in and trying to access login, redirect
        if (hash === 'login' && Auth.isLoggedIn()) {
            this.navigate(Auth.isAdmin() ? 'dashboard' : 'kinesio-agenda');
            return;
        }

        // Role guard
        const adminViews = ['dashboard', 'patients', 'kinesiologists', 'calendar', 'finance'];
        const kinesioViews = ['kinesio-agenda', 'kinesio-patients', 'kinesio-availability'];

        if (Auth.isKinesiologo() && adminViews.includes(hash)) {
            this.navigate('kinesio-agenda');
            return;
        }

        if (Auth.isAdmin() && kinesioViews.includes(hash)) {
            this.navigate('dashboard');
            return;
        }

        this.currentView = hash;
        this.render(hash);
    },

    // ══════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════

    render(view) {
        const appContainer = document.getElementById('app');

        if (view === 'login') {
            this.renderLogin();
            return;
        }

        // Render app shell if not already rendered
        if (!document.getElementById('sidebar')) {
            this.renderAppShell();
        }

        // Update active nav
        this.updateActiveNav(view);

        // Render view content
        const content = document.getElementById('main-content');
        switch (view) {
            case 'dashboard':
                Dashboard.render(content);
                break;
            case 'patients':
                Patients.render(content);
                break;
            case 'kinesiologists':
                Kinesiologists.render(content);
                break;
            case 'calendar':
                Calendar.render(content);
                break;
            case 'finance':
                Finance.render(content);
                break;
            case 'kinesio-agenda':
                KinesioPortal.renderAgenda(content);
                break;
            case 'kinesio-patients':
                KinesioPortal.renderPatients(content);
                break;
            case 'kinesio-availability':
                KinesioPortal.renderAvailability(content);
                break;
            default:
                content.innerHTML = `<div class="empty-state"><h4>Página no encontrada</h4></div>`;
        }
    },

    // ══════════════════════════════════════════
    // LOGIN PAGE
    // ══════════════════════════════════════════

    renderLogin() {
        document.getElementById('app').innerHTML = `
            <div class="login-page">
                <div class="login-card animate-fade-in-up">
                    <div class="login-logo">
                        <div class="logo-icon">🏥</div>
                        <h1>KineApp</h1>
                        <p>Gestión de Kinesiología a Domicilio</p>
                    </div>
                    <div class="login-form-card">
                        <form id="login-form" onsubmit="App.handleLogin(event)">
                            <div class="form-group">
                                <label class="form-label">Usuario</label>
                                <input type="text" id="login-user" class="form-input" placeholder="Ingrese su usuario" required autocomplete="username">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Contraseña</label>
                                <input type="password" id="login-pass" class="form-input" placeholder="Ingrese su contraseña" required autocomplete="current-password">
                            </div>
                            <div id="login-error" class="form-error" style="display:none; margin-bottom: var(--space-4);"></div>
                            <button type="submit" class="btn btn-primary btn-block btn-lg" id="login-submit-btn">
                                Iniciar Sesión
                            </button>
                        </form>
                        <div style="margin-top: var(--space-5); text-align: center;">
                            <p style="font-size: var(--fs-xs); color: var(--text-muted);">
                                Demo: <strong>admin / admin</strong> · <strong>psoto / 1234</strong>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('login-user').focus();
    },

    handleLogin(e) {
        e.preventDefault();
        const usuario = document.getElementById('login-user').value.trim();
        const password = document.getElementById('login-pass').value;
        const errorEl = document.getElementById('login-error');

        const result = Auth.login(usuario, password);
        if (result.success) {
            this.navigate(result.session.rol === 'admin' ? 'dashboard' : 'kinesio-agenda');
        } else {
            errorEl.textContent = result.error;
            errorEl.style.display = 'block';
            document.getElementById('login-pass').value = '';
            document.getElementById('login-user').focus();
        }
    },

    // ══════════════════════════════════════════
    // APP SHELL (Sidebar + Header)
    // ══════════════════════════════════════════

    renderAppShell() {
        const isAdmin = Auth.isAdmin();
        const navItems = isAdmin ? this.getAdminNav() : this.getKinesioNav();

        document.getElementById('app').innerHTML = `
            <div class="app">
                <div class="sidebar-overlay" id="sidebar-overlay" onclick="App.toggleSidebar()"></div>
                <aside class="sidebar" id="sidebar">
                    <div class="sidebar-header">
                        <span class="sidebar-logo">🏥</span>
                        <div class="sidebar-brand">
                            <h2>KineApp</h2>
                            <p>${isAdmin ? 'Panel Admin' : 'Portal Kinesiólogo'}</p>
                        </div>
                    </div>
                    <nav class="sidebar-nav">
                        ${navItems}
                    </nav>
                    <div class="sidebar-footer">
                        <div class="avatar">${Utils.getInitials(Auth.getName())}</div>
                        <div class="sidebar-user-info">
                            <div class="sidebar-user-name">${Utils.escapeHtml(Auth.getName())}</div>
                            <div class="sidebar-user-role">${Auth.getRoleLabel()}</div>
                        </div>
                        <button class="sidebar-logout" onclick="Auth.logout()" title="Cerrar sesión">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                            </svg>
                        </button>
                    </div>
                </aside>
                <main class="app-main">
                    <header class="header">
                        <button class="header-menu-btn" onclick="App.toggleSidebar()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
                            </svg>
                        </button>
                        <div class="header-title" id="header-title">
                            <h2>Dashboard</h2>
                        </div>
                        <div class="header-actions">
                            <span style="font-size: var(--fs-xs); color: var(--text-muted);">${Utils.formatDateLong(Utils.today())}</span>
                        </div>
                    </header>
                    <div class="content" id="main-content">
                    </div>
                </main>
            </div>
            <div class="toast-container" id="toast-container"></div>
        `;
    },

    getAdminNav() {
        return `
            <div class="nav-section">
                <div class="nav-section-title">General</div>
                <div class="nav-item" data-view="dashboard" onclick="App.navigate('dashboard')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>
                    </svg>
                    Dashboard
                </div>
            </div>
            <div class="nav-section">
                <div class="nav-section-title">Gestión</div>
                <div class="nav-item" data-view="patients" onclick="App.navigate('patients')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    Pacientes
                </div>
                <div class="nav-item" data-view="kinesiologists" onclick="App.navigate('kinesiologists')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    Kinesiólogos
                </div>
            </div>
            <div class="nav-section">
                <div class="nav-section-title">Operaciones</div>
                <div class="nav-item" data-view="calendar" onclick="App.navigate('calendar')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    Calendario
                </div>
                <div class="nav-item" data-view="finance" onclick="App.navigate('finance')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    Finanzas
                </div>
            </div>
        `;
    },

    getKinesioNav() {
        return `
            <div class="nav-section">
                <div class="nav-section-title">Mi Portal</div>
                <div class="nav-item" data-view="kinesio-agenda" onclick="App.navigate('kinesio-agenda')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    Mi Agenda
                </div>
                <div class="nav-item" data-view="kinesio-patients" onclick="App.navigate('kinesio-patients')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    Mis Pacientes
                </div>
                <div class="nav-item" data-view="kinesio-availability" onclick="App.navigate('kinesio-availability')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Mi Disponibilidad
                </div>
            </div>
        `;
    },

    // ══════════════════════════════════════════
    // NAVIGATION HELPERS
    // ══════════════════════════════════════════

    setupNavigation() {
        // Close sidebar on mobile when navigating
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && e.target.closest('.nav-item')) {
                this.closeSidebar();
            }
        });
    },

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        }
    },

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        }
    },

    updateActiveNav(view) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });

        // Update header title
        const titles = {
            dashboard: 'Dashboard',
            patients: 'Pacientes',
            kinesiologists: 'Kinesiólogos',
            calendar: 'Calendario General',
            finance: 'Consolidado Financiero',
            'kinesio-agenda': 'Mi Agenda',
            'kinesio-patients': 'Mis Pacientes',
            'kinesio-availability': 'Mi Disponibilidad'
        };

        const headerTitle = document.getElementById('header-title');
        if (headerTitle) {
            headerTitle.innerHTML = `<h2>${titles[view] || 'KineApp'}</h2>`;
        }
    },

    // ══════════════════════════════════════════
    // TOAST NOTIFICATIONS
    // ══════════════════════════════════════════

    toast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            danger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            ${icons[type] || icons.info}
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    // ══════════════════════════════════════════
    // MODAL HELPERS
    // ══════════════════════════════════════════

    showModal(title, bodyHtml, footerHtml = '', size = '') {
        // Remove existing modal
        this.closeModal();

        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.id = 'active-modal';
        modal.innerHTML = `
            <div class="modal ${size}">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="App.closeModal()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">${bodyHtml}</div>
                ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
            </div>
        `;

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        document.body.appendChild(modal);

        // Close on Escape
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    },

    closeModal() {
        const modal = document.getElementById('active-modal');
        if (modal) modal.remove();
    },

    // ══════════════════════════════════════════
    // CONFIRM DIALOG
    // ══════════════════════════════════════════

    confirm(message, onConfirm) {
        this.showModal(
            'Confirmar',
            `<p style="color: var(--text-secondary);">${message}</p>`,
            `<button class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>
             <button class="btn btn-danger" onclick="App.closeModal(); (${onConfirm.toString()})()">Confirmar</button>`
        );
    }
};

// ══════════════════════════════════════════
// DASHBOARD MODULE
// ══════════════════════════════════════════

const Dashboard = {
    render(container) {
        const stats = Store.getDashboardStats();
        const today = Utils.today();
        const todaySessions = Store.getSessionsByDate(today).filter(s => s.estado !== 'cancelada');

        container.innerHTML = `
            <div class="page-header">
                <h2>Dashboard</h2>
                <span class="badge badge-primary">Hoy: ${Utils.formatDateLong(today)}</span>
            </div>

            <div class="grid-4" style="margin-bottom: var(--space-6);">
                <div class="card stat-card animate-fade-in-up" style="animation-delay: 0ms">
                    <div class="stat-icon primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </div>
                    <div class="stat-info">
                        <h4>${stats.todaySessions}</h4>
                        <p>Sesiones Hoy</p>
                    </div>
                </div>
                <div class="card stat-card animate-fade-in-up" style="animation-delay: 100ms">
                    <div class="stat-icon accent">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div class="stat-info">
                        <h4>${stats.activePatients}</h4>
                        <p>Pacientes Activos</p>
                    </div>
                </div>
                <div class="card stat-card animate-fade-in-up" style="animation-delay: 200ms">
                    <div class="stat-icon success">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div class="stat-info">
                        <h4>${stats.activeKinesios}</h4>
                        <p>Kinesiólogos</p>
                    </div>
                </div>
                <div class="card stat-card animate-fade-in-up" style="animation-delay: 300ms">
                    <div class="stat-icon warning">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </div>
                    <div class="stat-info">
                        <h4>${stats.pendingBilling}</h4>
                        <p>Pendientes Cobro</p>
                    </div>
                </div>
            </div>

            <div class="grid-2">
                <div class="card animate-fade-in-up" style="animation-delay: 400ms">
                    <div class="card-header">
                        <h3>📅 Sesiones de Hoy</h3>
                        <button class="btn btn-sm btn-outline" onclick="App.navigate('calendar')">Ver calendario</button>
                    </div>
                    <div class="card-body">
                        ${this.renderTodaySessions(todaySessions)}
                    </div>
                </div>
                <div class="card animate-fade-in-up" style="animation-delay: 500ms">
                    <div class="card-header">
                        <h3>⚡ Accesos Rápidos</h3>
                    </div>
                    <div class="card-body" style="display: flex; flex-direction: column; gap: var(--space-3);">
                        <button class="btn btn-outline btn-block" onclick="App.navigate('patients')" style="justify-content: flex-start;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                            Nuevo Paciente
                        </button>
                        <button class="btn btn-outline btn-block" onclick="App.navigate('kinesiologists')" style="justify-content: flex-start;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                            Nuevo Kinesiólogo
                        </button>
                        <button class="btn btn-outline btn-block" onclick="App.navigate('calendar')" style="justify-content: flex-start;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            Agendar Sesión
                        </button>
                        <button class="btn btn-outline btn-block" onclick="App.navigate('finance')" style="justify-content: flex-start;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            Consolidado Financiero
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    renderTodaySessions(sessions) {
        if (sessions.length === 0) {
            return `<div class="empty-state" style="padding: var(--space-8);">
                <p style="color: var(--text-muted);">No hay sesiones agendadas para hoy</p>
            </div>`;
        }

        return sessions.map(s => {
            const patient = Store.getPatient(s.pacienteId);
            const kinesio = Store.getKinesiologist(s.kinesioId);
            const statusBadge = s.estado === 'realizada'
                ? '<span class="badge badge-success">Realizada</span>'
                : '<span class="badge badge-info">Agendada</span>';

            return `
                <div style="display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); border-bottom: 1px solid var(--surface-border);">
                    <div class="avatar avatar-sm" style="background: linear-gradient(135deg, var(--scheduled), var(--primary));">
                        ${Utils.getInitials(patient?.nombre || '?')}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: var(--fw-semibold); font-size: var(--fs-sm);">${Utils.escapeHtml(patient?.nombre || 'Desconocido')}</div>
                        <div style="font-size: var(--fs-xs); color: var(--text-muted);">${s.bloque} · ${Utils.escapeHtml(kinesio?.nombre || '')}</div>
                    </div>
                    ${statusBadge}
                </div>
            `;
        }).join('');
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => App.init());
