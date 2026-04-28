const TIME_SLOTS = [
  { id: 'ts1', start: '08:00', end: '08:45' },
  { id: 'ts2', start: '09:15', end: '10:00' },
  { id: 'ts3', start: '10:30', end: '11:15' },
  { id: 'ts4', start: '11:45', end: '12:30' },
  { id: 'ts5', start: '14:00', end: '14:45' },
  { id: 'ts6', start: '15:15', end: '16:00' },
  { id: 'ts7', start: '16:30', end: '17:15' },
  { id: 'ts8', start: '17:45', end: '18:30' },
];

const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const SEED_USERS = [
  { id: 'u1', name: 'Lucas Mazzoni Werner', username: 'lucas', password: 'admin123', role: 'admin', kinesiologistId: null },
  { id: 'u2', name: 'María González',       username: 'maria',  password: 'kine123',  role: 'kinesiologo', kinesiologistId: 'k1' },
  { id: 'u3', name: 'Carlos Rodríguez',     username: 'carlos', password: 'kine123',  role: 'kinesiologo', kinesiologistId: 'k2' },
  { id: 'u4', name: 'Ana Martínez',         username: 'ana',    password: 'kine123',  role: 'kinesiologo', kinesiologistId: 'k3' },
];

const SEED_KINES = [
  { id: 'k1', userId: 'u2', name: 'María González',   rut: '12.345.678-9', phone: '+56912345678', email: 'maria@kinecare.cl',  specialty: 'Traumatología y Ortopedia',    sessionFee: 18000, active: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'k2', userId: 'u3', name: 'Carlos Rodríguez', rut: '13.456.789-0', phone: '+56923456789', email: 'carlos@kinecare.cl', specialty: 'Neurológica y Adulto Mayor',    sessionFee: 18000, active: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'k3', userId: 'u4', name: 'Ana Martínez',     rut: '14.567.890-1', phone: '+56934567890', email: 'ana@kinecare.cl',    specialty: 'Deportiva y Respiratoria',     sessionFee: 20000, active: true, createdAt: '2026-01-01T00:00:00.000Z' },
];

const SEED_PATIENTS = [
  { id: 'p1', name: 'Roberto Fernández', rut: '9.876.543-2',  phone: '+56987654321', email: 'roberto@email.cl', address: 'Av. Providencia 1234, Santiago', pathology: 'Artrosis de rodilla',      diagnosis: 'Gonalgia crónica bilateral',         medicalOrder: null, sessionPrice: 35000, billingPeriod: 'monthly', assignedKinesiologistId: 'k1', active: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'p2', name: 'Carmen López',      rut: '10.987.654-3', phone: '+56976543210', email: 'carmen@email.cl',  address: 'Los Leones 567, Providencia',    pathology: 'Lumbago crónico',          diagnosis: 'Síndrome lumbar con irradiación',    medicalOrder: null, sessionPrice: 30000, billingPeriod: 'monthly', assignedKinesiologistId: 'k1', active: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'p3', name: 'Diego Torres',      rut: '11.098.765-4', phone: '+56965432109', email: 'diego@email.cl',   address: 'Ñuñoa 890, Santiago',            pathology: 'ACV isquémico',            diagnosis: 'Hemiparesia izquierda post ACV',     medicalOrder: null, sessionPrice: 40000, billingPeriod: 'monthly', assignedKinesiologistId: 'k2', active: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'p4', name: 'Isabel Muñoz',      rut: '12.109.876-5', phone: '+56954321098', email: 'isabel@email.cl',  address: 'Las Condes 456, Santiago',       pathology: 'Lesión de manguito',       diagnosis: 'Síndrome manguito rotador derecho',  medicalOrder: null, sessionPrice: 35000, billingPeriod: 'monthly', assignedKinesiologistId: 'k3', active: true, createdAt: '2026-01-01T00:00:00.000Z' },
];
