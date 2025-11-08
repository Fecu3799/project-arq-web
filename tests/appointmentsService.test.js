const moment = require('moment');
const { getDayAvailability } = require('../src/services/availabilityService');

jest.mock('../src/data/store', () => ({
    loadServices: jest.fn(),
    loadAppointments: jest.fn(),
    saveAppointments: jest.fn()
}));

jest.mock('../src/services/availabilityService', () => ({
    getDayAvailability: jest.fn()
}));

const store = require('../src/data/store');
const availability = require('../src/services/availabilityService');
const { createAppointment, updateAppointment } = require('../src/services/appointmentsService');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('Appointment Service - POST /api/v1/appointment', () => {
    const SERVICE = { id: 1, name: 'Corte de pelo', duration_min: 30, active: true };
    const DATE = '12-11-25';
    const TIME = '14:30';
    const START = `${DATE} ${TIME}`;
    const END = '12-11-25 15:00';

    test('Happy path: crear turno con slot disponible', async () => {

        store.loadServices.mockResolvedValue([SERVICE]);
        store.loadAppointments.mockResolvedValue([]);
        store.saveAppointments.mockResolvedValue();

        // Hora disponible
        getDayAvailability.mockResolvedValue([
            {time: `${DATE} 09:00`, status: 'DISPONIBLE'},
            {time: START, status: 'DISPONIBLE'}
        ])

        const created = await createAppointment({
            service_id: 1,
            date: DATE,
            time: TIME
        });

        expect(created).toMatchObject({
            service_id: 1,
            status: 'confirmed',
            start: START,
            end: END
        });

        expect(store.saveAppointments).toHaveBeenCalledTimes(1);
        const saved = store.saveAppointments.mock.calls[0][0];
        expect(saved).toHaveLength(1);
        expect(saved[0]).toMatchObject({ start: START, end: END, status: 'confirmed' });
    });
})

describe('Appointment Service - PATCH /api/v1/appointments/:id', () => {
    test('Cancelar un turno confirmado actualiza el estado', async () => {
        const appointment = {
            id: 10,
            service_id: 1,
            start: '12-11-25 09:00',
            end: '12-11-25 09:30',
            status: 'confirmed',
            created_at: '01-01-24 10:00',
            updated_at: '01-01-24 10:00'
        };

        store.loadAppointments.mockResolvedValue([appointment]);
        store.saveAppointments.mockResolvedValue();

        const updated = await updateAppointment(10, { status: 'cancelled' });

        expect(updated.status).toBe('cancelled');
        expect(store.saveAppointments).toHaveBeenCalledTimes(1);
        const saved = store.saveAppointments.mock.calls[0][0];
        expect(saved[0]).toMatchObject({ id: 10, status: 'cancelled' });
    });

    test('Reprogramar un turno requiere slot disponible', async () => {
        const appointment = {
            id: 22,
            service_id: 1,
            start: '12-11-25 09:00',
            end: '12-11-25 09:30',
            status: 'confirmed',
            created_at: '01-01-24 10:00',
            updated_at: '01-01-24 10:00'
        };

        store.loadAppointments.mockResolvedValue([appointment]);
        store.loadServices.mockResolvedValue([
            { id: 1, name: 'Corte de pelo', duration_min: 30, active: true }
        ]);
        store.saveAppointments.mockResolvedValue();

        getDayAvailability.mockResolvedValue([
            { time: '15-11-25 10:00', status: 'DISPONIBLE' }
        ]);

        const updated = await updateAppointment(22, {
            date: '15-11-25',
            time: '10:00'
        });

        expect(updated.start).toBe('15-11-25 10:00');
        expect(updated.end).toBe('15-11-25 10:30');
        expect(getDayAvailability).toHaveBeenCalledWith({ date: '15-11-25', service_id: 1 });
        const saved = store.saveAppointments.mock.calls[0][0];
        expect(saved[0]).toMatchObject({ id: 22, start: '15-11-25 10:00' });
    });
});
