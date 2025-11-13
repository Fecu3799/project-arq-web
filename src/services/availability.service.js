const moment = require('moment');
const store = require('../data/store');
const { makeError } = require('../utils/errors');

const SLOT_STEP_MIN = 30; // 30 minutos de paso
const WEEKDAYS = ['DOM','LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];

// Verificar dia laborable
function isWorkday(dayMoment, workdays) {
     const normalized = Array.isArray(workdays)
        ? workdays.map(w => String(w).toUpperCase().slice(0,3))
        : [];
    const code = WEEKDAYS[dayMoment.day()];
    return normalized.includes(code);
}

// Verificar dia excepción
function isException(dayMoment, exceptions) {
    const list = Array.isArray(exceptions) ? exceptions : [];
    return list.includes(dayMoment.format('DD-MM-YY'));
}

// Solapamiento de turnos
function overlaps(startA, endA, startB, endB) {
    return startA < endB && endA > startB;
}


async function getDayAvailability( { date, service_id }) {

    // VALIDACIONES
    if(!date || !service_id) {
        throw makeError(400, 'Solicitud incorrecta', 'date y service_id son requeridos');
    }

    // Parseo de fecha
    const day = moment(date, 'DD-MM-YY', true);
    if(!day.isValid()) {
        throw makeError(400, 'Formato de fecha incorrecto', 'date debe ser DD-MM-YY');
    }

    // Validación fecha no pasada
    const today = moment().startOf('day');
    if(day.isBefore(today, 'day')) {
        throw makeError(400, 'Solicitud incorrecta', 'date no puede ser una fecha pasada');
    }

    // Validación serviceId
    const serviceId = Number(service_id);
    if(!Number.isInteger(serviceId) || serviceId <= 0) {
        throw makeError(400, 'Solicitud incorrecta', 'serviceId debe ser un número entero mayor que cero');
    }

    // Carga de datos
    const [services, scheduleRaw, appointments] = await Promise.all([
        store.loadServices(),
        store.loadSchedule(),
        store.loadAppointments()
    ]);

    //console.log(appointments);

    const schedule = Array.isArray(scheduleRaw) ? (scheduleRaw[0] || {}) : (scheduleRaw || {});

    // Validación serviceId existe y está activo
    const service = (services || []).find(s => Number(s.id) === serviceId && s.active);
    if (!service) {
        throw makeError(404, 'Recurso no encontrado', `No existe el servicio con id ${serviceId}`);
    }

    const durationMin = parseInt(service.duration_min, 10) || 0;
    if(durationMin <= 0) {
        throw makeError(500, 'Error interno', `El servicio con id ${serviceId} tiene una duración inválida`);
    }

    // Schedule del día
    const workdays = schedule?.workdays || [];
    const exceptions = schedule?.exceptions || [];
    if(!isWorkday(day, workdays) || isException(day, exceptions)) {
        return []; // Día no laborable
    }

    const startHM = moment(schedule?.start_time, 'HH:mm', true);
    const endHM = moment(schedule?.end_time, 'HH:mm', true);
    if(!startHM.isValid() || !endHM.isValid() || !endHM.isAfter(startHM)) {
        throw makeError(500, 'Error interno', 'El horario de atención es inválido');
    }

    const dayStart = day.clone()
    .hour(startHM.hour())
    .minute(startHM.minute())
    .second(0)
    .millisecond(0);

    const dayEnd = day.clone()
    .hour(endHM.hour())
    .minute(endHM.minute())
    .second(0)
    .millisecond(0);



    // Turnos confirmados del día
    const RX = 'DD-MM-YY HH:mm';
    const confirmed = (appointments || [])
        .filter(a => String(a.status || '').toLowerCase() === 'confirmed')
        .map(a => {
            const s = moment(a.start, RX, true);
            const e = moment(a.end, RX, true);
            return (s.isValid() && e.isValid()) ? { start: s, end: e } : null;
        })
        .filter(Boolean);

    // Generación de slots
    const latestStart = dayEnd.clone().subtract(durationMin, 'minute');
    if(!latestStart.isSameOrAfter(dayStart)) return []; // No hay slots posibles

    const result = [];
    for (let slot = dayStart.clone(); !slot.isAfter(latestStart); slot.add(SLOT_STEP_MIN, 'minute')) {
        const slotEnd = slot.clone().add(durationMin, 'minute');
        const taken = confirmed.some(a => overlaps(slot, slotEnd, a.start, a.end));

        result.push({
            time: slot.format('DD-MM-YY HH:mm'),
            status: taken ? 'OCUPADO' : 'DISPONIBLE'
        });
    }

    return result;
}

module.exports = { getDayAvailability };