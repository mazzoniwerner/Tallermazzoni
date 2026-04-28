# KinesioCare — Plan de Arquitectura e Implementación

## 1. Resumen del Proyecto

Webapp SPA (Single Page Application) para gestionar las operaciones de una empresa de kinesiología a domicilio en Santiago, Chile. Reemplaza la coordinación manual por WhatsApp con un sistema centralizado de agendamiento, fichas clínicas y consolidado financiero.

---

## 2. Decisiones Técnicas

| Aspecto | Decisión | Razón |
|---|---|---|
| Frontend | HTML + CSS + JavaScript vanilla | Sin servidor, abre directo desde el navegador |
| Persistencia | `localStorage` del navegador | Prototipo funcional sin backend |
| Arquitectura | SPA con router JS manual | Una sola URL, vistas dinámicas por JS |
| Estilos | CSS puro con variables | Sin dependencias externas |
| Íconos | Unicode / caracteres del sistema | Funciona offline, sin CDN |
| Fuentes | `system-ui` (fuente del sistema) | Sin descarga, rápido en móvil |

> **Nota de escalabilidad:** Si el sistema crece, la capa `DB` (db.js) está diseñada para ser reemplazada por llamadas a una API REST sin tocar el resto del código.

---

## 3. Estructura de Archivos

```
Claude/
├── index.html                  ← Shell SPA + pantalla de login
├── arquitectura.md             ← Este documento
├── arquitectura.html           ← Versión imprimible (exportar como PDF)
│
├── css/
│   └── styles.css              ← Todos los estilos (variables, layout, componentes)
│
└── js/
    ├── config.js               ← Constantes: bloques horarios, datos semilla
    ├── db.js                   ← Capa de datos (CRUD sobre localStorage)
    ├── auth.js                 ← Autenticación y sesión de usuario
    └── app.js                  ← Lógica principal, router, vistas, eventos
```

---

## 4. Modelos de Datos

### 4.1 Usuario (`kc_users`)
```json
{
  "id": "u1",
  "name": "Lucas Mazzoni Werner",
  "username": "lucas",
  "password": "admin123",
  "role": "admin | kinesiologo",
  "kinesiologistId": null
}
```

### 4.2 Paciente (`kc_patients`)
```json
{
  "id": "p1",
  "name": "Roberto Fernández",
  "rut": "9.876.543-2",
  "phone": "+56987654321",
  "email": "roberto@email.cl",
  "address": "Av. Providencia 1234, Santiago",
  "pathology": "Artrosis de rodilla",
  "diagnosis": "Gonalgia crónica bilateral",
  "medicalOrder": null,
  "sessionPrice": 35000,
  "billingPeriod": "monthly",
  "assignedKinesiologistId": "k1",
  "active": true,
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

### 4.3 Kinesiólogo (`kc_kines`)
```json
{
  "id": "k1",
  "userId": "u2",
  "name": "María González",
  "rut": "12.345.678-9",
  "phone": "+56912345678",
  "email": "maria@kinecare.cl",
  "specialty": "Traumatología y Ortopedia",
  "sessionFee": 18000,
  "active": true,
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

### 4.4 Sesión (`kc_sessions`)
```json
{
  "id": "s1",
  "patientId": "p1",
  "kinesiologistId": "k1",
  "date": "2026-04-28",
  "timeSlotId": "ts2",
  "sessionNumber": 1,
  "status": "scheduled | completed | cancelled | billed",
  "clinicalNote": "",
  "scheduledBy": "admin | kinesiologo",
  "createdAt": "2026-04-25T10:00:00.000Z",
  "completedAt": null,
  "billedAt": null
}
```

### 4.5 Disponibilidad (`kc_availability`)
```json
{
  "id": "av1",
  "kinesiologistId": "k1",
  "date": "2026-04-28",
  "timeSlotId": "ts2",
  "status": "available | unavailable"
}
```

---

## 5. Bloques Horarios Predefinidos

| ID  | Inicio | Fin   |
|-----|--------|-------|
| ts1 | 08:00  | 08:45 |
| ts2 | 09:15  | 10:00 |
| ts3 | 10:30  | 11:15 |
| ts4 | 11:45  | 12:30 |
| ts5 | 14:00  | 14:45 |
| ts6 | 15:15  | 16:00 |
| ts7 | 16:30  | 17:15 |
| ts8 | 17:45  | 18:30 |

Los intervalos entre bloques representan el tiempo de traslado del kinesiólogo.

---

## 6. Roles y Vistas

### 6.1 Rol Admin (Lucas)

| Vista | Descripción |
|---|---|
| Dashboard | Métricas: pacientes activos, sesiones del mes, ingresos estimados |
| Pacientes | CRUD completo de fichas clínicas |
| Kinesiólogos | CRUD de perfiles + credenciales de acceso |
| Calendario | Semana actual con código de colores por kinesiólogo |
| Finanzas | Consolidado de cobros a pacientes y pagos a kinesiólogos |

### 6.2 Rol Kinesiólogo

| Vista | Descripción |
|---|---|
| Dashboard | Sesiones del día y próximas sesiones |
| Disponibilidad | Grilla semanal para marcar disponibilidad |
| Mis Sesiones | Listado con estado, notas clínicas y agendamiento de siguiente sesión |

---

## 7. Lógica del Calendario

### Código de Colores por Celda (día × bloque horario)

```
Para cada celda [fecha][timeSlotId] de un kinesiólogo:

1. ¿Existe una sesión con status "scheduled" o "completed"?  → AZUL  (agendado)
2. ¿El kinesiólogo marcó ese slot como "available"?          → VERDE  (libre)
3. ¿El kinesiólogo marcó ese slot como "unavailable"?        → ROJO   (no disponible)
4. Si ninguna de las anteriores aplica                       → GRIS   (sin información)
```

### Agendamiento de Primera Sesión (Lucas)
1. Lucas filtra por kinesiólogo o ve todos.
2. Hace click en una celda VERDE.
3. Se abre modal: selecciona paciente de la lista de pacientes del kinesiólogo.
4. Confirma → la sesión se crea con `sessionNumber: 1`, `scheduledBy: "admin"`.
5. La celda pasa a AZUL.

### Agendamiento de Sesiones Subsiguientes (Kinesiólogo)
1. El kinesiólogo va a "Mis Sesiones" y selecciona una sesión completada.
2. Hace click en "Agendar siguiente sesión".
3. Elige fecha y bloque de su disponibilidad.
4. Se crea la sesión con `sessionNumber: N+1`, `scheduledBy: "kinesiologo"`.

---

## 8. Lógica Financiera

### Cobros a Pacientes
```
Filtro por rango de fechas (cualquier periodo).
Para cada paciente:
  - Listar sesiones con status "completed" en el periodo
  - Total = cantidad_sesiones × paciente.sessionPrice
  - Acción: marcar como "billed" (cobrado)
```

### Pagos a Kinesiólogos
```
Filtro por mes (pago mensual).
Para cada kinesiólogo:
  - Listar sesiones con status "completed" en el mes
  - Total = cantidad_sesiones × kinesiologo.sessionFee
  - Acción: marcar como "paid" (pagado)
```

---

## 9. Autenticación

- Login con `username` + `password` (texto plano para prototipo).
- Sesión guardada en `sessionStorage` del navegador.
- Al recargar la página, si hay sesión activa se restaura el estado.
- El router verifica el rol antes de renderizar cada vista.

---

## 10. Datos de Demo (Seed)

Al abrir por primera vez se cargan automáticamente:

| Rol | Usuario | Contraseña |
|---|---|---|
| Admin (Lucas) | `lucas` | `admin123` |
| Kinesiólogo | `maria` | `kine123` |
| Kinesiólogo | `carlos` | `kine123` |
| Kinesiólogo | `ana` | `kine123` |

Pacientes de demo: Roberto Fernández, Carmen López, Diego Torres, Isabel Muñoz.

---

## 11. Orden de Implementación

1. `config.js` — Constantes y seed data
2. `db.js` — Capa CRUD sobre localStorage
3. `auth.js` — Login / logout / sesión
4. `css/styles.css` — Diseño visual completo
5. `index.html` — Shell HTML + plantillas de vistas
6. `js/app.js` — Router + lógica de todas las vistas

---

*Proyecto: KinesioCare · Autor: Claude Sonnet 4.6 · Fecha: Abril 2026*
