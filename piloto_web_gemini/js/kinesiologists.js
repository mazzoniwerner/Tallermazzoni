/* =============================================
   KineApp — Kinesiologists Module
   ============================================= */

const Kinesiologists = {
    searchTerm: '',

    render(container) {
        const kinesiologists = Store.getKinesiologists();
        const filtered = this.searchTerm
            ? kinesiologists.filter(k =>
                k.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                (k.especialidad && k.especialidad.some(e => e.toLowerCase().includes(this.searchTerm.toLowerCase())))
            )
            : kinesiologists;

        container.innerHTML = `
            <div class="page-header">
                <h2>Kinesiólogos</h2>
                <div class="page-header-actions">
                    <div class="search-bar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input type="text" placeholder="Buscar kinesiólogo..." value="${Utils.escapeHtml(this.searchTerm)}" oninput="Kinesiologists.search(this.value)">
                    </div>
                    <button class="btn btn-primary" onclick="Kinesiologists.showForm()">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Nuevo Kinesiólogo
                    </button>
                </div>
            </div>

            ${filtered.length === 0 ? `
                <div class="card">
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        <h4>No hay kinesiólogos</h4>
                        <p>Agrega tu primer kinesiólogo</p>
                        <button class="btn btn-primary" onclick="Kinesiologists.showForm()">Agregar Kinesiólogo</button>
                    </div>
                </div>
            ` : `
                <div class="table-container card">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Kinesiólogo</th>
                                <th>Especialidad</th>
                                <th>Honorario</th>
                                <th>Contacto</th>
                                <th>Usuario</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.map((k, i) => this.renderRow(k, i)).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        `;
    },

    renderRow(kinesio, index) {
        const sessions = Store.getSessionsByKinesio(kinesio.id).filter(s => s.estado !== 'cancelada');
        const colors = ['#1a56db, #3b82f6', '#06b6d4, #22d3ee', '#059669, #10b981', '#8b5cf6, #a78bfa', '#f59e0b, #fbbf24'];

        return `
            <tr class="animate-fade-in-up" style="animation-delay: ${index * 60}ms">
                <td>
                    <div style="display: flex; align-items: center; gap: var(--space-3);">
                        <div class="avatar avatar-sm" style="background: linear-gradient(135deg, ${colors[index % colors.length]});">
                            ${Utils.getInitials(kinesio.nombre)}
                        </div>
                        <div>
                            <div style="font-weight: var(--fw-semibold);">${Utils.escapeHtml(kinesio.nombre)}</div>
                            <div style="font-size: var(--fs-xs); color: var(--text-muted);">${Utils.escapeHtml(kinesio.rut || '')}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="display: flex; flex-wrap: wrap; gap: var(--space-1);">
                        ${(kinesio.especialidad || []).map(e => `<span class="tag">${Utils.escapeHtml(Utils.capitalize(e))}</span>`).join('')}
                    </div>
                </td>
                <td>
                    <span style="color: var(--accent); font-weight: var(--fw-semibold);">${Utils.formatCurrency(kinesio.valorHonorario || 0)}</span>
                </td>
                <td>
                    <div style="font-size: var(--fs-sm);">
                        <div>${Utils.escapeHtml(kinesio.telefono || '-')}</div>
                        <div style="color: var(--text-muted);">${Utils.escapeHtml(kinesio.email || '-')}</div>
                    </div>
                </td>
                <td>
                    <span class="badge badge-info">${Utils.escapeHtml(kinesio.usuario || '-')}</span>
                </td>
                <td>
                    <div style="display: flex; gap: var(--space-2);">
                        <button class="btn btn-sm btn-ghost" onclick="Kinesiologists.showForm('${kinesio.id}')" title="Editar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="btn btn-sm btn-ghost" onclick="Kinesiologists.confirmDelete('${kinesio.id}')" title="Eliminar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    },

    search: Utils.debounce(function(value) {
        Kinesiologists.searchTerm = value;
        Kinesiologists.render(document.getElementById('main-content'));
    }, 250),

    showForm(id = null) {
        const kinesio = id ? Store.getKinesiologist(id) : {};
        const isEdit = !!id;

        const body = `
            <form id="kinesio-form" onsubmit="Kinesiologists.save(event, '${id || ''}')">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Nombre *</label>
                        <input type="text" class="form-input" name="nombre" value="${Utils.escapeHtml(kinesio.nombre || '')}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">RUT</label>
                        <input type="text" class="form-input" name="rut" value="${Utils.escapeHtml(kinesio.rut || '')}" placeholder="15.678.901-2">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Teléfono</label>
                        <input type="text" class="form-input" name="telefono" value="${Utils.escapeHtml(kinesio.telefono || '')}" placeholder="+56 9 8765 4321">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-input" name="email" value="${Utils.escapeHtml(kinesio.email || '')}" placeholder="nombre@email.com">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Especialidades (separadas por coma)</label>
                    <input type="text" class="form-input" name="especialidad" value="${(kinesio.especialidad || []).join(', ')}" placeholder="traumatología, deportiva, neurológica...">
                </div>
                <div class="form-group">
                    <label class="form-label">Valor Honorario por Sesión (CLP) *</label>
                    <input type="number" class="form-input" name="valorHonorario" value="${kinesio.valorHonorario || 15000}" required min="0">
                </div>
                <div class="divider"></div>
                <div class="form-label" style="margin-bottom: var(--space-3); color: var(--accent);">Credenciales de Acceso</div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Usuario *</label>
                        <input type="text" class="form-input" name="usuario" value="${Utils.escapeHtml(kinesio.usuario || '')}" required placeholder="nombre_usuario" ${isEdit ? 'readonly style="opacity:0.6"' : ''}>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Contraseña ${isEdit ? '(dejar vacío para mantener)' : '*'}</label>
                        <input type="text" class="form-input" name="password" value="" placeholder="${isEdit ? '••••' : '1234'}" ${isEdit ? '' : 'required'}>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar Cambios' : 'Crear Kinesiólogo'}</button>
                </div>
            </form>
        `;

        App.showModal(isEdit ? 'Editar Kinesiólogo' : 'Nuevo Kinesiólogo', body);
    },

    save(e, id) {
        e.preventDefault();
        const form = e.target;
        const data = {
            nombre: form.nombre.value.trim(),
            rut: form.rut.value.trim(),
            telefono: form.telefono.value.trim(),
            email: form.email.value.trim(),
            especialidad: form.especialidad.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
            valorHonorario: parseInt(form.valorHonorario.value) || 0,
            usuario: form.usuario.value.trim(),
        };

        if (form.password.value) {
            data.password = form.password.value;
        }

        if (id) {
            Store.updateKinesiologist(id, data);
            App.toast('Kinesiólogo actualizado correctamente', 'success');
        } else {
            data.password = data.password || form.password.value || '1234';
            Store.createKinesiologist(data);
            App.toast('Kinesiólogo creado correctamente', 'success');
        }

        App.closeModal();
        this.render(document.getElementById('main-content'));
    },

    confirmDelete(id) {
        App.confirm('¿Estás seguro de eliminar este kinesiólogo?', () => {
            Store.deleteKinesiologist(id);
            App.toast('Kinesiólogo eliminado', 'success');
            this.render(document.getElementById('main-content'));
        });
    }
};
