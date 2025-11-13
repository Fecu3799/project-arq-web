const request = require('supertest');
const moment = require('moment');

jest.mock('../../src/data/store', () => {
    const state = {
        services: [],
        appointments: [],
        schedule: [],
        users: [],
    };

    return {
        __setState(next = {}) {
            if (next.services) state.services = JSON.parse(JSON.stringify(next.services));
            if (next.appointments) state.appointments = JSON.parse(JSON.stringify(next.appointments));
            if (next.schedule) state.schedule = JSON.parse(JSON.stringify(next.schedule));
            if (next.users) state.users = JSON.parse(JSON.stringify(next.users));
        },
        loadServices: jest.fn(() => Promise.resolve(state.services)),
        saveServices: jest.fn(async (services) => {
            state.services = JSON.parse(JSON.stringify(services));
        }),
        loadAppointments: jest.fn(() => Promise.resolve(state.appointments)),
        saveAppointments: jest.fn(async (appointments) => {
            state.appointments = JSON.parse(JSON.stringify(appointments));
        }),
        loadSchedule: jest.fn(() => Promise.resolve(state.schedule)),
        loadUsers: jest.fn(() => Promise.resolve(state.users)),
    };
});

const store = require('../../src/data/store');
const { createApp } = require('../../src/server');

function nextWorkingDay() {
    const day = moment().add(1, 'day').startOf('day');
    for (let i = 0; i < 14; i++) {
        const candidate = day.clone().add(i, 'day');
        const weekday = candidate.isoWeekday(); // 1 (Mon) - 7 (Sun)
        if (weekday <= 5) {
            return candidate.format('DD-MM-YY');
        }
    }
    return day.format('DD-MM-YY');
}

describe('API integration flow', () => {
    beforeEach(() => {
        store.__setState({
            services: [
                { id: 1, name: 'Corte', duration_min: 30, price: 10000, active: true },
                { id: 2, name: 'Color', duration_min: 60, price: 20000, active: false },
            ],
            appointments: [],
            schedule: [{
                workdays: ['LUN', 'MAR', 'MIE', 'JUE', 'VIE'],
                start_time: '09:00',
                end_time: '12:00',
                slot_step_min: 30,
                exceptions: [],
            }],
            users: [
                { id: 'admin_1', email: 'admin@shop.com', password: 'secretpassword', role: 'admin', name: 'Admin' },
            ],
        });
    });

    test('Happy path completo: servicios públicos + turnos + admin', async () => {
        const app = createApp();
        const date = nextWorkingDay();

        const publicServices = await request(app).get('/api/v1/services');
        expect(publicServices.status).toBe(200);
        expect(publicServices.body).toHaveLength(1);
        expect(publicServices.body[0]).toMatchObject({ id: 1, active: true });

        const createdAppointment = await request(app)
            .post('/api/v1/appointments')
            .send({ service_id: 1, date, time: '09:00' });
        expect(createdAppointment.status).toBe(201);
        expect(createdAppointment.body).toMatchObject({
            service_id: 1,
            start: `${date} 09:00`,
            status: 'confirmed',
        });

        const cancelled = await request(app)
            .patch(`/api/v1/appointments/${createdAppointment.body.id}`)
            .send({ status: 'cancelled' });
        expect(cancelled.status).toBe(200);
        expect(cancelled.body.status).toBe('cancelled');

        const login = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'admin@shop.com', password: 'secretpassword' });
        expect(login.status).toBe(200);
        const token = login.body.token;

        const adminServices = await request(app)
            .get('/api/v1/admin/services')
            .set('Authorization', `Bearer ${token}`);
        expect(adminServices.status).toBe(200);
        expect(adminServices.body).toHaveLength(2);

        const adminAppointments = await request(app)
            .get('/api/v1/admin/appointments')
            .set('Authorization', `Bearer ${token}`);
        expect(adminAppointments.status).toBe(200);
        expect(adminAppointments.body).toHaveLength(1);
        expect(adminAppointments.body[0].status).toBe('cancelled');
    });
});
