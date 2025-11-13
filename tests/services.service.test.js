jest.mock('../src/data/store', () => ({
    loadServices: jest.fn(),
    saveServices: jest.fn(),
}));

const store = require('../src/data/store');
const servicesService = require('../src/services/services.service');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('Services Service', () => {
    test('getActiveServices retorna solo activos', async () => {
        store.loadServices.mockResolvedValue([
            { id: 1, name: 'Corte', active: true },
            { id: 2, name: 'Color', active: false },
        ]);

        const active = await servicesService.getActiveServices();

        expect(active).toEqual([{ id: 1, name: 'Corte', active: true }]);
        expect(store.loadServices).toHaveBeenCalledTimes(1);
    });

    test('getActiveServiceById valida id y devuelve servicio', async () => {
        store.loadServices.mockResolvedValue([
            { id: 5, name: 'Spa', active: true },
        ]);

        const service = await servicesService.getActiveServiceById(5);

        expect(service).toMatchObject({ id: 5, name: 'Spa' });
    });

    test('getActiveServiceById lanza 404 si no existe', async () => {
        store.loadServices.mockResolvedValue([]);

        await expect(servicesService.getActiveServiceById(99))
            .rejects.toThrow('No existe el servicio con id 99');
    });

    test('createService incrementa id y normaliza payload', async () => {
        store.loadServices.mockResolvedValue([
            { id: 2, name: 'Basico', duration_min: 30, price: 10000, active: true },
        ]);
        store.saveServices.mockResolvedValue();

        const created = await servicesService.createService({
            name: '   Premium  ',
            duration_min: '45',
            price: '15000',
        });

        expect(created).toMatchObject({
            id: 3,
            name: 'Premium',
            duration_min: 45,
            price: 15000,
            active: true,
        });
        expect(store.saveServices).toHaveBeenCalledWith(expect.arrayContaining([created]));
    });

    test('createService valida nombre obligatorio', async () => {
        store.loadServices.mockResolvedValue([]);

        await expect(servicesService.createService({ name: '   ' }))
            .rejects.toThrow('El nombre no puede estar vacío');
    });

    test('updateService modifica campos permitidos', async () => {
        const current = { id: 10, name: 'Old', duration_min: 30, price: 10000, active: true };
        store.loadServices.mockResolvedValue([current]);
        store.saveServices.mockResolvedValue();

        const updated = await servicesService.updateService(10, {
            name: 'Nuevo',
            duration_min: 60,
            price: 20000,
            active: false,
        });

        expect(updated).toEqual({
            id: 10,
            name: 'Nuevo',
            duration_min: 60,
            price: 20000,
            active: false,
        });
        expect(store.saveServices).toHaveBeenCalledWith([updated]);
    });
});
