/* =============================================
   KineApp — Utility Helpers
   ============================================= */

const Utils = {
    // ── Generate unique ID ──
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    },

    // ── Format date to locale string ──
    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },

    // ── Format date as "Lunes 14 de Abril" ──
    formatDateLong(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('es-CL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    },

    // ── Get today's date as YYYY-MM-DD ──
    today() {
        return new Date().toISOString().split('T')[0];
    },

    // ── Get current datetime as ISO ──
    now() {
        return new Date().toISOString();
    },

    // ── Get Monday of the week for a given date ──
    getMonday(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diff));
        return monday.toISOString().split('T')[0];
    },

    // ── Get array of dates for the week (Mon-Fri) ──
    getWeekDates(mondayStr) {
        const monday = new Date(mondayStr + 'T00:00:00');
        const dates = [];
        for (let i = 0; i < 5; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
    },

    // ── Get day name in Spanish ──
    getDayName(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return days[date.getDay()];
    },

    // ── Get short day name ──
    getDayShort(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return days[date.getDay()];
    },

    // ── Get day of week key ──
    getDayKey(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        const keys = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        return keys[date.getDay()];
    },

    // ── Navigate weeks ──
    addWeeks(dateStr, weeks) {
        const date = new Date(dateStr + 'T00:00:00');
        date.setDate(date.getDate() + (weeks * 7));
        return date.toISOString().split('T')[0];
    },

    // ── Format month/year ──
    formatMonthYear(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
    },

    // ── Format CLP currency ──
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(amount);
    },

    // ── Validate Chilean RUT ──
    validateRut(rut) {
        if (!rut) return false;
        const cleaned = rut.replace(/[.-]/g, '');
        if (cleaned.length < 2) return false;
        const body = cleaned.slice(0, -1);
        const dv = cleaned.slice(-1).toUpperCase();
        let sum = 0;
        let mul = 2;
        for (let i = body.length - 1; i >= 0; i--) {
            sum += parseInt(body[i]) * mul;
            mul = mul === 7 ? 2 : mul + 1;
        }
        const expected = 11 - (sum % 11);
        const dvExpected = expected === 11 ? '0' : expected === 10 ? 'K' : expected.toString();
        return dv === dvExpected;
    },

    // ── Format RUT ──
    formatRut(rut) {
        if (!rut) return '';
        const cleaned = rut.replace(/[.-]/g, '');
        if (cleaned.length < 2) return cleaned;
        const body = cleaned.slice(0, -1);
        const dv = cleaned.slice(-1);
        const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `${formatted}-${dv}`;
    },

    // ── Capitalize first letter ──
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // ── Get initials from name ──
    getInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    },

    // ── Debounce function ──
    debounce(fn, delay = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    },

    // ── Escape HTML to prevent XSS ──
    escapeHtml(text) {
        if (!text) return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.replace(/[&<>"']/g, m => map[m]);
    },

    // ── Predefined time blocks ──
    TIME_BLOCKS: [
        { start: '08:00', end: '08:45', label: '08:00 - 08:45' },
        { start: '09:15', end: '10:00', label: '09:15 - 10:00' },
        { start: '10:30', end: '11:15', label: '10:30 - 11:15' },
        { start: '11:45', end: '12:30', label: '11:45 - 12:30' },
        { start: '14:00', end: '14:45', label: '14:00 - 14:45' },
        { start: '15:15', end: '16:00', label: '15:15 - 16:00' },
        { start: '16:30', end: '17:15', label: '16:30 - 17:15' },
        { start: '17:45', end: '18:30', label: '17:45 - 18:30' }
    ],

    // ── Day keys in order ──
    DAY_KEYS: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],

    DAY_LABELS: {
        lunes: 'Lunes',
        martes: 'Martes',
        miercoles: 'Miércoles',
        jueves: 'Jueves',
        viernes: 'Viernes',
        sabado: 'Sábado',
        domingo: 'Domingo'
    }
};
