const request = require('supertest');
const app = require('../service');
const franchiseRouter = require('./franchiseRouter');
const { DB } = require('../database/database.js');
const { Role } = require('../model/model.js');
const authRouter = require('./authRouter');


function randomName() {
    return Math.random().toString(36).substring(2, 12);
}

let user;

beforeAll(async () => {
    user = await createAdminUser();
});

async function createAdminUser() {
    user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
    user.name = randomName();
    user.email = user.name + '@admin.com';

    await DB.addUser(user);

    user.password = 'toomanysecrets';
    return user;
}

test('admin create franchise', async () => {
    const loginRes = await request(app).put('/api/auth').send(user);
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
    // console.log('Login response:', loginRes.body);


    const authToken = loginRes.body.token;
    const franchiseName = randomName();

    const franchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${authToken}`)
        .send({
            name: franchiseName,
            admins: [{ email: user.email }],
        });

    expect(franchiseRes.body).toHaveProperty('name', franchiseName);
    expect(franchiseRes.body.admins).toHaveLength(1);
});

test('Get frachises', async () => {

});

test('create store', async () => {
    let newUser = await createAdminUser();
    const loginRes = await request(app).put('/api/auth').send(newUser);
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
    // console.log('Login response:', loginRes.body);


    const authToken = loginRes.body.token;
    const franchiseName = randomName();

    const franchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${authToken}`)
        .send({
            name: franchiseName,
            admins: [{ email: newUser.email }],
        });
    const franchiseId = franchiseRes.body.id;
    const storeName = randomName();
    const storeRes = await request(app)
        .post(`/api/franchise/${franchiseId}/store`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: storeName });

});




