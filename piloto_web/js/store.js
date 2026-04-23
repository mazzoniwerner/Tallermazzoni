/* =============================================
   KineApp — Data Store (localStorage CRUD)
   ============================================= */

const Store = {
    // ── Collection keys ──
    KEYS: {
        USERS: 'kineapp_users',
        PATIENTS: 'kineapp_patients',
        KINESIOLOGISTS: 'kineapp_kinesiologists',
        AVAILABILITY: 'kineapp_availability',
        SESSIONS: 'kineapp_sessions',
        NOTES: 'kineapp_notes',
        INITIALIZED: 'kineapp_initialized'
    },

    // ══════════════════════════════════════════
    // GENERIC CRUD
    // ══════════════════════════════════════════

    _getCollection(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },

    _saveCollection(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    getAll(key) {
        return this._getCollection(key);
    },

    getById(key, id) {
        return this._getCollection(key).find(item => item.id === id) || null;
    },

    create(key, item) {
        const collection = this._getCollection(key);
        collection.push(item);
        this._saveCollection(key, collection);
        return item;
    },

    update(key, id, updates) {
        const collection = this._getCollection(key);
        const index = collection.findIndex(item => item.id === id);
        if (index === -1) return null;
        collection[index] = { ...collection[index], ...updates };
        this._saveCollection(key, collection);
        return collection[index];
    },

    delete(key, id) {
        const collection = this._getCollection(key);
        const filtered = collection.filter(item => item.id !== id);
        this._saveCollection(key, filtered);
        return filtered.length < collection.length;
    },

    query(key, filterFn) {
        return this._getCollection(key).filter(filterFn);
    },

    // ══════════════════════════════════════════
    // PATIENTS
    // ══════════════════════════════════════════

    getPatients() {
        return this.getAll(this.KEYS.PATIENTS).filter(p => p.activo !== false);
    },

    getAllPatients() {
        return this.getAll(this.KEYS.PATIENTS);
    },

    getPatient(id) {
        return this.getById(this.KEYS.PATIENTS, id);
    },

    createPatient(data) {
        const patient = {
            id: Utils.generateId('pac'),
            activo: true,
            fechaCreacion: Utils.now(),
            ...data
        };
        return this.create(this.KEYS.PATIENTS, patient);
    },

    updatePatient(id, data) {
        return this.update(this.KEYS.PATIENTS, id, data);
    },

    deletePatient(id) {
        // Soft delete
        return this.update(this.KEYS.PATIENTS, id, { activo: false });
    },

    // ══════════════════════════════════════════
    // KINESIOLOGISTS
    // ══════════════════════════════════════════

    getKinesiologists() {
        return this.getAll(this.KEYS.KINESIOLOGISTS).filter(k => k.activo !== false);
    },

    getAllKinesiologists() {
        return this.getAll(this.KEYS.KINESIOLOGISTS);
    },

    getKinesiologist(id) {
        return this.getById(this.KEYS.KINESIOLOGISTS, id);
    },

    createKinesiologist(data) {
        const kinesio = {
            id: Utils.generateId('kin'),
            activo: true,
            fechaCreacion: Utils.now(),
            ...data
        };
        // Also create a user account
        this.createUser({
            usuario: data.usuario,
            password: data.password || '1234',
            rol: 'kinesiologo',
            kinesioId: kinesio.id,
            nombre: data.nombre
        });
        return this.create(this.KEYS.KINESIOLOGISTS, kinesio);
    },

    updateKinesiologist(id, data) {
        return this.update(this.KEYS.KINESIOLOGISTS, id, data);
    },

    deleteKinesiologist(id) {
        return this.update(this.KEYS.KINESIOLOGISTS, id, { activo: false });
    },

    // ══════════════════════════════════════════
    // USERS (Authentication)
    // ══════════════════════════════════════════

    getUsers() {
        return this.getAll(this.KEYS.USERS);
    },

    createUser(data) {
        const existingUsers = this.getUsers();
        const exists = existingUsers.find(u => u.usuario === data.usuario);
        if (exists) return exists;
        const user = {
            id: Utils.generateId('usr'),
            ...data
        };
        return this.create(this.KEYS.USERS, user);
    },

    findUser(usuario, password) {
        return this.getUsers().find(u => u.usuario === usuario && u.password === password) || null;
    },

    // ══════════════════════════════════════════
    // AVAILABILITY
    // ══════════════════════════════════════════

    getAvailability(kinesioId, weekMonday) {
        return this.query(this.KEYS.AVAILABILITY, a =>
            a.kinesioId === kinesioId && a.semana === weekMonday
        )[0] || null;
    },

    getAllAvailabilityForWeek(weekMonday) {
        return this.query(this.KEYS.AVAILABILITY, a => a.semana === weekMonday);
    },

    setAvailability(kinesioId, weekMonday, bloques) {
        const existing = this.getAvailability(kinesioId, weekMonday);
        if (existing) {
            return this.update(this.KEYS.AVAILABILITY, existing.id, { bloques });
        }
        return this.create(this.KEYS.AVAILABILITY, {
            id: Utils.generateId('disp'),
            kinesioId,
            semana: weekMonday,
            bloques
        });
    },

    // ══════════════════════════════════════════
    // SESSIONS
    // ══════════════════════════════════════════

    getSessions() {
        return this.getAll(this.KEYS.SESSIONS);
    },

    getSession(id) {
        return this.getById(this.KEYS.SESSIONS, id);
    },

    getSessionsByDate(fecha) {
        return this.query(this.KEYS.SESSIONS, s => s.fecha === fecha);
    },

    getSessionsByKinesio(kinesioId) {
        return this.query(this.KEYS.SESSIONS, s => s.kinesioId === kinesioId);
    },

    getSessionsByPatient(pacienteId) {
        return this.query(this.KEYS.SESSIONS, s => s.pacienteId === pacienteId);
    },

    getSessionsByDateRange(startDate, endDate) {
        return this.query(this.KEYS.SESSIONS, s =>
            s.fecha >= startDate && s.fecha <= endDate
        );
    },

    getSessionForSlot(kinesioId, fecha, bloque) {
        return this.query(this.KEYS.SESSIONS, s =>
            s.kinesioId === kinesioId &&
            s.fecha === fecha &&
            s.bloque === bloque &&
            s.estado !== 'cancelada'
        )[0] || null;
    },

    createSession(data) {
        const session = {
            id: Utils.generateId('ses'),
            estado: 'agendada',
            estadoCobro: 'pendiente',
            estadoPago: 'pendiente',
            notaClinica: null,
            fechaCreacion: Utils.now(),
            ...data
        };
        return this.create(this.KEYS.SESSIONS, session);
    },

    updateSession(id, data) {
        return this.update(this.KEYS.SESSIONS, id, data);
    },

    deleteSession(id) {
        return this.update(this.KEYS.SESSIONS, id, { estado: 'cancelada' });
    },

    // ══════════════════════════════════════════
    // CLINICAL NOTES
    // ══════════════════════════════════════════

    getNotes() {
        return this.getAll(this.KEYS.NOTES);
    },

    getNotesBySession(sesionId) {
        return this.query(this.KEYS.NOTES, n => n.sesionId === sesionId)[0] || null;
    },

    getNotesByPatient(pacienteId) {
        return this.query(this.KEYS.NOTES, n => n.pacienteId === pacienteId)
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    },

    createNote(data) {
        const note = {
            id: Utils.generateId('nota'),
            fecha: Utils.now(),
            ...data
        };
        return this.create(this.KEYS.NOTES, note);
    },

    // ══════════════════════════════════════════
    // DASHBOARD STATS
    // ══════════════════════════════════════════

    getDashboardStats() {
        const today = Utils.today();
        const sessions = this.getSessions();
        const todaySessions = sessions.filter(s => s.fecha === today && s.estado !== 'cancelada');
        const pendingNotes = sessions.filter(s => s.estado === 'realizada' && !s.notaClinica);
        const pendingBilling = sessions.filter(s => s.estado === 'realizada' && s.estadoCobro === 'pendiente');
        const activePatients = this.getPatients().length;
        const activeKinesios = this.getKinesiologists().length;

        return {
            todaySessions: todaySessions.length,
            totalSessions: sessions.filter(s => s.estado !== 'cancelada').length,
            pendingNotes: pendingNotes.length,
            pendingBilling: pendingBilling.length,
            activePatients,
            activeKinesios
        };
    },

    // ══════════════════════════════════════════
    // INITIALIZATION WITH DEMO DATA
    // ══════════════════════════════════════════

    isInitialized() {
        return localStorage.getItem(this.KEYS.INITIALIZED) === 'true';
    },

    initialize() {
        if (this.isInitialized()) return;

        // Create admin user
        this.createUser({
            usuario: 'admin',
            password: 'admin',
            rol: 'admin',
            nombre: 'Lucas Mazzoni Werner'
        });

        // Create demo kinesiologists
        const kinesiologists = [
            {
                nombre: 'Pedro Soto',
                rut: '15.678.901-2',
                telefono: '+56 9 8765 4321',
                email: 'pedro.soto@email.com',
                especialidad: ['traumatología', 'deportiva'],
                valorHonorario: 15000,
                usuario: 'psoto',
                password: '1234'
            },
            {
                nombre: 'Carolina Muñoz',
                rut: '16.789.012-3',
                telefono: '+56 9 7654 3210',
                email: 'carolina.munoz@email.com',
                especialidad: ['neurológica', 'geriátrica'],
                valorHonorario: 15000,
                usuario: 'cmunoz',
                password: '1234'
            },
            {
                nombre: 'Andrés Rojas',
                rut: '17.890.123-4',
                telefono: '+56 9 6543 2109',
                email: 'andres.rojas@email.com',
                especialidad: ['respiratoria', 'pediátrica'],
                valorHonorario: 16000,
                usuario: 'arojas',
                password: '1234'
            },
            {
                nombre: 'Valentina Torres',
                rut: '18.901.234-5',
                telefono: '+56 9 5432 1098',
                email: 'valentina.torres@email.com',
                especialidad: ['traumatología', 'rehabilitación'],
                valorHonorario: 15000,
                usuario: 'vtorres',
                password: '1234'
            }
        ];

        const kinesioIds = [];
        kinesiologists.forEach(k => {
            const created = this.createKinesiologist(k);
            kinesioIds.push(created.id);
        });

        // Create demo patients
        const patients = [
            {
                nombre: 'María González',
                rut: '12.345.678-9',
                telefono: '+56 9 1234 5678',
                direccion: 'Av. Providencia 1234, Depto 501',
                comuna: 'Providencia',
                patologia: 'Tendinitis del manguito rotador',
                diagnostico: 'Rehabilitación post-quirúrgica hombro derecho',
                valorSesion: 25000,
                periodoCobro: 'mensual',
                fechaInicio: '2026-03-15',
                kinesioAsignado: kinesioIds[0]
            },
            {
                nombre: 'Jorge Martínez',
                rut: '11.234.567-8',
                telefono: '+56 9 2345 6789',
                direccion: 'Los Leones 456, Piso 3',
                comuna: 'Providencia',
                patologia: 'Lumbalgia crónica',
                diagnostico: 'Tratamiento conservador dolor lumbar',
                valorSesion: 25000,
                periodoCobro: 'quincenal',
                fechaInicio: '2026-03-20',
                kinesioAsignado: kinesioIds[0]
            },
            {
                nombre: 'Rosa Fernández',
                rut: '10.123.456-7',
                telefono: '+56 9 3456 7890',
                direccion: 'Manuel Montt 789',
                comuna: 'Ñuñoa',
                patologia: 'ACV isquémico',
                diagnostico: 'Rehabilitación neurológica post-ACV',
                valorSesion: 30000,
                periodoCobro: 'mensual',
                fechaInicio: '2026-02-01',
                kinesioAsignado: kinesioIds[1]
            },
            {
                nombre: 'Carlos Ramírez',
                rut: '14.567.890-1',
                telefono: '+56 9 4567 8901',
                direccion: 'Irarrázaval 2345',
                comuna: 'Ñuñoa',
                patologia: 'EPOC',
                diagnostico: 'Kinesioterapia respiratoria',
                valorSesion: 28000,
                periodoCobro: 'mensual',
                fechaInicio: '2026-04-01',
                kinesioAsignado: kinesioIds[2]
            },
            {
                nombre: 'Ana López',
                rut: '13.456.789-0',
                telefono: '+56 9 5678 9012',
                direccion: 'Vitacura 5678',
                comuna: 'Vitacura',
                patologia: 'Fractura de fémur',
                diagnostico: 'Rehabilitación post-fractura EEII',
                valorSesion: 25000,
                periodoCobro: 'quincenal',
                fechaInicio: '2026-04-05',
                kinesioAsignado: kinesioIds[3]
            }
        ];

        const patientIds = [];
        patients.forEach(p => {
            const created = this.createPatient(p);
            patientIds.push(created.id);
        });

        // Create demo availability for current week
        const currentMonday = Utils.getMonday(Utils.today());
        kinesioIds.forEach((kId, index) => {
            const bloques = {};
            Utils.DAY_KEYS.forEach(day => {
                // Each kinesio available at different times
                const available = Utils.TIME_BLOCKS
                    .filter((_, i) => (i + index) % 3 !== 0) // Vary availability
                    .map(b => b.start);
                bloques[day] = available;
            });
            this.setAvailability(kId, currentMonday, bloques);
        });

        // Create demo sessions for current week
        const weekDates = Utils.getWeekDates(currentMonday);

        // Session 1: María with Pedro — Monday 08:00
        this.createSession({
            pacienteId: patientIds[0],
            kinesioId: kinesioIds[0],
            fecha: weekDates[0],
            bloque: '08:00-08:45',
            esPrimeraSesion: false,
            agendadaPor: 'admin'
        });

        // Session 2: Jorge with Pedro — Monday 10:30
        this.createSession({
            pacienteId: patientIds[1],
            kinesioId: kinesioIds[0],
            fecha: weekDates[0],
            bloque: '10:30-11:15',
            esPrimeraSesion: false,
            agendadaPor: 'admin'
        });

        // Session 3: Rosa with Carolina — Tuesday 09:15
        this.createSession({
            pacienteId: patientIds[2],
            kinesioId: kinesioIds[1],
            fecha: weekDates[1],
            bloque: '09:15-10:00',
            esPrimeraSesion: false,
            agendadaPor: 'admin'
        });

        // Session 4: Carlos with Andrés — Wednesday 14:00
        this.createSession({
            pacienteId: patientIds[3],
            kinesioId: kinesioIds[2],
            fecha: weekDates[2],
            bloque: '14:00-14:45',
            esPrimeraSesion: true,
            agendadaPor: 'admin'
        });

        // Session 5: Ana with Valentina — Thursday 08:00
        this.createSession({
            pacienteId: patientIds[4],
            kinesioId: kinesioIds[3],
            fecha: weekDates[3],
            bloque: '08:00-08:45',
            esPrimeraSesion: true,
            agendadaPor: 'admin'
        });

        // Create a completed session with clinical note
        const completedSession = this.createSession({
            pacienteId: patientIds[0],
            kinesioId: kinesioIds[0],
            fecha: Utils.addWeeks(currentMonday, -1).split('T')[0] || weekDates[0],
            bloque: '08:00-08:45',
            esPrimeraSesion: false,
            estado: 'realizada',
            agendadaPor: 'admin'
        });

        this.createNote({
            sesionId: completedSession.id,
            kinesioId: kinesioIds[0],
            pacienteId: patientIds[0],
            evolucion: 'Paciente presenta mejoría notable en rango de movimiento del hombro derecho. Flexión activa alcanza 140° (anterior: 120°). Dolor EVA 3/10 (anterior: 5/10).',
            observaciones: 'Continuar ejercicios de movilidad activa en domicilio. Añadir banda elástica de resistencia leve. Próxima sesión enfocada en fortalecimiento.'
        });

        this.updateSession(completedSession.id, { notaClinica: true });

        localStorage.setItem(this.KEYS.INITIALIZED, 'true');
        console.log('✅ KineApp initialized with demo data');
    },

    // ── Reset all data ──
    reset() {
        Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
        console.log('🗑️ KineApp data cleared');
    }
};
