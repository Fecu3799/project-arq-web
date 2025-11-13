
jest.mock('../src/data/store', () => ({
    loadServices: jest.fn(),
    loadSchedule: jest.fn(),
    loadAppointments: jest.fn()
}));

const store = require('../src/data/store');
const { getDayAvailability } = require('../src/services/availability.service');


describe('Availability Service - GET /api/v1/availability', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });


    test('Día laboral, sin excepciones -> slots LIBRE/OCUPADO', async () => {
        
        // Seteamos un servicio de 30 minutos
        store.loadServices.mockResolvedValue([
            { id: 1, name: 'Corte de barba', duration_min: 30, price: 15000, active: true }
        ]);

        // Seteamos el schedule en un dia laboral, sin  excepciones
        store.loadSchedule.mockResolvedValue({
            workdays: ['LUN', 'MAR', 'MIE', 'JUE', 'VIE'],
            start_time: '09:00',
            end_time: '10:00',
            exceptions: []
        });

        // Seteamos un turno reservado de 09:30 a 10:00
        store.loadAppointments.mockResolvedValue([
            { status: 'confirmed', start: '12-11-26 09:30', end: '12-11-26 10:00' }
        ]);

        // Ejecutamos la funcion
        const out = await getDayAvailability({
            date: '12-11-26',
            service_id: 1
        });

        console.log('out =>', out);

        // Esperable
        expect(out).toEqual([
            { time: '12-11-26 09:00', status: 'DISPONIBLE' },
            { time: '12-11-26 09:30', status: 'OCUPADO' }
        ]);
    });

    test('Día no laborable -> []', async () => {
        store.loadServices.mockResolvedValue([
            { id: 1, name: 'Corte de pelo', duration_min: 30, price: 15000, active: true }
        ]);

        store.loadSchedule.mockResolvedValue({
            workdays: ['LUN', 'MAR', 'MIE', 'JUE', 'VIE'],
            start_time: '09:00',
            end_time: '10:00',
            exceptions: []
        });

        store.loadAppointments.mockResolvedValue([]);

        // 15-11-26 (sabado)
        const out = await getDayAvailability( {
            date: '15-11-26',
            service_id: 1
        });

        console.log('out =>', out);

        expect(out).toEqual([]);
    });

    test('Día en excepciones -> []', async () => {
        store.loadServices.mockResolvedValue([
            { id: 1, name: 'Corte de pelo', duration_min: 60, price: 15000, active: true }
        ]);

        store.loadSchedule.mockResolvedValue({
            workdays: ['LUN', 'MAR', 'MIE', 'JUE', 'VIE'],
            start_time: '09:00',
            end_time: '10:00',
            exceptions: ['01-01-26']
        });

        store.loadAppointments.mockResolvedValue([]);

        // 15-11-25 (sabado)
        const out = await getDayAvailability( {
            date: '01-01-26',
            service_id: 1
        });

        console.log('out =>', out);

        expect(out).toEqual([]);
    });

    test('Duración no entra en la franja -> []', async () => {
        store.loadServices.mockResolvedValue([
            { id: 3, name: 'Corte de pelo + barba', duration_min: 90, active: true}
        ]);

        store.loadSchedule.mockResolvedValue({
            workdays: ['LUN', 'MAR', 'MIE', 'JUE', 'VIE'],
            start_time: '19:00',
            end_time: '20:00',
            exceptions: []
        });

        store.loadAppointments.mockResolvedValue([]);

        const out = await getDayAvailability({
            date: '12-11-26',
            service_id: 3
        });

        expect(out).toEqual([]);
    })
});
