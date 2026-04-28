/* =============================================
   KineApp — Patients Module
   ============================================= */

const Patients = {
    searchTerm: '',

    render(container) {
        const patients = Store.getPatients();
        const filtered = this.searchTerm
            ? patients.filter(p =>
                p.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                (p.rut && p.rut.includes(this.searchTerm)) ||
                (p.comuna && p.comuna.toLowerCase().includes(this.searchTerm.toLowerCase()))
            )
            : patients;

        container.innerHTML = `
            <div class="page-header">
                <h2>Pacientes</h2>
                <div class="page-header-actions">
                    <div class="search-bar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input type="text" placeholder="Buscar paciente..." value="${Utils.escapeHtml(this.searchTerm)}" oninput="Patients.search(this.value)" id="patient-search">
                    </div>
                    <button class="btn btn-primary" onclick="Patients.showForm()">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Nuevo Paciente
                    </button>
                </div>
            </div>

            ${filtered.length === 0 ? `
                <div class="card">
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <h4>No hay pacientes</h4>
                        <p>${this.searchTerm ? 'No se encontraron resultados' : 'Agrega tu primer paciente para comenzar'}</p>
                        ${!this.searchTerm ? '<button class="btn btn-primary" onclick="Patients.showForm()">Agregar Paciente</button>' : ''}
                    </div>
                </div>
            ` : `
                <div class="grid-auto">
                    ${filtered.map((p, i) => this.renderPatientCard(p, i)).join('')}
                </div>
            `}
        `;
    },

    renderPatientCard(patient, index) {
        const kinesio = patient.kinesioAsignado ? Store.getKinesiologist(patient.kinesioAsignado) : null;
        const sessions = Store.getSessionsByPatient(patient.id).filter(s => s.estado !== 'cancelada');
        const completedSessions = sessions.filter(s => s.estado === 'realizada').length;

        return `
            <div class="card card-interactive animate-fade-in-up" style="animation-delay: ${index * 80}ms" onclick="Patients.showDetail('${patient.id}')">
                <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4);">
                    <div class="avatar" style="background: linear-gradient(135deg, ${this.getColorForPatient(index)});">
                        ${Utils.getInitials(patient.nombre)}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <h4 style="font-size: var(--fs-base); margin: 0;">${Utils.escapeHtml(patient.nombre)}</h4>
                        <p style="font-size: var(--fs-xs); color: var(--text-muted); margin: 0;">${Utils.escapeHtml(patient.rut || '')}</p>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: var(--space-2); font-size: var(--fs-sm);">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-muted);">Patología</span>
                        <span style="color: var(--text-secondary); text-align: right; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${Utils.escapeHtml(patient.patologia || '-')}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-muted);">Kinesiólogo</span>
                        <span style="color: var(--text-secondary);">${Utils.escapeHtml(kinesio?.nombre || 'Sin asignar')}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-muted);">Sesiones</span>
                        <span style="color: var(--text-secondary);">${completedSessions}/${sessions.length}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-muted);">Valor</span>
                        <span style="color: var(--accent); font-weight: var(--fw-semibold);">${Utils.formatCurrency(patient.valorSesion || 0)}</span>
                    </div>
                </div>
                <div style="margin-top: var(--space-3); display: flex; gap: var(--space-2);">
                    <span class="badge badge-${patient.periodoCobro === 'mensual' ? 'primary' : 'accent'}">${Utils.capitalize(patient.periodoCobro || 'mensual')}</span>
                    <span class="badge badge-success">${Utils.escapeHtml(patient.comuna || '')}</span>
                </div>
            </div>
        `;
    },

    getColorForPatient(index) {
        const colors = [
            '#1a56db, #3b82f6', '#06b6d4, #22d3ee', '#059669, #10b981',
            '#8b5cf6, #a78bfa', '#f59e0b, #fbbf24', '#ec4899, #f472b6'
        ];
        return colors[index % colors.length];
    },

    search: Utils.debounce(function(value) {
        Patients.searchTerm = value;
        Patients.render(document.getElementById('main-content'));
    }, 250),

    // ── Show Patient Detail ──
    showDetail(id) {
        const patient = Store.getPatient(id);
        if (!patient) return;

        const kinesio = patient.kinesioAsignado ? Store.getKinesiologist(patient.kinesioAsignado) : null;
        const notes = Store.getNotesByPatient(id);
        const sessions = Store.getSessionsByPatient(id).filter(s => s.estado !== 'cancelada');

        const body = `
            <div style="display: flex; flex-direction: column; gap: var(--space-5);">
                <div>
                    <div class="form-label" style="margin-bottom: var(--space-3);">Datos Personales</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); font-size: var(--fs-sm);">
                        <div><strong>Nombre:</strong><br>${Utils.escapeHtml(patient.nombre)}</div>
                        <div><strong>RUT:</strong><br>${Utils.escapeHtml(patient.rut || '-')}</div>
                        <div><strong>Teléfono:</strong><br>${Utils.escapeHtml(patient.telefono || '-')}</div>
                        <div><strong>Comuna:</strong><br>${Utils.escapeHtml(patient.comuna || '-')}</div>
                        <div style="grid-column: 1 / -1;"><strong>Dirección:</strong><br>${Utils.escapeHtml(patient.direccion || '-')}</div>
                    </div>
                </div>
                <div class="divider"></div>
                <div>
                    <div class="form-label" style="margin-bottom: var(--space-3);">Información Clínica</div>
                    <div style="font-size: var(--fs-sm); display: flex; flex-direction: column; gap: var(--space-2);">
                        <div><strong>Patología:</strong> ${Utils.escapeHtml(patient.patologia || '-')}</div>
                        <div><strong>Diagnóstico:</strong> ${Utils.escapeHtml(patient.diagnostico || '-')}</div>
                        <div><strong>Kinesiólogo:</strong> ${Utils.escapeHtml(kinesio?.nombre || 'Sin asignar')}</div>
                        <div><strong>Valor Sesión:</strong> ${Utils.formatCurrency(patient.valorSesion || 0)}</div>
                        <div><strong>Periodo de Cobro:</strong> ${Utils.capitalize(patient.periodoCobro || 'mensual')}</div>
                        <div><strong>Fecha Inicio:</strong> ${Utils.formatDate(patient.fechaInicio)}</div>
                    </div>
                </div>
                ${notes.length > 0 ? `
                    <div class="divider"></div>
                    <div>
                        <div class="form-label" style="margin-bottom: var(--space-3);">Notas Clínicas (${notes.length})</div>
                        <div style="max-height: 200px; overflow-y: auto;">
                            ${notes.map(n => `
                                <div style="background: var(--bg-dark); border-radius: var(--radius-md); padding: var(--space-3); margin-bottom: var(--space-2); font-size: var(--fs-sm);">
                                    <div style="color: var(--text-muted); font-size: var(--fs-xs); margin-bottom: var(--space-1);">${Utils.formatDate(n.fecha?.split('T')[0])}</div>
                                    <div style="color: var(--text-secondary);">${Utils.escapeHtml(n.evolucion)}</div>
                                    ${n.observaciones ? `<div style="color: var(--text-muted); font-style: italic; margin-top: var(--space-1);">Obs: ${Utils.escapeHtml(n.observaciones)}</div>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        const footer = `
            <button class="btn btn-outline" onclick="App.closeModal()">Cerrar</button>
            <button class="btn btn-primary" onclick="App.closeModal(); Patients.showForm('${id}')">Editar</button>
            <button class="btn btn-danger" onclick="App.closeModal(); Patients.confirmDelete('${id}')">Eliminar</button>
        `;

        App.showModal(`Paciente: ${patient.nombre}`, body, footer, 'modal-lg');
    },

    // ── Show Patient Form (Create/Edit) ──
    showForm(id = null) {
        const patient = id ? Store.getPatient(id) : {};
        const kinesiologists = Store.getKinesiologists();
        const isEdit = !!id;

        const body = `
            <form id="patient-form" onsubmit="Patients.savePatient(event, '${id || ''}')">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Nombre *</label>
                        <input type="text" class="form-input" name="nombre" value="${Utils.escapeHtml(patient.nombre || '')}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">RUT</label>
                        <input type="text" class="form-input" name="rut" value="${Utils.escapeHtml(patient.rut || '')}" placeholder="12.345.678-9">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Teléfono</label>
                        <input type="text" class="form-input" name="telefono" value="${Utils.escapeHtml(patient.telefono || '')}" placeholder="+56 9 1234 5678">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Comuna</label>
                        <input type="text" class="form-input" name="comuna" value="${Utils.escapeHtml(patient.comuna || '')}" placeholder="Providencia">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Dirección</label>
                    <input type="text" class="form-input" name="direccion" value="${Utils.escapeHtml(patient.direccion || '')}" placeholder="Av. Providencia 1234">
                </div>
                <div class="form-group">
                    <label class="form-label">Patología</label>
                    <input type="text" class="form-input" name="patologia" value="${Utils.escapeHtml(patient.patologia || '')}" placeholder="Tendinitis, Lumbalgia, etc.">
                </div>
                <div class="form-group">
                    <label class="form-label">Diagnóstico</label>
                    <textarea class="form-textarea" name="diagnostico" rows="2" placeholder="Descripción del diagnóstico...">${Utils.escapeHtml(patient.diagnostico || '')}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Valor Sesión (CLP) *</label>
                        <input type="number" class="form-input" name="valorSesion" value="${patient.valorSesion || 25000}" required min="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Periodo Cobro *</label>
                        <select class="form-select" name="periodoCobro" required>
                            <option value="mensual" ${patient.periodoCobro === 'mensual' ? 'selected' : ''}>Mensual</option>
                            <option value="quincenal" ${patient.periodoCobro === 'quincenal' ? 'selected' : ''}>Quincenal</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Kinesiólogo Asignado</label>
                        <select class="form-select" name="kinesioAsignado">
                            <option value="">Sin asignar</option>
                            ${kinesiologists.map(k => `
                                <option value="${k.id}" ${patient.kinesioAsignado === k.id ? 'selected' : ''}>${Utils.escapeHtml(k.nombre)} — ${k.especialidad?.join(', ') || ''}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Fecha Inicio</label>
                        <input type="date" class="form-input" name="fechaInicio" value="${patient.fechaInicio || Utils.today()}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Orden Médica (Imagen/PDF)</label>
                    <div class="file-upload" onclick="document.getElementById('orden-medica-input').click()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <p id="file-label">${patient.ordenMedica ? '📎 Archivo cargado' : 'Click para subir archivo'}</p>
                    </div>
                    <input type="file" id="orden-medica-input" accept="image/*,.pdf" style="display:none" onchange="Patients.handleFileUpload(this)">
                    <input type="hidden" name="ordenMedica" value="${patient.ordenMedica || ''}">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar Cambios' : 'Crear Paciente'}</button>
                </div>
            </form>
        `;

        App.showModal(isEdit ? 'Editar Paciente' : 'Nuevo Paciente', body, '', 'modal-lg');
    },

    handleFileUpload(input) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            if (file.size > 2 * 1024 * 1024) {
                App.toast('El archivo no puede superar 2MB', 'warning');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                document.querySelector('input[name="ordenMedica"]').value = e.target.result;
                document.getElementById('file-label').textContent = `📎 ${file.name}`;
            };
            reader.readAsDataURL(file);
        }
    },

    savePatient(e, id) {
        e.preventDefault();
        const form = e.target;
        const data = {
            nombre: form.nombre.value.trim(),
            rut: form.rut.value.trim(),
            telefono: form.telefono.value.trim(),
            comuna: form.comuna.value.trim(),
            direccion: form.direccion.value.trim(),
            patologia: form.patologia.value.trim(),
            diagnostico: form.diagnostico.value.trim(),
            valorSesion: parseInt(form.valorSesion.value) || 0,
            periodoCobro: form.periodoCobro.value,
            kinesioAsignado: form.kinesioAsignado.value || null,
            fechaInicio: form.fechaInicio.value,
            ordenMedica: form.ordenMedica.value || null
        };

        if (id) {
            Store.updatePatient(id, data);
            App.toast('Paciente actualizado correctamente', 'success');
        } else {
            Store.createPatient(data);
            App.toast('Paciente creado correctamente', 'success');
        }

        App.closeModal();
        this.render(document.getElementById('main-content'));
    },

    confirmDelete(id) {
        App.confirm('¿Estás seguro de eliminar este paciente?', () => {
            Store.deletePatient(id);
            App.toast('Paciente eliminado', 'success');
            this.render(document.getElementById('main-content'));
        });
    }
};
