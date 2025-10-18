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
const { createAppointment } = require('../src/services/appointmentsService');

describe('Appointment Service - POST /api/v1/appointment', () => {
    const SERVICE = { id: 1, name: 'Corte de pelo', duration_min: 30, active: true };
    const DATE = '12-11-25';
    const TIME = '14:30';
    const START = `${DATE} ${TIME}`;
    const END = '15:00';

    beforeEach(() => {
        jest.clearAllMocks();
    });

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