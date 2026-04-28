/* =============================================
   KineApp — Sessions & Clinical Notes Module
   ============================================= */

const Sessions = {
    // ── Show clinical note form (used by kinesio portal) ──
    showNoteForm(sessionId, onComplete = null) {
        const session = Store.getSession(sessionId);
        if (!session) return;

        const patient = Store.getPatient(session.pacienteId);

        const body = `
            <form id="note-form" onsubmit="Sessions.saveNote(event, '${sessionId}')">
                <div class="alert alert-info" style="margin-bottom: var(--space-4);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <div class="alert-content">
                        <p><strong>Paciente:</strong> ${Utils.escapeHtml(patient?.nombre || '-')}</p>
                        <p><strong>Sesión:</strong> ${Utils.formatDate(session.fecha)} · ${session.bloque}</p>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Evolución del Paciente *</label>
                    <textarea class="form-textarea" name="evolucion" rows="5" required placeholder="Describa la evolución del paciente en esta sesión..."></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Observaciones</label>
                    <textarea class="form-textarea" name="observaciones" rows="3" placeholder="Indicaciones, ejercicios, próximos pasos..."></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar Nota Clínica</button>
                </div>
            </form>
        `;

        App.showModal('Nota Clínica', body);
        Sessions._onNoteComplete = onComplete;
    },

    saveNote(e, sessionId) {
        e.preventDefault();
        const form = e.target;
        const session = Store.getSession(sessionId);

        Store.createNote({
            sesionId: sessionId,
            kinesioId: session.kinesioId,
            pacienteId: session.pacienteId,
            evolucion: form.evolucion.value.trim(),
            observaciones: form.observaciones.value.trim()
        });

        Store.updateSession(sessionId, {
            estado: 'realizada',
            notaClinica: true
        });

        App.closeModal();
        App.toast('Nota clínica guardada y sesión marcada como realizada', 'success');

        if (Sessions._onNoteComplete) {
            Sessions._onNoteComplete();
            Sessions._onNoteComplete = null;
        }
    },

    // ── Schedule next visit form ──
    showNextVisitForm(sessionId, kinesioId, pacienteId, onComplete = null) {
        const kinesio = Store.getKinesiologist(kinesioId);
        const patient = Store.getPatient(pacienteId);
        const nextMonday = Utils.getMonday(Utils.today());

        // Find available blocks for this kinesio in current and next week
        const weeks = [nextMonday, Utils.addWeeks(nextMonday, 1)];
        let slotsHtml = '';

        weeks.forEach(monday => {
            const availability = Store.getAvailability(kinesioId, monday);
            if (!availability) return;

            const weekDates = Utils.getWeekDates(monday);
            weekDates.forEach(date => {
                const dayKey = Utils.getDayKey(date);
                const availableBlocks = availability.bloques[dayKey] || [];

                availableBlocks.forEach(blockStart => {
                    const block = Utils.TIME_BLOCKS.find(b => b.start === blockStart);
                    if (!block) return;

                    const bloqueStr = `${block.start}-${block.end}`;
                    const existing = Store.getSessionForSlot(kinesioId, date, bloqueStr);
                    if (existing) return;

                    // Only future dates
                    if (date < Utils.today()) return;

                    slotsHtml += `
                        <option value="${date}|${bloqueStr}">
                            ${Utils.getDayName(date)} ${Utils.formatDate(date)} — ${bloqueStr}
                        </option>
                    `;
                });
            });
        });

        const body = `
            <form id="next-visit-form" onsubmit="Sessions.scheduleNextVisit(event, '${kinesioId}', '${pacienteId}')">
                <div class="alert alert-info" style="margin-bottom: var(--space-4);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <div class="alert-content">
                        <p><strong>Paciente:</strong> ${Utils.escapeHtml(patient?.nombre || '-')}</p>
                        <p><strong>Kinesiólogo:</strong> ${Utils.escapeHtml(kinesio?.nombre || '-')}</p>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Seleccionar próximo bloque disponible *</label>
                    <select class="form-select" name="slotSelection" required>
                        <option value="">Seleccionar horario</option>
                        ${slotsHtml || '<option disabled>No hay bloques disponibles</option>'}
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary" ${!slotsHtml ? 'disabled' : ''}>Agendar Siguiente Visita</button>
                </div>
            </form>
        `;

        App.showModal('Agendar Siguiente Visita', body);
        Sessions._onNextVisitComplete = onComplete;
    },

    scheduleNextVisit(e, kinesioId, pacienteId) {
        e.preventDefault();
        const form = e.target;
        const [fecha, bloque] = form.slotSelection.value.split('|');

        const session = Auth.getSession();

        Store.createSession({
            pacienteId,
            kinesioId,
            fecha,
            bloque,
            esPrimeraSesion: false,
            agendadaPor: session?.kinesioId || 'admin'
        });

        App.closeModal();
        App.toast('Siguiente visita agendada correctamente', 'success');

        if (Sessions._onNextVisitComplete) {
            Sessions._onNextVisitComplete();
            Sessions._onNextVisitComplete = null;
        }
    }
};
