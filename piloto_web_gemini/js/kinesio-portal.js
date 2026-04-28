/* =============================================
   KineApp — Kinesio Portal Module
   ============================================= */

const KinesioPortal = {
    // ══════════════════════════════════════════
    // MI AGENDA
    // ══════════════════════════════════════════

    renderAgenda(container) {
        const session = Auth.getSession();
        const kinesioId = session?.kinesioId;
        if (!kinesioId) return;

        const today = Utils.today();
        const currentMonday = Utils.getMonday(today);
        const weekDates = Utils.getWeekDates(currentMonday);

        // Get sessions for this kinesio this week
        const allSessions = Store.getSessionsByKinesio(kinesioId)
            .filter(s => s.estado !== 'cancelada');

        const todaySessions = allSessions.filter(s => s.fecha === today);
        const weekSessions = allSessions.filter(s => weekDates.includes(s.fecha));

        container.innerHTML = `
            <div class="page-header">
                <h2>Mi Agenda</h2>
                <span class="badge badge-primary">${Utils.formatDateLong(today)}</span>
            </div>

            <div class="section">
                <h3 class="section-title">📅 Hoy</h3>
                ${todaySessions.length === 0 ? `
                    <div class="card">
                        <div class="empty-state" style="padding: var(--space-8);">
                            <p style="color: var(--text-muted);">No tienes sesiones agendadas para hoy</p>
                        </div>
                    </div>
                ` : `
                    <div style="display: flex; flex-direction: column; gap: var(--space-3);">
                        ${todaySessions.map(s => this.renderSessionCard(s)).join('')}
                    </div>
                `}
            </div>

            <div class="section">
                <h3 class="section-title">📋 Esta Semana</h3>
                ${weekSessions.length === 0 ? `
                    <div class="card">
                        <div class="empty-state" style="padding: var(--space-8);">
                            <p style="color: var(--text-muted);">No tienes sesiones esta semana</p>
                        </div>
                    </div>
                ` : `
                    <div style="display: flex; flex-direction: column; gap: var(--space-3);">
                        ${weekSessions
                            .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.bloque.localeCompare(b.bloque))
                            .map(s => this.renderSessionCard(s))
                            .join('')}
                    </div>
                `}
            </div>
        `;
    },

    renderSessionCard(session) {
        const patient = Store.getPatient(session.pacienteId);
        const isRealized = session.estado === 'realizada';

        return `
            <div class="card animate-fade-in-up" style="border-left: 4px solid ${isRealized ? 'var(--success)' : 'var(--scheduled)'};">
                <div style="display: flex; align-items: flex-start; gap: var(--space-4); flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 200px;">
                        <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
                            <span style="font-size: var(--fs-sm); color: var(--text-muted);">${Utils.getDayName(session.fecha)} ${Utils.formatDate(session.fecha)}</span>
                            <span class="badge badge-${isRealized ? 'success' : 'info'}">${session.bloque}</span>
                        </div>
                        <h4 style="margin-bottom: var(--space-1);">${Utils.escapeHtml(patient?.nombre || 'Paciente')}</h4>
                        <p style="font-size: var(--fs-sm); color: var(--text-muted);">
                            📍 ${Utils.escapeHtml(patient?.direccion || '-')} · ${Utils.escapeHtml(patient?.comuna || '')}
                        </p>
                        <p style="font-size: var(--fs-sm); color: var(--text-muted);">
                            📋 ${Utils.escapeHtml(patient?.patologia || '-')}
                        </p>
                        ${session.esPrimeraSesion ? '<span class="badge badge-accent" style="margin-top: var(--space-2);">Primera Sesión</span>' : ''}
                    </div>
                    <div style="display: flex; flex-direction: column; gap: var(--space-2);">
                        ${!isRealized ? `
                            <button class="btn btn-sm btn-success" onclick="KinesioPortal.markRealized('${session.id}')">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                                Marcar Realizada
                            </button>
                        ` : `
                            <span class="badge badge-success">✓ Realizada</span>
                        `}
                        <button class="btn btn-sm btn-outline" onclick="KinesioPortal.scheduleNext('${session.id}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
                            Agendar Siguiente
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    markRealized(sessionId) {
        Sessions.showNoteForm(sessionId, () => {
            this.renderAgenda(document.getElementById('main-content'));
        });
    },

    scheduleNext(sessionId) {
        const session = Store.getSession(sessionId);
        if (!session) return;

        Sessions.showNextVisitForm(sessionId, session.kinesioId, session.pacienteId, () => {
            this.renderAgenda(document.getElementById('main-content'));
        });
    },

    // ══════════════════════════════════════════
    // MIS PACIENTES
    // ══════════════════════════════════════════

    renderPatients(container) {
        const session = Auth.getSession();
        const kinesioId = session?.kinesioId;
        if (!kinesioId) return;

        // Get unique patients assigned to this kinesio
        const sessions = Store.getSessionsByKinesio(kinesioId);
        const patientIds = [...new Set(sessions.map(s => s.pacienteId))];
        const patients = patientIds.map(id => Store.getPatient(id)).filter(Boolean);

        container.innerHTML = `
            <div class="page-header">
                <h2>Mis Pacientes</h2>
            </div>

            ${patients.length === 0 ? `
                <div class="card">
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <h4>Sin pacientes asignados</h4>
                        <p>Aún no tienes pacientes asignados</p>
                    </div>
                </div>
            ` : `
                <div style="display: flex; flex-direction: column; gap: var(--space-4);">
                    ${patients.map(p => this.renderPatientInfo(p, kinesioId)).join('')}
                </div>
            `}
        `;
    },

    renderPatientInfo(patient, kinesioId) {
        const patientSessions = Store.getSessionsByPatient(patient.id)
            .filter(s => s.kinesioId === kinesioId && s.estado !== 'cancelada');
        const notes = Store.getNotesByPatient(patient.id)
            .filter(n => n.kinesioId === kinesioId);

        return `
            <div class="card">
                <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4);">
                    <div class="avatar">${Utils.getInitials(patient.nombre)}</div>
                    <div>
                        <h4>${Utils.escapeHtml(patient.nombre)}</h4>
                        <p style="font-size: var(--fs-sm); color: var(--text-muted);">${Utils.escapeHtml(patient.patologia || '-')}</p>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--space-3); font-size: var(--fs-sm); margin-bottom: var(--space-4);">
                    <div><strong>Dirección:</strong><br>${Utils.escapeHtml(patient.direccion || '-')}, ${Utils.escapeHtml(patient.comuna || '')}</div>
                    <div><strong>Teléfono:</strong><br>${Utils.escapeHtml(patient.telefono || '-')}</div>
                    <div><strong>Diagnóstico:</strong><br>${Utils.escapeHtml(patient.diagnostico || '-')}</div>
                    <div><strong>Sesiones:</strong><br>${patientSessions.length} total</div>
                </div>
                ${notes.length > 0 ? `
                    <div class="divider"></div>
                    <div>
                        <h4 style="font-size: var(--fs-sm); color: var(--text-secondary); margin-bottom: var(--space-3);">Notas Clínicas Recientes</h4>
                        <div style="max-height: 200px; overflow-y: auto;">
                            ${notes.slice(0, 3).map(n => `
                                <div style="background: var(--bg-dark); border-radius: var(--radius-sm); padding: var(--space-3); margin-bottom: var(--space-2); font-size: var(--fs-sm);">
                                    <span style="color: var(--text-muted); font-size: var(--fs-xs);">${Utils.formatDate(n.fecha?.split('T')[0])}</span>
                                    <p style="color: var(--text-secondary); margin-top: var(--space-1);">${Utils.escapeHtml(n.evolucion)}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    },

    // ══════════════════════════════════════════
    // MI DISPONIBILIDAD
    // ══════════════════════════════════════════

    currentAvailWeek: null,

    renderAvailability(container) {
        const session = Auth.getSession();
        const kinesioId = session?.kinesioId;
        if (!kinesioId) return;

        if (!this.currentAvailWeek) {
            this.currentAvailWeek = Utils.getMonday(Utils.today());
        }

        const weekDates = Utils.getWeekDates(this.currentAvailWeek);
        const availability = Store.getAvailability(kinesioId, this.currentAvailWeek);
        const currentBloques = availability ? availability.bloques : {};

        container.innerHTML = `
            <div class="page-header">
                <h2>Mi Disponibilidad</h2>
            </div>

            <div class="card" style="margin-bottom: var(--space-5);">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3);">
                    <div style="display: flex; align-items: center; gap: var(--space-3);">
                        <button class="btn btn-sm btn-outline" onclick="KinesioPortal.prevAvailWeek()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        <span style="font-weight: var(--fw-semibold); min-width: 200px; text-align: center;">
                            Semana del ${Utils.formatDate(this.currentAvailWeek)}
                        </span>
                        <button class="btn btn-sm btn-outline" onclick="KinesioPortal.nextAvailWeek()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                    </div>
                    <div style="display: flex; gap: var(--space-2);">
                        <button class="btn btn-sm btn-outline" onclick="KinesioPortal.copyToNextWeek()">
                            📋 Copiar a próxima semana
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="KinesioPortal.saveAvailability()">
                            💾 Guardar
                        </button>
                    </div>
                </div>
            </div>

            <div class="card">
                <p style="font-size: var(--fs-sm); color: var(--text-muted); margin-bottom: var(--space-4);">
                    Haz clic en los bloques para marcar tu disponibilidad. Los bloques verdes indican que estás disponible.
                </p>
                <div class="availability-grid" id="availability-grid">
                    <div class="availability-header" style="background: var(--bg-dark);"></div>
                    ${Utils.DAY_KEYS.map((day, i) => `
                        <div class="availability-header">${Utils.DAY_LABELS[day]}<br><span style="font-size: var(--fs-xs); color: var(--text-muted);">${Utils.formatDate(weekDates[i])}</span></div>
                    `).join('')}

                    ${Utils.TIME_BLOCKS.map(block => `
                        <div class="availability-time">${block.start}<br>${block.end}</div>
                        ${Utils.DAY_KEYS.map(day => {
                            const isSelected = currentBloques[day] && currentBloques[day].includes(block.start);
                            return `
                                <div class="availability-cell ${isSelected ? 'selected' : ''}"
                                     data-day="${day}" data-block="${block.start}"
                                     onclick="KinesioPortal.toggleBlock(this, '${day}', '${block.start}')">
                                </div>
                            `;
                        }).join('')}
                    `).join('')}
                </div>
            </div>
        `;
    },

    toggleBlock(cell, day, block) {
        cell.classList.toggle('selected');
    },

    saveAvailability() {
        const session = Auth.getSession();
        const kinesioId = session?.kinesioId;
        if (!kinesioId) return;

        const bloques = {};
        Utils.DAY_KEYS.forEach(day => { bloques[day] = []; });

        document.querySelectorAll('.availability-cell.selected').forEach(cell => {
            const day = cell.dataset.day;
            const block = cell.dataset.block;
            if (bloques[day]) {
                bloques[day].push(block);
            }
        });

        Store.setAvailability(kinesioId, this.currentAvailWeek, bloques);
        App.toast('Disponibilidad guardada correctamente', 'success');
    },

    copyToNextWeek() {
        const session = Auth.getSession();
        const kinesioId = session?.kinesioId;
        if (!kinesioId) return;

        const current = Store.getAvailability(kinesioId, this.currentAvailWeek);
        if (!current) {
            App.toast('No hay disponibilidad para copiar', 'warning');
            return;
        }

        const nextMonday = Utils.addWeeks(this.currentAvailWeek, 1);
        Store.setAvailability(kinesioId, nextMonday, { ...current.bloques });
        App.toast('Disponibilidad copiada a la próxima semana', 'success');
    },

    prevAvailWeek() {
        this.currentAvailWeek = Utils.addWeeks(this.currentAvailWeek, -1);
        this.renderAvailability(document.getElementById('main-content'));
    },

    nextAvailWeek() {
        this.currentAvailWeek = Utils.addWeeks(this.currentAvailWeek, 1);
        this.renderAvailability(document.getElementById('main-content'));
    }
};
