/* =============================================
   KineApp — Finance Module (Cobro y Pago)
   ============================================= */

const Finance = {
    activeTab: 'cobro',
    startDate: '',
    endDate: '',

    render(container) {
        // Default date range: current month
        if (!this.startDate) {
            const now = new Date();
            this.startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            this.endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${lastDay}`;
        }

        container.innerHTML = `
            <div class="page-header">
                <h2>Consolidado Financiero</h2>
            </div>

            <div class="card" style="margin-bottom: var(--space-5);">
                <div style="display: flex; align-items: center; gap: var(--space-4); flex-wrap: wrap;">
                    <div class="form-group" style="margin: 0;">
                        <label class="form-label">Desde</label>
                        <input type="date" class="form-input" value="${this.startDate}" onchange="Finance.startDate = this.value; Finance.render(document.getElementById('main-content'))">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label class="form-label">Hasta</label>
                        <input type="date" class="form-input" value="${this.endDate}" onchange="Finance.endDate = this.value; Finance.render(document.getElementById('main-content'))">
                    </div>
                    <button class="btn btn-outline btn-sm" onclick="Finance.exportCSV()" style="margin-top: auto;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Exportar
                    </button>
                </div>
            </div>

            <div class="tabs" style="margin-bottom: var(--space-5);">
                <div class="tab ${this.activeTab === 'cobro' ? 'active' : ''}" onclick="Finance.setTab('cobro')">
                    💰 Cobro a Pacientes
                </div>
                <div class="tab ${this.activeTab === 'pago' ? 'active' : ''}" onclick="Finance.setTab('pago')">
                    💳 Pago a Kinesiólogos
                </div>
            </div>

            <div id="finance-content">
                ${this.activeTab === 'cobro' ? this.renderCobro() : this.renderPago()}
            </div>
        `;
    },

    setTab(tab) {
        this.activeTab = tab;
        this.render(document.getElementById('main-content'));
    },

    // ══════════════════════════════════════════
    // COBRO A PACIENTES
    // ══════════════════════════════════════════

    renderCobro() {
        const sessions = Store.getSessionsByDateRange(this.startDate, this.endDate)
            .filter(s => s.estado === 'realizada');

        // Group by patient
        const byPatient = {};
        sessions.forEach(s => {
            if (!byPatient[s.pacienteId]) {
                byPatient[s.pacienteId] = [];
            }
            byPatient[s.pacienteId].push(s);
        });

        const patients = Object.keys(byPatient);

        if (patients.length === 0) {
            return `
                <div class="card">
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        <h4>Sin sesiones realizadas</h4>
                        <p>No hay sesiones realizadas en el periodo seleccionado</p>
                    </div>
                </div>
            `;
        }

        let totalGeneral = 0;

        const rows = patients.map(patientId => {
            const patient = Store.getPatient(patientId);
            const patientSessions = byPatient[patientId];
            const numSessions = patientSessions.length;
            const valorSesion = patient?.valorSesion || 0;
            const total = numSessions * valorSesion;
            const allCobrado = patientSessions.every(s => s.estadoCobro === 'cobrado');
            const someCobrado = patientSessions.some(s => s.estadoCobro === 'cobrado');

            totalGeneral += total;

            return `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: var(--space-2);">
                            <div class="avatar avatar-sm">${Utils.getInitials(patient?.nombre || '?')}</div>
                            <span style="font-weight: var(--fw-semibold);">${Utils.escapeHtml(patient?.nombre || 'Desconocido')}</span>
                        </div>
                    </td>
                    <td style="text-align: center; font-weight: var(--fw-semibold);">${numSessions}</td>
                    <td>${Utils.formatCurrency(valorSesion)}</td>
                    <td style="font-weight: var(--fw-bold); color: var(--accent);">${Utils.formatCurrency(total)}</td>
                    <td>
                        <span class="badge badge-${allCobrado ? 'success' : someCobrado ? 'warning' : 'danger'}">
                            ${allCobrado ? 'Cobrado' : someCobrado ? 'Parcial' : 'Pendiente'}
                        </span>
                    </td>
                    <td>
                        ${!allCobrado ? `
                            <button class="btn btn-sm btn-success" onclick="Finance.markCobrado('${patientId}')">
                                Marcar Cobrado
                            </button>
                        ` : '<span style="color: var(--text-muted);">✓</span>'}
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <div class="card" style="margin-bottom: var(--space-4);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-secondary); font-size: var(--fs-sm);">Total a cobrar en periodo:</span>
                    <span style="font-size: var(--fs-2xl); font-weight: var(--fw-extrabold); color: var(--accent);">${Utils.formatCurrency(totalGeneral)}</span>
                </div>
            </div>
            <div class="table-container card">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Paciente</th>
                            <th style="text-align: center;">Nº Sesiones</th>
                            <th>Valor Sesión</th>
                            <th>Total a Cobrar</th>
                            <th>Estado</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    },

    markCobrado(patientId) {
        const sessions = Store.getSessionsByDateRange(this.startDate, this.endDate)
            .filter(s => s.estado === 'realizada' && s.pacienteId === patientId && s.estadoCobro !== 'cobrado');

        sessions.forEach(s => {
            Store.updateSession(s.id, { estadoCobro: 'cobrado' });
        });

        App.toast(`Sesiones marcadas como cobradas`, 'success');
        this.render(document.getElementById('main-content'));
    },

    // ══════════════════════════════════════════
    // PAGO A KINESIOLOGOS
    // ══════════════════════════════════════════

    renderPago() {
        const sessions = Store.getSessionsByDateRange(this.startDate, this.endDate)
            .filter(s => s.estado === 'realizada');

        // Group by kinesio
        const byKinesio = {};
        sessions.forEach(s => {
            if (!byKinesio[s.kinesioId]) {
                byKinesio[s.kinesioId] = [];
            }
            byKinesio[s.kinesioId].push(s);
        });

        const kinesios = Object.keys(byKinesio);

        if (kinesios.length === 0) {
            return `
                <div class="card">
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        <h4>Sin pagos pendientes</h4>
                        <p>No hay sesiones realizadas por kinesiólogos en el periodo seleccionado</p>
                    </div>
                </div>
            `;
        }

        let totalGeneral = 0;

        const rows = kinesios.map(kinesioId => {
            const kinesio = Store.getKinesiologist(kinesioId);
            const kinesioSessions = byKinesio[kinesioId];
            const numSessions = kinesioSessions.length;
            const valorHonorario = kinesio?.valorHonorario || 0;
            const total = numSessions * valorHonorario;
            const allPagado = kinesioSessions.every(s => s.estadoPago === 'pagado');
            const somePagado = kinesioSessions.some(s => s.estadoPago === 'pagado');

            totalGeneral += total;

            return `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: var(--space-2);">
                            <div class="avatar avatar-sm" style="background: linear-gradient(135deg, var(--success), var(--accent));">${Utils.getInitials(kinesio?.nombre || '?')}</div>
                            <span style="font-weight: var(--fw-semibold);">${Utils.escapeHtml(kinesio?.nombre || 'Desconocido')}</span>
                        </div>
                    </td>
                    <td style="text-align: center; font-weight: var(--fw-semibold);">${numSessions}</td>
                    <td>${Utils.formatCurrency(valorHonorario)}</td>
                    <td style="font-weight: var(--fw-bold); color: var(--accent);">${Utils.formatCurrency(total)}</td>
                    <td>
                        <span class="badge badge-${allPagado ? 'success' : somePagado ? 'warning' : 'danger'}">
                            ${allPagado ? 'Pagado' : somePagado ? 'Parcial' : 'Pendiente'}
                        </span>
                    </td>
                    <td>
                        ${!allPagado ? `
                            <button class="btn btn-sm btn-success" onclick="Finance.markPagado('${kinesioId}')">
                                Marcar Pagado
                            </button>
                        ` : '<span style="color: var(--text-muted);">✓</span>'}
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <div class="card" style="margin-bottom: var(--space-4);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-secondary); font-size: var(--fs-sm);">Total a pagar en periodo:</span>
                    <span style="font-size: var(--fs-2xl); font-weight: var(--fw-extrabold); color: var(--accent);">${Utils.formatCurrency(totalGeneral)}</span>
                </div>
            </div>
            <div class="table-container card">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Kinesiólogo</th>
                            <th style="text-align: center;">Nº Sesiones</th>
                            <th>Valor Honorario</th>
                            <th>Total a Pagar</th>
                            <th>Estado</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    },

    markPagado(kinesioId) {
        const sessions = Store.getSessionsByDateRange(this.startDate, this.endDate)
            .filter(s => s.estado === 'realizada' && s.kinesioId === kinesioId && s.estadoPago !== 'pagado');

        sessions.forEach(s => {
            Store.updateSession(s.id, { estadoPago: 'pagado' });
        });

        App.toast(`Sesiones marcadas como pagadas`, 'success');
        this.render(document.getElementById('main-content'));
    },

    // ── Export CSV ──
    exportCSV() {
        const sessions = Store.getSessionsByDateRange(this.startDate, this.endDate)
            .filter(s => s.estado === 'realizada');

        if (sessions.length === 0) {
            App.toast('No hay datos para exportar', 'warning');
            return;
        }

        let csv = 'Fecha,Paciente,Kinesiólogo,Horario,Estado Cobro,Estado Pago,Valor Sesión,Valor Honorario\n';

        sessions.forEach(s => {
            const patient = Store.getPatient(s.pacienteId);
            const kinesio = Store.getKinesiologist(s.kinesioId);
            csv += `${s.fecha},"${patient?.nombre || ''}","${kinesio?.nombre || ''}",${s.bloque},${s.estadoCobro},${s.estadoPago},${patient?.valorSesion || 0},${kinesio?.valorHonorario || 0}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kineapp_finanzas_${this.startDate}_${this.endDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        App.toast('Archivo CSV exportado', 'success');
    }
};
