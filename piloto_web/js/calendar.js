/* =============================================
   KineApp — Calendar & Scheduling Module
   ============================================= */

const Calendar = {
    currentMonday: null,
    selectedKinesio: 'all',

    render(container) {
        if (!this.currentMonday) {
            this.currentMonday = Utils.getMonday(Utils.today());
        }

        const weekDates = Utils.getWeekDates(this.currentMonday);
        const kinesiologists = Store.getKinesiologists();
        const today = Utils.today();

        container.innerHTML = `
            <div class="page-header">
                <h2>Calendario General</h2>
            </div>

            <div class="calendar-toolbar">
                <div class="calendar-nav">
                    <button class="btn-icon btn btn-outline" onclick="Calendar.prevWeek()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <h3>${this.getWeekLabel(weekDates)}</h3>
                    <button class="btn-icon btn btn-outline" onclick="Calendar.nextWeek()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                    <button class="btn btn-sm btn-ghost" onclick="Calendar.goToToday()">Hoy</button>
                </div>
                <div class="calendar-filters">
                    <select class="calendar-filter-select" id="kinesio-filter" onchange="Calendar.filterKinesio(this.value)">
                        <option value="all">Todos los Kinesiólogos</option>
                        ${kinesiologists.map(k => `
                            <option value="${k.id}" ${this.selectedKinesio === k.id ? 'selected' : ''}>${Utils.escapeHtml(k.nombre)}</option>
                        `).join('')}
                    </select>
                </div>
            </div>

            <div class="calendar-legend">
                <div class="legend-item"><div class="legend-dot available"></div> Disponible</div>
                <div class="legend-item"><div class="legend-dot scheduled"></div> Agendado</div>
                <div class="legend-item"><div class="legend-dot unavailable"></div> No disponible</div>
            </div>

            <div class="calendar-grid-wrapper">
                <div class="calendar-grid weekly">
                    ${this.renderHeaders(weekDates, today)}
                    ${this.renderTimeSlots(weekDates, kinesiologists)}
                </div>
            </div>
        `;
    },

    getWeekLabel(dates) {
        const start = new Date(dates[0] + 'T00:00:00');
        const end = new Date(dates[4] + 'T00:00:00');
        const startStr = start.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
        const endStr = end.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
        return `${startStr} — ${endStr}`;
    },

    renderHeaders(dates, today) {
        let html = '<div class="calendar-time-header">Hora</div>';
        dates.forEach(date => {
            const isToday = date === today;
            html += `
                <div class="calendar-day-header ${isToday ? 'today' : ''}">
                    <span class="day-name">${Utils.getDayShort(date)}</span>
                    <span class="day-number">${new Date(date + 'T00:00:00').getDate()}</span>
                </div>
            `;
        });
        return html;
    },

    renderTimeSlots(dates, kinesiologists) {
        const filteredKinesios = this.selectedKinesio === 'all'
            ? kinesiologists
            : kinesiologists.filter(k => k.id === this.selectedKinesio);

        let html = '';

        Utils.TIME_BLOCKS.forEach(block => {
            // Time column
            html += `
                <div class="calendar-time">
                    <span class="time-start">${block.start}</span>
                    <span class="time-end">${block.end}</span>
                </div>
            `;

            // Day columns
            dates.forEach(date => {
                const slotInfo = this.getSlotInfo(date, block, filteredKinesios);
                html += this.renderSlot(slotInfo, date, block);
            });
        });

        return html;
    },

    getSlotInfo(date, block, kinesiologists) {
        const weekMonday = Utils.getMonday(date);
        const dayKey = Utils.getDayKey(date);
        const bloqueKey = block.start;

        const results = [];

        kinesiologists.forEach(kinesio => {
            const availability = Store.getAvailability(kinesio.id, weekMonday);
            const isAvailable = availability && availability.bloques[dayKey] &&
                availability.bloques[dayKey].includes(bloqueKey);

            const session = Store.getSessionForSlot(kinesio.id, date, `${block.start}-${block.end}`);

            results.push({
                kinesio,
                isAvailable,
                session
            });
        });

        return results;
    },

    renderSlot(slotInfoArray, date, block) {
        // Find any scheduled sessions
        const scheduled = slotInfoArray.filter(s => s.session);
        const available = slotInfoArray.filter(s => s.isAvailable && !s.session);

        if (scheduled.length > 0) {
            // Show scheduled session(s)
            const first = scheduled[0];
            const patient = Store.getPatient(first.session.pacienteId);
            const statusClass = first.session.estado === 'realizada' ? 'realizada' : 'agendada';

            return `
                <div class="calendar-slot scheduled" onclick="Calendar.showSessionDetail('${first.session.id}')">
                    <div class="slot-content">
                        <span class="slot-patient">${Utils.escapeHtml(patient?.nombre || '?')}</span>
                        <span class="slot-kinesio">${Utils.escapeHtml(first.kinesio.nombre)}</span>
                        <span class="slot-badge ${statusClass}">${first.session.estado === 'realizada' ? '✓ Realizada' : 'Agendada'}</span>
                    </div>
                    ${scheduled.length > 1 ? `<span style="font-size: 9px; color: var(--text-muted);">+${scheduled.length - 1} más</span>` : ''}
                </div>
            `;
        }

        if (available.length > 0) {
            // Show available slot
            const kinesioNames = available.map(a => a.kinesio.nombre).join(', ');
            return `
                <div class="calendar-slot available" onclick="Calendar.showScheduleForm('${date}', '${block.start}-${block.end}')" title="Disponible: ${kinesioNames}">
                </div>
            `;
        }

        // Not available
        return `<div class="calendar-slot unavailable"></div>`;
    },

    // ── Navigation ──
    prevWeek() {
        this.currentMonday = Utils.addWeeks(this.currentMonday, -1);
        this.render(document.getElementById('main-content'));
    },

    nextWeek() {
        this.currentMonday = Utils.addWeeks(this.currentMonday, 1);
        this.render(document.getElementById('main-content'));
    },

    goToToday() {
        this.currentMonday = Utils.getMonday(Utils.today());
        this.render(document.getElementById('main-content'));
    },

    filterKinesio(value) {
        this.selectedKinesio = value;
        this.render(document.getElementById('main-content'));
    },

    // ── Schedule New Session ──
    showScheduleForm(date, bloque) {
        const weekMonday = Utils.getMonday(date);
        const dayKey = Utils.getDayKey(date);
        const bloqueStart = bloque.split('-')[0];

        // Find available kinesios for this slot
        const kinesiologists = Store.getKinesiologists();
        const availableKinesios = kinesiologists.filter(k => {
            const avail = Store.getAvailability(k.id, weekMonday);
            if (!avail || !avail.bloques[dayKey]) return false;
            if (!avail.bloques[dayKey].includes(bloqueStart)) return false;
            // Check no existing session
            const existing = Store.getSessionForSlot(k.id, date, bloque);
            return !existing;
        });

        const patients = Store.getPatients();

        const body = `
            <form id="schedule-form" onsubmit="Calendar.scheduleSession(event)">
                <div class="alert alert-info" style="margin-bottom: var(--space-4);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <div class="alert-content">
                        <p><strong>${Utils.getDayName(date)} ${Utils.formatDate(date)}</strong> · ${bloque}</p>
                    </div>
                </div>
                <input type="hidden" name="fecha" value="${date}">
                <input type="hidden" name="bloque" value="${bloque}">
                <div class="form-group">
                    <label class="form-label">Kinesiólogo *</label>
                    <select class="form-select" name="kinesioId" required>
                        <option value="">Seleccionar kinesiólogo</option>
                        ${availableKinesios.map(k => `
                            <option value="${k.id}">${Utils.escapeHtml(k.nombre)} — ${k.especialidad?.join(', ') || ''}</option>
                        `).join('')}
                    </select>
                    ${availableKinesios.length === 0 ? '<p class="form-error">No hay kinesiólogos disponibles en este horario</p>' : ''}
                </div>
                <div class="form-group">
                    <label class="form-label">Paciente *</label>
                    <select class="form-select" name="pacienteId" required>
                        <option value="">Seleccionar paciente</option>
                        ${patients.map(p => `
                            <option value="${p.id}">${Utils.escapeHtml(p.nombre)} — ${Utils.escapeHtml(p.patologia || '')}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label" style="display: flex; align-items: center; gap: var(--space-2);">
                        <input type="checkbox" name="esPrimeraSesion" style="width: 16px; height: 16px; accent-color: var(--primary);">
                        Es primera sesión
                    </label>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary" ${availableKinesios.length === 0 ? 'disabled' : ''}>Agendar Sesión</button>
                </div>
            </form>
        `;

        App.showModal('Agendar Sesión', body);
    },

    scheduleSession(e) {
        e.preventDefault();
        const form = e.target;

        Store.createSession({
            pacienteId: form.pacienteId.value,
            kinesioId: form.kinesioId.value,
            fecha: form.fecha.value,
            bloque: form.bloque.value,
            esPrimeraSesion: form.esPrimeraSesion.checked,
            agendadaPor: 'admin'
        });

        App.closeModal();
        App.toast('Sesión agendada correctamente', 'success');
        this.render(document.getElementById('main-content'));
    },

    // ── Session Detail ──
    showSessionDetail(sessionId) {
        const session = Store.getSession(sessionId);
        if (!session) return;

        const patient = Store.getPatient(session.pacienteId);
        const kinesio = Store.getKinesiologist(session.kinesioId);
        const note = Store.getNotesBySession(sessionId);

        const body = `
            <div style="display: flex; flex-direction: column; gap: var(--space-4);">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); font-size: var(--fs-sm);">
                    <div><strong>Paciente:</strong><br>${Utils.escapeHtml(patient?.nombre || '-')}</div>
                    <div><strong>Kinesiólogo:</strong><br>${Utils.escapeHtml(kinesio?.nombre || '-')}</div>
                    <div><strong>Fecha:</strong><br>${Utils.formatDateLong(session.fecha)}</div>
                    <div><strong>Horario:</strong><br>${session.bloque}</div>
                    <div><strong>Estado:</strong><br>
                        <span class="badge badge-${session.estado === 'realizada' ? 'success' : session.estado === 'cancelada' ? 'danger' : 'info'}">
                            ${Utils.capitalize(session.estado)}
                        </span>
                    </div>
                    <div><strong>Cobro:</strong><br>
                        <span class="badge badge-${session.estadoCobro === 'cobrado' ? 'success' : 'warning'}">${Utils.capitalize(session.estadoCobro)}</span>
                    </div>
                </div>
                ${session.esPrimeraSesion ? '<span class="badge badge-accent" style="align-self: flex-start;">Primera Sesión</span>' : ''}
                ${note ? `
                    <div class="divider"></div>
                    <div>
                        <div class="form-label" style="margin-bottom: var(--space-2);">Nota Clínica</div>
                        <div style="background: var(--bg-dark); border-radius: var(--radius-md); padding: var(--space-3); font-size: var(--fs-sm);">
                            <p style="color: var(--text-secondary);">${Utils.escapeHtml(note.evolucion)}</p>
                            ${note.observaciones ? `<p style="color: var(--text-muted); font-style: italic; margin-top: var(--space-2);">Obs: ${Utils.escapeHtml(note.observaciones)}</p>` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        const footer = `
            <button class="btn btn-outline" onclick="App.closeModal()">Cerrar</button>
            ${session.estado !== 'cancelada' ? `
                <button class="btn btn-danger btn-sm" onclick="App.closeModal(); Calendar.cancelSession('${sessionId}')">Cancelar Sesión</button>
            ` : ''}
        `;

        App.showModal('Detalle de Sesión', body, footer);
    },

    cancelSession(sessionId) {
        App.confirm('¿Seguro que deseas cancelar esta sesión?', () => {
            Store.deleteSession(sessionId);
            App.toast('Sesión cancelada', 'success');
            this.render(document.getElementById('main-content'));
        });
    }
};
