// __tests__/source.test.ts
import Source from '../src/source';

describe('Source Class', () => {
    it('should successfully retrieve server info', async () => {
        const source = new Source('91.216.250.10', 27015);
        const info = await source.getInfo();
        expect(info).toBeDefined();
    }, 10000);

    it('should successfully retrieve player information', async () => {
        const source = new Source('91.216.250.10', 27015);
        const players = await source.getPlayers();
        expect(players).toBeDefined();
        expect(Array.isArray(players)).toBe(true);
    }, 10000);

    it('should successfully retrieve server rules', async () => {
        const source = new Source('91.216.250.10', 27015);
        const rules = await source.getRules();
        expect(rules).toBeDefined();
        expect(typeof rules).toBe('object');
    }, 10000);

    it('should successfully retrieve server info (Obsolete Response - Mod)', async () => {
        const source = new Source('182.92.213.179', 27015, 5000, true);
        const info = await source.getInfo();
        expect(info).toBeDefined();
    }, 10000);

    it('should successfully retrieve player information (The Ship additional player info)', async () => {
        const source = new Source('97.84.113.22', 27015, 5000, true);
        const players = await source.getPlayers();
        expect(players).toBeDefined();
        expect(Array.isArray(players)).toBe(true);
        if (players.length > 0) {
            expect(players[0].deaths).toBeDefined();
            expect(players[0].money).toBeDefined();
        }
    }, 10000);

    it('should successfully retrieve server rules (Bz2 Compression)', async () => {
        const source = new Source('46.174.54.71', 27015, 5000, true);
        const rules = await source.getRules();
        expect(rules).toBeDefined();
        expect(typeof rules).toBe('object');
    }, 10000);

    it('should successfully retrieve server rules (GoldSource Packet)', async () => {
        const source = new Source('182.92.213.179', 27015, 5000, true);
        const rules = await source.getRules();
        expect(rules).toBeDefined();
        expect(typeof rules).toBe('object');
    }, 10000);

    it('should throw error on timeout', async () => {
        const source = new Source('1.1.1.1', 27015, 2000, true);
        return expect(source.getRules()).rejects.toThrow('Request timed out');
    }, 10000);
});