// ─── STATE ────────────────────────────────────────────────────────────────────
let session       = null;
let calWeekStart  = null;   // initialized after DOM ready
let calKineFilter = 'all';
let availWeekStart = null;
let finTab  = 'patients';
let finFrom = '';
let finTo   = '';

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  DB.seed();
  calWeekStart   = getMonday(new Date());
  availWeekStart = getMonday(new Date());
  finFrom = firstOfMonth();
  finTo   = today();

  session = Auth.getSession();
  if (session) {
    bootApp();
    navigate(session.role === 'admin' ? 'dashboard' : 'kine-dashboard');
  }

  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('hidden');
  });
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });
});

function bootApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  document.getElementById('nav-avatar').textContent = session.name[0];
  document.getElementById('nav-name').textContent   = session.name;
  document.getElementById('nav-role').textContent   = session.role === 'admin' ? 'Administrador' : 'Kinesiólogo';
  buildNav();
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
const ADMIN_NAV = [
  { view: 'dashboard',  icon: '◉', label: 'Dashboard' },
  { view: 'patients',   icon: '👤', label: 'Pacientes' },
  { view: 'kines',      icon: '🩺', label: 'Kinesiólogos' },
  { view: 'calendar',   icon: '📅', label: 'Calendario' },
  { view: 'financials', icon: '💰', label: 'Finanzas' },
];
const KINE_NAV = [
  { view: 'kine-dashboard',    icon: '◉', label: 'Inicio' },
  { view: 'kine-availability', icon: '📅', label: 'Disponibilidad' },
  { view: 'kine-sessions',     icon: '📋', label: 'Mis Sesiones' },
];

function buildNav() {
  const items = session.role === 'admin' ? ADMIN_NAV : KINE_NAV;
  document.getElementById('nav-list').innerHTML = items.map(it =>
    `<li><a href="#" data-view="${it.view}" onclick="navigate('${it.view}');return false;">
      <span class="nav-icon">${it.icon}</span>${it.label}
    </a></li>`
  ).join('');
}

function navigate(view) {
  const adminViews = ['dashboard','patients','kines','calendar','financials'];
  const kineViews  = ['kine-dashboard','kine-availability','kine-sessions'];
  if (session.role !== 'admin'       && adminViews.includes(view)) return;
  if (session.role !== 'kinesiologo' && kineViews.includes(view))  return;

  document.getElementById('main').innerHTML = renderView(view);
  document.querySelectorAll('#nav-list a').forEach(a =>
    a.classList.toggle('active', a.dataset.view === view)
  );
  closeSidebar();
}

function renderView(view) {
  switch (view) {
    case 'dashboard':         return viewDashboard();
    case 'patients':          return viewPatients();
    case 'kines':             return viewKines();
    case 'calendar':          return viewCalendar();
    case 'financials':        return viewFinancials();
    case 'kine-dashboard':    return viewKineDashboard();
    case 'kine-availability': return viewKineAvailability();
    case 'kine-sessions':     return viewKineSessions();
    default: return '<p>Vista no encontrada.</p>';
  }
}

// ─── LOGIN / LOGOUT ───────────────────────────────────────────────────────────
function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('login-user').value.trim();
  const password = document.getElementById('login-pass').value;
  const err = document.getElementById('login-error');
  session = Auth.login(username, password);
  if (!session) {
    err.textContent = 'Usuario o contraseña incorrectos.';
    err.classList.remove('hidden');
    return;
  }
  err.classList.add('hidden');
  bootApp();
  navigate(session.role === 'admin' ? 'dashboard' : 'kine-dashboard');
}

function handleLogout() {
  Auth.logout();
  location.reload();
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function viewDashboard() {
  const patients  = DB.all(DB.C.PATIENTS).filter(p => p.active);
  const kines     = DB.all(DB.C.KINES).filter(k => k.active);
  const allSess   = DB.all(DB.C.SESSIONS);
  const monthSess = allSess.filter(s => s.date && s.date.startsWith(currentMonth()) && s.status !== 'cancelled');
  const done      = monthSess.filter(s => s.status === 'completed' || s.status === 'billed');
  const revenue   = done.reduce((acc, s) => {
    const p = DB.find(DB.C.PATIENTS, s.patientId);
    return acc + (p ? p.sessionPrice : 0);
  }, 0);
  const pending = allSess.filter(s => s.status === 'scheduled' && s.date >= today()).length;

  return `
    <div class="page-header">
      <div>
        <h1>Dashboard</h1>
        <p>Bienvenido, ${session.name.split(' ')[0]}. Resumen de ${monthName()}.</p>
      </div>
      <button class="btn btn-neutral btn-sm" onclick="if(confirm('¿Reiniciar todos los datos demo?')) DB.reset()">⚙ Reset demo</button>
    </div>
    <div class="stats-grid">
      <div class="stat-card blue">
        <div class="stat-label">Pacientes activos</div>
        <div class="stat-value">${patients.length}</div>
        <div class="stat-sub">fichas en el sistema</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Kinesiólogos</div>
        <div class="stat-value">${kines.length}</div>
        <div class="stat-sub">activos este mes</div>
      </div>
      <div class="stat-card green">
        <div class="stat-label">Sesiones del mes</div>
        <div class="stat-value">${monthSess.length}</div>
        <div class="stat-sub">${done.length} realizadas</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-label">Facturación estimada</div>
        <div class="stat-value" style="font-size:20px">${fmtCLP(revenue)}</div>
        <div class="stat-sub">sesiones realizadas</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pendientes</div>
        <div class="stat-value">${pending}</div>
        <div class="stat-sub">sesiones agendadas</div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Próximas sesiones — 7 días</div>
      ${renderUpcoming(7)}
    </div>`;
}

function renderUpcoming(days) {
  const limit = toDateStr(addDays(new Date(), days));
  const rows = DB.where(DB.C.SESSIONS, s => s.status === 'scheduled' && s.date >= today() && s.date <= limit)
    .sort((a, b) => a.date.localeCompare(b.date) || a.timeSlotId.localeCompare(b.timeSlotId));
  if (!rows.length) return `<div class="empty-state"><div class="empty-icon">📭</div><p>Sin sesiones agendadas en los próximos ${days} días.</p></div>`;
  return `<div class="table-wrap"><table class="data-table">
    <thead><tr><th>Fecha</th><th>Horario</th><th>Paciente</th><th>Kinesiólogo</th></tr></thead>
    <tbody>${rows.map(s => {
      const p    = DB.find(DB.C.PATIENTS, s.patientId);
      const k    = DB.find(DB.C.KINES, s.kinesiologistId);
      const slot = TIME_SLOTS.find(t => t.id === s.timeSlotId);
      return `<tr>
        <td>${fmtDate(s.date)}</td>
        <td>${slot ? slot.start + ' – ' + slot.end : '—'}</td>
        <td>${p?.name || '—'}</td>
        <td>${k?.name || '—'}</td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

// ─── PATIENTS ─────────────────────────────────────────────────────────────────
function viewPatients() {
  const all   = DB.all(DB.C.PATIENTS);
  const kines = DB.all(DB.C.KINES);
  return `
    <div class="page-header">
      <div><h1>Pacientes</h1><p>${all.filter(p=>p.active).length} activos de ${all.length} total</p></div>
      <button class="btn btn-primary" onclick="openPatientForm()">+ Nuevo paciente</button>
    </div>
    <div class="card" style="padding:0;overflow:hidden">
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Nombre / Teléfono</th><th>RUT</th><th>Patología</th><th>Kinesiólogo</th><th>Precio</th><th>Estado</th><th></th></tr></thead>
          <tbody>${all.length ? all.map(p => {
            const k = kines.find(k => k.id === p.assignedKinesiologistId);
            return `<tr>
              <td><strong>${p.name}</strong><br><span class="text-sm">${p.phone || '—'}</span></td>
              <td>${p.rut || '—'}</td>
              <td>${p.pathology || '—'}</td>
              <td>${k ? k.name : '<span class="text-sm">Sin asignar</span>'}</td>
              <td>${fmtCLP(p.sessionPrice)}</td>
              <td><span class="badge badge-${p.active ? 'active' : 'inactive'}">${p.active ? 'Activo' : 'Inactivo'}</span></td>
              <td><div class="table-actions">
                <button class="btn btn-ghost btn-sm" onclick="openPatientForm('${p.id}')">Editar</button>
                <button class="btn btn-neutral btn-sm" onclick="togglePatient('${p.id}')">${p.active ? 'Desactivar' : 'Activar'}</button>
              </div></td>
            </tr>`;
          }).join('') : `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">👤</div><h3>Sin pacientes</h3><p>Crea el primer paciente.</p></div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`;
}

function openPatientForm(id = null) {
  const p     = id ? DB.find(DB.C.PATIENTS, id) : null;
  const kines = DB.all(DB.C.KINES).filter(k => k.active);
  showModal(`
    <div class="modal-title">${p ? 'Editar paciente' : 'Nuevo paciente'}</div>
    <form id="patient-form">
      <div class="form-row">
        <div class="form-group"><label>Nombre completo *</label><input name="name" required value="${esc(p?.name)}"></div>
        <div class="form-group"><label>RUT</label><input name="rut" value="${esc(p?.rut)}" placeholder="12.345.678-9"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Teléfono</label><input name="phone" value="${esc(p?.phone)}" placeholder="+56912345678"></div>
        <div class="form-group"><label>Email</label><input name="email" type="email" value="${esc(p?.email)}"></div>
      </div>
      <div class="form-group"><label>Dirección</label><input name="address" value="${esc(p?.address)}"></div>
      <div class="form-row">
        <div class="form-group"><label>Patología</label><input name="pathology" value="${esc(p?.pathology)}"></div>
        <div class="form-group"><label>Diagnóstico</label><input name="diagnosis" value="${esc(p?.diagnosis)}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Precio por sesión (CLP) *</label><input name="sessionPrice" type="number" required value="${p?.sessionPrice || 30000}"></div>
        <div class="form-group"><label>Periodo de cobro</label>
          <select name="billingPeriod">
            <option value="weekly"    ${p?.billingPeriod==='weekly'?'selected':''}>Semanal</option>
            <option value="biweekly"  ${p?.billingPeriod==='biweekly'?'selected':''}>Quincenal</option>
            <option value="monthly"   ${(!p||p?.billingPeriod==='monthly')?'selected':''}>Mensual</option>
          </select>
        </div>
      </div>
      <div class="form-group"><label>Kinesiólogo asignado</label>
        <select name="assignedKinesiologistId">
          <option value="">Sin asignar</option>
          ${kines.map(k => `<option value="${k.id}" ${p?.assignedKinesiologistId===k.id?'selected':''}>${k.name} — ${k.specialty}</option>`).join('')}
        </select>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">${p ? 'Guardar cambios' : 'Crear paciente'}</button>
      </div>
    </form>`);
  document.getElementById('patient-form').addEventListener('submit', e => {
    e.preventDefault();
    const data = formData(e.target);
    data.sessionPrice = +data.sessionPrice;
    data.active = p ? p.active : true;
    data.medicalOrder = p?.medicalOrder || null;
    if (p) { DB.update(DB.C.PATIENTS, id, data); toast('Paciente actualizado.', 'success'); }
    else   { DB.insert(DB.C.PATIENTS, { ...data, createdAt: new Date().toISOString() }); toast('Paciente creado.', 'success'); }
    closeModal();
    navigate('patients');
  });
}

function togglePatient(id) {
  const p = DB.find(DB.C.PATIENTS, id);
  DB.update(DB.C.PATIENTS, id, { active: !p.active });
  toast(`Paciente ${p.active ? 'desactivado' : 'activado'}.`, 'info');
  navigate('patients');
}

// ─── KINESIOLOGISTS ───────────────────────────────────────────────────────────
function viewKines() {
  const kines = DB.all(DB.C.KINES);
  return `
    <div class="page-header">
      <div><h1>Kinesiólogos</h1><p>${kines.filter(k=>k.active).length} activos</p></div>
      <button class="btn btn-primary" onclick="openKineForm()">+ Nuevo kinesiólogo</button>
    </div>
    <div class="card" style="padding:0;overflow:hidden">
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Nombre / RUT</th><th>Especialidad</th><th>Contacto</th><th>Honorario</th><th>Usuario</th><th>Estado</th><th></th></tr></thead>
          <tbody>${kines.length ? kines.map(k => {
            const u = DB.find(DB.C.USERS, k.userId);
            return `<tr>
              <td><strong>${k.name}</strong><br><span class="text-sm">${k.rut || '—'}</span></td>
              <td>${k.specialty || '—'}</td>
              <td>${k.phone || '—'}<br><span class="text-sm">${k.email || ''}</span></td>
              <td>${fmtCLP(k.sessionFee)}</td>
              <td><code style="font-size:12px;background:#f1f5f9;padding:2px 6px;border-radius:4px">${u?.username || '—'}</code></td>
              <td><span class="badge badge-${k.active?'active':'inactive'}">${k.active?'Activo':'Inactivo'}</span></td>
              <td><div class="table-actions">
                <button class="btn btn-ghost btn-sm" onclick="openKineForm('${k.id}')">Editar</button>
                <button class="btn btn-neutral btn-sm" onclick="toggleKine('${k.id}')">${k.active?'Desactivar':'Activar'}</button>
              </div></td>
            </tr>`;
          }).join('') : `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">🩺</div><h3>Sin kinesiólogos</h3></div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`;
}

function openKineForm(id = null) {
  const k = id ? DB.find(DB.C.KINES, id) : null;
  const u = k ? DB.find(DB.C.USERS, k.userId) : null;
  showModal(`
    <div class="modal-title">${k ? 'Editar kinesiólogo' : 'Nuevo kinesiólogo'}</div>
    <form id="kine-form">
      <div class="form-row">
        <div class="form-group"><label>Nombre completo *</label><input name="name" required value="${esc(k?.name)}"></div>
        <div class="form-group"><label>RUT</label><input name="rut" value="${esc(k?.rut)}" placeholder="12.345.678-9"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Teléfono</label><input name="phone" value="${esc(k?.phone)}"></div>
        <div class="form-group"><label>Email</label><input name="email" type="email" value="${esc(k?.email)}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Especialidad</label><input name="specialty" value="${esc(k?.specialty)}"></div>
        <div class="form-group"><label>Honorario por sesión (CLP) *</label><input name="sessionFee" type="number" required value="${k?.sessionFee || 18000}"></div>
      </div>
      <div style="border-top:1px solid var(--border);margin:14px 0;padding-top:14px">
        <div style="font-size:13px;font-weight:700;margin-bottom:12px;color:var(--text-sm)">Credenciales de acceso al sistema</div>
        <div class="form-row">
          <div class="form-group"><label>Usuario *</label><input name="username" required value="${esc(u?.username)}" placeholder="ej: maria"></div>
          <div class="form-group"><label>${k ? 'Nueva contraseña (vacío = sin cambio)' : 'Contraseña *'}</label><input name="password" type="password" ${k?'':'required'} placeholder="mínimo 4 caracteres"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">${k ? 'Guardar cambios' : 'Crear kinesiólogo'}</button>
      </div>
    </form>`);
  document.getElementById('kine-form').addEventListener('submit', e => {
    e.preventDefault();
    const data = formData(e.target);
    data.sessionFee = +data.sessionFee;
    if (k) {
      DB.update(DB.C.KINES, id, { name: data.name, rut: data.rut, phone: data.phone, email: data.email, specialty: data.specialty, sessionFee: data.sessionFee });
      const userUpd = { name: data.name, username: data.username };
      if (data.password) userUpd.password = data.password;
      DB.update(DB.C.USERS, k.userId, userUpd);
      toast('Kinesiólogo actualizado.', 'success');
    } else {
      if (DB.where(DB.C.USERS, u => u.username === data.username)[0]) { toast('Ese nombre de usuario ya existe.', 'error'); return; }
      const newUser = DB.insert(DB.C.USERS, { name: data.name, username: data.username, password: data.password, role: 'kinesiologo', kinesiologistId: null });
      const newKine = DB.insert(DB.C.KINES, { userId: newUser.id, name: data.name, rut: data.rut, phone: data.phone, email: data.email, specialty: data.specialty, sessionFee: data.sessionFee, active: true, createdAt: new Date().toISOString() });
      DB.update(DB.C.USERS, newUser.id, { kinesiologistId: newKine.id });
      toast('Kinesiólogo creado.', 'success');
    }
    closeModal();
    navigate('kines');
  });
}

function toggleKine(id) {
  const k = DB.find(DB.C.KINES, id);
  DB.update(DB.C.KINES, id, { active: !k.active });
  toast(`Kinesiólogo ${k.active ? 'desactivado' : 'activado'}.`, 'info');
  navigate('kines');
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────
function viewCalendar() {
  const kines     = DB.all(DB.C.KINES).filter(k => k.active);
  const weekDates = getWeekDates(calWeekStart);
  const wLabel    = `${fmtShort(weekDates[0])} – ${fmtShort(weekDates[5])}`;

  const filtered = calKineFilter === 'all' ? kines : kines.filter(k => k.id === calKineFilter);

  return `
    <div class="page-header"><div><h1>Calendario</h1><p>Disponibilidad y sesiones agendadas</p></div></div>
    <div class="card">
      <div class="cal-toolbar">
        <div class="cal-week-nav">
          <button class="btn btn-ghost btn-sm" onclick="calWeekStart=addDays(calWeekStart,-7);navigate('calendar')">‹</button>
          <span class="cal-week-label">${wLabel}</span>
          <button class="btn btn-ghost btn-sm" onclick="calWeekStart=addDays(calWeekStart,7);navigate('calendar')">›</button>
        </div>
        <select onchange="calKineFilter=this.value;navigate('calendar')" style="padding:7px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;background:var(--white)">
          <option value="all" ${calKineFilter==='all'?'selected':''}>Todos los kinesiólogos</option>
          ${kines.map(k=>`<option value="${k.id}" ${calKineFilter===k.id?'selected':''}>${k.name}</option>`).join('')}
        </select>
        <button class="btn btn-ghost btn-sm" onclick="calWeekStart=getMonday(new Date());navigate('calendar')">Hoy</button>
      </div>

      <div class="cal-wrap">
        <table class="cal-table">
          <thead>
            <tr>
              <th>Horario</th>
              ${weekDates.map((d,i)=>`<th>${WEEK_DAYS[i]}<span class="cal-day-num">${fmtShort(d)}</span></th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${TIME_SLOTS.map(slot=>`
              <tr>
                <td class="cal-slot-label">${slot.start}<br><small style="color:var(--notset-txt)">${slot.end}</small></td>
                ${weekDates.map(d=>{
                  const ds = toDateStr(d);
                  return `<td class="cal-cell">${filtered.map(k=>{
                    const status = slotStatus(k.id, ds, slot.id);
                    const label  = slotLabel(k.id, ds, slot.id);
                    if (calKineFilter === 'all') {
                      return `<span class="kine-dot ${status}" title="${k.name}: ${label}" onclick="calClick('${k.id}','${ds}','${slot.id}','${status}')">${k.name[0]}</span>`;
                    }
                    return `<div class="cal-block ${status}" onclick="calClick('${k.id}','${ds}','${slot.id}','${status}')">${label}</div>`;
                  }).join('')}</td>`;
                }).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <div class="cal-legend">
        <div class="legend-item"><div class="legend-dot available"></div>Disponible — haz click para agendar</div>
        <div class="legend-item"><div class="legend-dot booked"></div>Sesión agendada</div>
        <div class="legend-item"><div class="legend-dot unavailable"></div>No disponible</div>
        <div class="legend-item"><div class="legend-dot notset"></div>Sin información de disponibilidad</div>
      </div>
    </div>`;
}

function slotStatus(kineId, dateStr, slotId) {
  const sess = DB.where(DB.C.SESSIONS, s =>
    s.kinesiologistId === kineId && s.date === dateStr && s.timeSlotId === slotId && s.status !== 'cancelled'
  )[0];
  if (sess) return 'booked';
  const av = DB.where(DB.C.AVAILABILITY, a =>
    a.kinesiologistId === kineId && a.date === dateStr && a.timeSlotId === slotId
  )[0];
  return av ? av.status : 'notset';
}

function slotLabel(kineId, dateStr, slotId) {
  const sess = DB.where(DB.C.SESSIONS, s =>
    s.kinesiologistId === kineId && s.date === dateStr && s.timeSlotId === slotId && s.status !== 'cancelled'
  )[0];
  if (sess) { const p = DB.find(DB.C.PATIENTS, sess.patientId); return p ? p.name.split(' ')[0] : 'Agendado'; }
  const av = DB.where(DB.C.AVAILABILITY, a =>
    a.kinesiologistId === kineId && a.date === dateStr && a.timeSlotId === slotId
  )[0];
  if (av) return av.status === 'available' ? 'Disponible' : 'No disponible';
  return 'Sin info';
}

function calClick(kineId, dateStr, slotId, status) {
  if (status === 'booked') {
    const sess = DB.where(DB.C.SESSIONS, s =>
      s.kinesiologistId === kineId && s.date === dateStr && s.timeSlotId === slotId && s.status !== 'cancelled'
    )[0];
    if (sess) openSessionDetail(sess);
    return;
  }
  if (status !== 'available') { toast('Este bloque no está disponible para agendar.', 'info'); return; }
  openScheduleModal(kineId, dateStr, slotId);
}

function openScheduleModal(kineId, dateStr, slotId) {
  const kine     = DB.find(DB.C.KINES, kineId);
  const patients = DB.all(DB.C.PATIENTS).filter(p => p.active && p.assignedKinesiologistId === kineId);
  const slot     = TIME_SLOTS.find(t => t.id === slotId);
  if (!patients.length) { toast('Este kinesiólogo no tiene pacientes asignados.', 'error'); return; }

  showModal(`
    <div class="modal-title">Agendar primera sesión</div>
    <div style="margin-bottom:16px;padding:10px 12px;background:var(--bg);border-radius:6px;font-size:13px">
      <strong>${kine.name}</strong> &nbsp;·&nbsp; ${fmtDate(dateStr)} &nbsp;·&nbsp; ${slot.start} – ${slot.end}
    </div>
    <form id="schedule-form">
      <div class="form-group">
        <label>Paciente *</label>
        <select name="patientId" required>
          <option value="">Selecciona un paciente</option>
          ${patients.map(p=>`<option value="${p.id}">${p.name} — ${p.pathology}</option>`).join('')}
        </select>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">Confirmar sesión</button>
      </div>
    </form>`);
  document.getElementById('schedule-form').addEventListener('submit', e => {
    e.preventDefault();
    const patientId = formData(e.target).patientId;
    DB.insert(DB.C.SESSIONS, {
      patientId, kinesiologistId: kineId, date: dateStr, timeSlotId: slotId,
      sessionNumber: 1, status: 'scheduled', clinicalNote: '',
      scheduledBy: 'admin', createdAt: new Date().toISOString(), completedAt: null, billedAt: null,
    });
    toast('Sesión agendada.', 'success');
    closeModal();
    navigate('calendar');
  });
}

function openSessionDetail(sess) {
  const p    = DB.find(DB.C.PATIENTS, sess.patientId);
  const k    = DB.find(DB.C.KINES, sess.kinesiologistId);
  const slot = TIME_SLOTS.find(t => t.id === sess.timeSlotId);
  showModal(`
    <div class="modal-title">Detalle de sesión</div>
    <table style="width:100%;font-size:13px;line-height:2">
      <tr><td style="color:var(--text-sm);width:110px">Paciente</td><td><strong>${p?.name || '—'}</strong></td></tr>
      <tr><td style="color:var(--text-sm)">Kinesiólogo</td><td>${k?.name || '—'}</td></tr>
      <tr><td style="color:var(--text-sm)">Fecha</td><td>${fmtDate(sess.date)}</td></tr>
      <tr><td style="color:var(--text-sm)">Horario</td><td>${slot?.start} – ${slot?.end}</td></tr>
      <tr><td style="color:var(--text-sm)">Sesión N°</td><td>${sess.sessionNumber}</td></tr>
      <tr><td style="color:var(--text-sm)">Estado</td><td><span class="badge badge-${sess.status}">${statusLabel(sess.status)}</span></td></tr>
      ${sess.clinicalNote ? `<tr><td style="color:var(--text-sm);vertical-align:top">Nota clínica</td><td style="font-style:italic">${esc(sess.clinicalNote)}</td></tr>` : ''}
    </table>
    <div class="modal-footer">
      ${sess.status === 'scheduled' ? `<button class="btn btn-danger btn-sm" onclick="cancelSess('${sess.id}')">Cancelar sesión</button>` : ''}
      <button class="btn btn-ghost" onclick="closeModal()">Cerrar</button>
    </div>`);
}

function cancelSess(sessId) {
  DB.update(DB.C.SESSIONS, sessId, { status: 'cancelled' });
  toast('Sesión cancelada.', 'info');
  closeModal();
  navigate('calendar');
}

// ─── FINANCIALS ───────────────────────────────────────────────────────────────
function viewFinancials() {
  return `
    <div class="page-header"><div><h1>Finanzas</h1><p>Consolidado de cobros y pagos por periodo</p></div></div>
    <div class="tabs">
      <button class="tab-btn ${finTab==='patients'?'active':''}" onclick="finTab='patients';navigate('financials')">Cobros a Pacientes</button>
      <button class="tab-btn ${finTab==='kines'?'active':''}" onclick="finTab='kines';navigate('financials')">Pagos a Kinesiólogos</button>
    </div>
    ${finTab === 'patients' ? renderFinPatients() : renderFinKines()}`;
}

function dateInputs() {
  return `
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;align-items:flex-end">
      <div><label style="display:block;font-size:11px;font-weight:600;color:var(--text-sm);margin-bottom:4px;text-transform:uppercase">Desde</label>
        <input type="date" value="${finFrom}" onchange="finFrom=this.value;navigate('financials')" style="padding:7px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:13px"></div>
      <div><label style="display:block;font-size:11px;font-weight:600;color:var(--text-sm);margin-bottom:4px;text-transform:uppercase">Hasta</label>
        <input type="date" value="${finTo}" onchange="finTo=this.value;navigate('financials')" style="padding:7px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:13px"></div>
    </div>`;
}

function renderFinPatients() {
  const patients = DB.all(DB.C.PATIENTS).filter(p => p.active);
  let anyData = false;
  const blocks = patients.map(p => {
    const sess = DB.where(DB.C.SESSIONS, s =>
      s.patientId === p.id && (s.status === 'completed' || s.status === 'billed') && s.date >= finFrom && s.date <= finTo
    ).sort((a,b)=>a.date.localeCompare(b.date));
    if (!sess.length) return '';
    anyData = true;
    const total = sess.length * p.sessionPrice;
    return `<div class="fin-patient-block">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">
        <div><strong style="font-size:15px">${p.name}</strong> <span class="text-sm" style="margin-left:6px">${p.rut}</span></div>
        <div class="fin-total">${fmtCLP(total)}</div>
      </div>
      <div class="table-wrap"><table class="data-table">
        <thead><tr><th>Fecha</th><th>Horario</th><th>N° Sesión</th><th>Precio</th><th>Estado</th><th></th></tr></thead>
        <tbody>${sess.map(s=>{
          const slot = TIME_SLOTS.find(t=>t.id===s.timeSlotId);
          return `<tr>
            <td>${fmtDate(s.date)}</td>
            <td>${slot?slot.start+' – '+slot.end:'—'}</td>
            <td>Sesión ${s.sessionNumber}</td>
            <td>${fmtCLP(p.sessionPrice)}</td>
            <td><span class="badge badge-${s.status}">${statusLabel(s.status)}</span></td>
            <td>${s.status==='completed'?`<button class="btn btn-primary btn-sm" onclick="markBilled('${s.id}')">Marcar cobrado</button>`:'—'}</td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>
    </div>`;
  }).join('');
  return `<div class="card">${dateInputs()}${anyData ? blocks : '<div class="empty-state"><div class="empty-icon">📭</div><h3>Sin sesiones en el período</h3><p>Ajusta el rango de fechas.</p></div>'}</div>`;
}

function renderFinKines() {
  const kines = DB.all(DB.C.KINES).filter(k => k.active);
  let anyData = false;
  const blocks = kines.map(k => {
    const sess = DB.where(DB.C.SESSIONS, s =>
      s.kinesiologistId === k.id && (s.status === 'completed' || s.status === 'billed') && s.date >= finFrom && s.date <= finTo
    ).sort((a,b)=>a.date.localeCompare(b.date));
    if (!sess.length) return '';
    anyData = true;
    const total = sess.length * k.sessionFee;
    return `<div class="fin-patient-block">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">
        <div><strong style="font-size:15px">${k.name}</strong> <span class="text-sm" style="margin-left:6px">${k.specialty}</span></div>
        <div class="fin-total">${fmtCLP(total)}</div>
      </div>
      <div class="table-wrap"><table class="data-table">
        <thead><tr><th>Fecha</th><th>Paciente</th><th>Horario</th><th>Honorario</th><th>N° Sesión</th></tr></thead>
        <tbody>${sess.map(s=>{
          const p    = DB.find(DB.C.PATIENTS, s.patientId);
          const slot = TIME_SLOTS.find(t=>t.id===s.timeSlotId);
          return `<tr>
            <td>${fmtDate(s.date)}</td>
            <td>${p?.name||'—'}</td>
            <td>${slot?slot.start+' – '+slot.end:'—'}</td>
            <td>${fmtCLP(k.sessionFee)}</td>
            <td>Sesión ${s.sessionNumber}</td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>
    </div>`;
  }).join('');
  return `<div class="card">${dateInputs()}${anyData ? blocks : '<div class="empty-state"><div class="empty-icon">📭</div><h3>Sin sesiones en el período</h3><p>Ajusta el rango de fechas.</p></div>'}</div>`;
}

function markBilled(sessId) {
  DB.update(DB.C.SESSIONS, sessId, { status: 'billed', billedAt: new Date().toISOString() });
  toast('Sesión marcada como cobrada.', 'success');
  navigate('financials');
}

// ─── KINE DASHBOARD ───────────────────────────────────────────────────────────
function viewKineDashboard() {
  const kineId  = session.kinesiologistId;
  const todaySess = DB.where(DB.C.SESSIONS, s => s.kinesiologistId===kineId && s.date===today() && s.status==='scheduled')
    .sort((a,b)=>a.timeSlotId.localeCompare(b.timeSlotId));
  const upcoming  = DB.where(DB.C.SESSIONS, s => s.kinesiologistId===kineId && s.date>today() && s.status==='scheduled')
    .sort((a,b)=>a.date.localeCompare(b.date)).slice(0,6);

  return `
    <div class="page-header"><div><h1>Inicio</h1><p>Bienvenido/a, ${session.name.split(' ')[0]}. Hoy es ${fmtDate(today())}.</p></div></div>
    <div class="stats-grid">
      <div class="stat-card blue"><div class="stat-label">Sesiones hoy</div><div class="stat-value">${todaySess.length}</div></div>
      <div class="stat-card"><div class="stat-label">Próximas agendadas</div><div class="stat-value">${upcoming.length}</div></div>
    </div>
    <div class="card">
      <div class="card-title">Sesiones de hoy</div>
      ${todaySess.length ? todaySess.map(s=>sessionCard(s)).join('') : '<div class="empty-state"><div class="empty-icon">✅</div><p>Sin sesiones para hoy.</p></div>'}
    </div>
    ${upcoming.length ? `<div class="card"><div class="card-title">Próximas sesiones</div>${upcoming.map(s=>sessionCard(s)).join('')}</div>` : ''}`;
}

function sessionCard(s) {
  const p    = DB.find(DB.C.PATIENTS, s.patientId);
  const slot = TIME_SLOTS.find(t=>t.id===s.timeSlotId);
  return `<div class="session-card">
    <div class="session-card-header">
      <div class="session-patient">${p?.name||'—'}</div>
      <span class="badge badge-${s.status}">${statusLabel(s.status)}</span>
    </div>
    <div class="session-meta">${fmtDate(s.date)} &nbsp;·&nbsp; ${slot?.start} – ${slot?.end} &nbsp;·&nbsp; Sesión N°${s.sessionNumber}</div>
    ${p?.address?`<div class="session-meta" style="margin-top:3px">📍 ${p.address}</div>`:''}
    ${p?.pathology?`<div class="session-meta">${p.pathology}</div>`:''}
    ${s.clinicalNote?`<div class="session-note">📝 ${esc(s.clinicalNote)}</div>`:''}
    ${s.status==='scheduled'?`<div class="session-actions"><button class="btn btn-success btn-sm" onclick="openCompleteModal('${s.id}')">Marcar realizada + nota clínica</button></div>`:''}
  </div>`;
}

// ─── KINE AVAILABILITY ────────────────────────────────────────────────────────
function viewKineAvailability() {
  const kineId    = session.kinesiologistId;
  const weekDates = getWeekDates(availWeekStart);
  const wLabel    = `${fmtShort(weekDates[0])} – ${fmtShort(weekDates[5])}`;

  return `
    <div class="page-header"><div><h1>Mi Disponibilidad</h1><p>Marca los bloques en que puedes atender</p></div></div>
    <div class="card">
      <div class="cal-toolbar">
        <div class="cal-week-nav">
          <button class="btn btn-ghost btn-sm" onclick="availWeekStart=addDays(availWeekStart,-7);navigate('kine-availability')">‹</button>
          <span class="cal-week-label">${wLabel}</span>
          <button class="btn btn-ghost btn-sm" onclick="availWeekStart=addDays(availWeekStart,7);navigate('kine-availability')">›</button>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="availWeekStart=getMonday(new Date());navigate('kine-availability')">Esta semana</button>
      </div>
      <div class="avail-wrap">
        <table class="avail-table">
          <thead>
            <tr>
              <th>Horario</th>
              ${weekDates.map((d,i)=>`<th>${WEEK_DAYS[i]}<br><span style="font-size:10px;font-weight:400">${fmtShort(d)}</span></th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${TIME_SLOTS.map(slot=>`
              <tr>
                <td style="font-size:11px;font-weight:600;color:var(--text-sm);padding:6px;white-space:nowrap;text-align:center;background:var(--bg)">${slot.start}<br><span style="color:var(--notset-txt)">${slot.end}</span></td>
                ${weekDates.map(d=>{
                  const ds     = toDateStr(d);
                  const status = slotStatus(kineId, ds, slot.id);
                  const isPast = ds < today();
                  if (isPast) return `<td><button class="avail-btn notset" disabled style="opacity:.35;cursor:default">—</button></td>`;
                  const labels = { available:'✓ Disponible', unavailable:'✗ No disponible', booked:'🔒 Agendado', notset:'Toca para marcar' };
                  return `<td><button class="avail-btn ${status}" ${status==='booked'?'disabled':''} onclick="toggleAvail('${kineId}','${ds}','${slot.id}','${status}')">${labels[status]||'—'}</button></td>`;
                }).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="cal-legend" style="margin-top:16px">
        <div class="legend-item"><div class="legend-dot available"></div>Disponible (toca para cambiar a no disponible)</div>
        <div class="legend-item"><div class="legend-dot unavailable"></div>No disponible (toca para marcar como disponible)</div>
        <div class="legend-item"><div class="legend-dot booked"></div>Agendado — no editable</div>
      </div>
    </div>`;
}

function toggleAvail(kineId, dateStr, slotId, current) {
  const existing = DB.where(DB.C.AVAILABILITY, a =>
    a.kinesiologistId===kineId && a.date===dateStr && a.timeSlotId===slotId
  )[0];
  const next = (current === 'available') ? 'unavailable' : 'available';
  if (existing) { DB.update(DB.C.AVAILABILITY, existing.id, { status: next }); }
  else          { DB.insert(DB.C.AVAILABILITY, { kinesiologistId: kineId, date: dateStr, timeSlotId: slotId, status: next }); }
  navigate('kine-availability');
}

// ─── KINE SESSIONS ────────────────────────────────────────────────────────────
function viewKineSessions() {
  const kineId = session.kinesiologistId;
  const all    = DB.where(DB.C.SESSIONS, s => s.kinesiologistId===kineId && s.status!=='cancelled')
    .sort((a,b)=>b.date.localeCompare(a.date));

  return `
    <div class="page-header"><div><h1>Mis Sesiones</h1><p>${all.length} sesiones en total</p></div></div>
    ${all.length ? all.map(s=>{
      const p    = DB.find(DB.C.PATIENTS, s.patientId);
      const slot = TIME_SLOTS.find(t=>t.id===s.timeSlotId);
      return `<div class="session-card">
        <div class="session-card-header">
          <div class="session-patient">${p?.name||'—'} <span style="font-size:12px;font-weight:400;color:var(--text-sm)">· Sesión N°${s.sessionNumber}</span></div>
          <span class="badge badge-${s.status}">${statusLabel(s.status)}</span>
        </div>
        <div class="session-meta">${fmtDate(s.date)} &nbsp;·&nbsp; ${slot?.start} – ${slot?.end}</div>
        ${p?`<div class="session-meta">${p.pathology||''} ${p.diagnosis?'— '+p.diagnosis:''}</div>`:''}
        ${s.clinicalNote?`<div class="session-note">📝 ${esc(s.clinicalNote)}</div>`:''}
        <div class="session-actions">
          ${s.status==='scheduled'?`<button class="btn btn-success btn-sm" onclick="openCompleteModal('${s.id}')">Marcar realizada + nota clínica</button>`:''}
          ${s.status==='completed'?`<button class="btn btn-primary btn-sm" onclick="openNextModal('${s.id}')">Agendar siguiente sesión</button>`:''}
          ${s.status==='scheduled'&&!s.clinicalNote?'':`${s.clinicalNote?'':`<button class="btn btn-ghost btn-sm" onclick="openNoteModal('${s.id}')">Agregar nota</button>`}`}
        </div>
      </div>`;
    }).join('') : `<div class="card"><div class="empty-state"><div class="empty-icon">📋</div><h3>Sin sesiones asignadas</h3></div></div>`}`;
}

function openCompleteModal(sessId) {
  const sess = DB.find(DB.C.SESSIONS, sessId);
  const p    = DB.find(DB.C.PATIENTS, sess.patientId);
  showModal(`
    <div class="modal-title">Registrar sesión realizada</div>
    <div style="margin-bottom:14px;padding:10px 12px;background:var(--bg);border-radius:6px;font-size:13px">
      <strong>${p?.name}</strong> &nbsp;·&nbsp; Sesión N°${sess.sessionNumber} &nbsp;·&nbsp; ${fmtDate(sess.date)}
    </div>
    <form id="complete-form">
      <div class="form-group">
        <label>Nota clínica de evolución *</label>
        <textarea name="note" required rows="5" placeholder="Describe la evolución del paciente, ejercicios realizados, observaciones clínicas...">${esc(sess.clinicalNote)}</textarea>
        <div class="text-sm" style="margin-top:5px">Campo obligatorio para registrar la sesión como realizada.</div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-success">Guardar y marcar realizada</button>
      </div>
    </form>`);
  document.getElementById('complete-form').addEventListener('submit', e => {
    e.preventDefault();
    const note = formData(e.target).note.trim();
    DB.update(DB.C.SESSIONS, sessId, { status: 'completed', clinicalNote: note, completedAt: new Date().toISOString() });
    toast('Sesión registrada como realizada.', 'success');
    closeModal();
    navigate('kine-sessions');
  });
}

function openNextModal(sessId) {
  const sess   = DB.find(DB.C.SESSIONS, sessId);
  const kineId = session.kinesiologistId;

  const available = [];
  for (let w = 0; w < 5; w++) {
    getWeekDates(addDays(getMonday(new Date()), w * 7)).forEach(d => {
      const ds = toDateStr(d);
      if (ds < today()) return;
      TIME_SLOTS.forEach(slot => {
        if (slotStatus(kineId, ds, slot.id) === 'available')
          available.push({ ds, slotId: slot.id, label: `${fmtDate(ds)} — ${slot.start} a ${slot.end}` });
      });
    });
  }

  showModal(`
    <div class="modal-title">Agendar siguiente sesión</div>
    <form id="next-form">
      <div class="form-group">
        <label>Selecciona fecha y horario *</label>
        ${!available.length
          ? `<div class="error-msg">No tienes disponibilidad cargada en las próximas semanas. Ve a <strong>Disponibilidad</strong> para agregar tus horarios primero.</div>`
          : `<select name="slot" required>
              <option value="">Selecciona un bloque disponible</option>
              ${available.map(s=>`<option value="${s.ds}|${s.slotId}">${s.label}</option>`).join('')}
            </select>`}
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        ${available.length?`<button type="submit" class="btn btn-primary">Confirmar</button>`:''}
      </div>
    </form>`);
  document.getElementById('next-form').addEventListener('submit', e => {
    e.preventDefault();
    const [ds, slotId] = formData(e.target).slot.split('|');
    DB.insert(DB.C.SESSIONS, {
      patientId: sess.patientId, kinesiologistId: kineId,
      date: ds, timeSlotId: slotId, sessionNumber: sess.sessionNumber + 1,
      status: 'scheduled', clinicalNote: '', scheduledBy: 'kinesiologo',
      createdAt: new Date().toISOString(), completedAt: null, billedAt: null,
    });
    toast('Siguiente sesión agendada.', 'success');
    closeModal();
    navigate('kine-sessions');
  });
}

function openNoteModal(sessId) {
  const sess = DB.find(DB.C.SESSIONS, sessId);
  showModal(`
    <div class="modal-title">Nota clínica</div>
    <form id="note-form">
      <div class="form-group">
        <textarea name="note" rows="5" placeholder="Evolución del paciente...">${esc(sess.clinicalNote)}</textarea>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">Guardar nota</button>
      </div>
    </form>`);
  document.getElementById('note-form').addEventListener('submit', e => {
    e.preventDefault();
    DB.update(DB.C.SESSIONS, sessId, { clinicalNote: formData(e.target).note });
    toast('Nota guardada.', 'success');
    closeModal();
    navigate('kine-sessions');
  });
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function showModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('modal-content').innerHTML = '';
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.style.opacity = '0', 3000);
  setTimeout(() => el.remove(), 3500);
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.add('hidden');
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────
function fmtCLP(n)   { return '$' + Number(n||0).toLocaleString('es-CL'); }
function fmtDate(ds) { if (!ds) return '—'; const [y,m,d] = ds.split('-'); return `${d}/${m}/${y}`; }
function fmtShort(d) { return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`; }
function toDateStr(d){ return d.toISOString().slice(0,10); }
function today()     { return toDateStr(new Date()); }
function currentMonth(){ return today().slice(0,7); }
function firstOfMonth(){ return today().slice(0,8)+'01'; }
function monthName() { return new Date().toLocaleDateString('es-CL',{month:'long',year:'numeric'}); }

function getMonday(date) {
  const d = new Date(date), day = d.getDay(), diff = day===0?-6:1-day;
  d.setDate(d.getDate()+diff); d.setHours(0,0,0,0); return d;
}
function getWeekDates(mon) { return Array.from({length:6},(_,i)=>addDays(mon,i)); }
function addDays(date, n)  { const d = new Date(date); d.setDate(d.getDate()+n); return d; }

function statusLabel(s) {
  return { scheduled:'Agendada', completed:'Realizada', cancelled:'Cancelada', billed:'Cobrada', paid:'Pagada' }[s] || s;
}

function formData(form) {
  return Object.fromEntries(new FormData(form));
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
