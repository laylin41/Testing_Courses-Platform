const request = require('supertest');
const API = 'http://localhost:5001';

describe('FULL INTEGRATION TESTS – Courses v1, v2 & Modules (All 4 DBs)', () => {
    let courseId;
    let moduleId;

    // COURSES v1
    describe('Courses v1 API', () => {
        it('POST /api/v1/courses → creates a course', async () => {
            const res = await request(API)
                .post('/api/v1/courses')
                .send({ title: 'C# Advanced', description: 'Deep dive' })
                .expect(201);

            expect(res.body).toHaveProperty('courseId');
            expect(res.body.courseId).toBeGreaterThan(0);
            courseId = res.body.courseId;
        });

        it('GET /api/v1/courses → returns list with total (no navigation props)', async () => {
            const res = await request(API).get('/api/v1/courses').expect(200);
            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('total');
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data[0]).toHaveProperty('id');
            expect(res.body.data[0]).toHaveProperty('title');
            expect(res.body.data[0]).not.toHaveProperty('modules');
        });

        it('GET /api/v1/courses/{id} → returns minimal course', async () => {
            const res = await request(API)
                .get(`/api/v1/courses/${courseId}`)
                .expect(200);
            expect(res.body.id).toBe(courseId);
            expect(res.body).not.toHaveProperty('modules');
        });

        it('PUT /api/v1/courses/{id} → updates course', async () => {
            await request(API)
                .put(`/api/v1/courses/${courseId}`)
                .send({ courseId, title: 'C# Updated', description: 'New desc' })
                .expect(204);
        });
    });

    // COURSES v2 – WITH NAVIGATION & VERSION FIELD
    describe('Courses v2 API', () => {
        it('GET /api/v2/courses → returns version 2.0 + generatedAt + CompletedCount', async () => {
            const res = await request(API).get('/api/v2/courses').expect(200);
            expect(res.body.version).toBe('2.0');
            expect(res.body.generatedAt).toBeDefined();
            expect(res.body.data[0]).toHaveProperty('completedCount');
            expect(res.body.data[0]).not.toHaveProperty('modules'); 
        });

        it('GET /api/v2/courses/{id} → returns FULL course with Modules → Lessons', async () => {
            const res = await request(API)
                .get(`/api/v2/courses/${courseId}`)
                .expect(200);

            expect(res.body.courseId).toBe(courseId);
            expect(Array.isArray(res.body.modules)).toBe(true);
            if (res.body.modules.length > 0) {
                expect(Array.isArray(res.body.modules[0].lessons)).toBe(true);
            }
            expect(Array.isArray(res.body.verifications)).toBe(true);
            expect(Array.isArray(res.body.certificates)).toBe(true);
        });

        it('POST /api/v2/courses → works same as v1', async () => {
            const res = await request(API)
                .post('/api/v2/courses')
                .send({ title: 'Go Lang Course', description: 'From v2' })
                .expect(201);
            expect(res.body.courseId).toBeGreaterThan(0);
        });
    });

    it('DELETE created course → cleanup', async () => {
        await request(API).delete(`/api/v1/courses/${courseId}`).expect(204);
        await request(API).get(`/api/v1/courses/${courseId}`).expect(404);
    });
});