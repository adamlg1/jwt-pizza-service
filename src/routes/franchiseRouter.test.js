const request = require('supertest');
const app = require('../service');
const franchiseRouter = require('./franchiseRouter');
const { DB } = require('../database/database.js');
const { Role } = require('../model/model.js');
const authRouter = require('./authRouter');

//todo: make login function

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

async function createFranchise(user) {
    const loginRes = await request(app).put('/api/auth').send(user);

    const authToken = loginRes.body.token;
    const franchiseName = randomName();

    const franchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${authToken}`)
        .send({
            name: franchiseName,
            admins: [{ email: user.email }],
        });

    return {
        authToken,
        franchiseRes
    }

}

test('Delete Franchise', async () => {
    testUser = await createAdminUser();
    const { authToken, franchiseRes } = await createFranchise(testUser);
    const franchiseID = franchiseRes.body.id;

    let franchise = await DB.getFranchise({ id: franchiseID });
    console.log(franchise);

    expect(franchise.admins).not.toHaveLength(0);


    const deleteRes = await request(app)
        .delete(`/api/franchise/${franchiseID}`)
        .set('Authorization', `Bearer ${authToken}`);

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body).toHaveProperty('message', 'franchise deleted');

    const deletedFranchise = await DB.getFranchise(franchise);
    expect(deletedFranchise).toEqual({
        id: franchiseID,
        admins: [],
        stores: []
    });
    //don't check for toBeNull because of how getFranchise returns
});


test('Get frachises', async () => {
    testUser = await createAdminUser();
    const { authToken, franchiseRes } = await createFranchise(testUser);
    await createFranchise(testUser);
    await createFranchise(testUser);
    const franchiseID = franchiseRes.body.id;

    const getResponse = await request(app)
        .get(`/api/franchise/${testUser.id}`).set('Authorization', `Bearer ${authToken}`).expect(200);
    let userFranchises = getResponse.body;
    expect(userFranchises).not.toBe(null);
    expect(Array.isArray(userFranchises)).toBe(true);

});

test('create store', async () => {
    const { authToken, franchiseId, storeId, storeRes, storeName } = await createStore();

    expect(storeRes.statusCode).toBe(200);
    expect(storeRes.body).toHaveProperty('id');
    expect(storeRes.body).toHaveProperty('name', storeName);
    expect(storeRes.body).toHaveProperty('franchiseId', franchiseId);

});

async function createStore() {
    let newUser = await createAdminUser();
    const loginRes = await request(app).put('/api/auth').send(newUser);

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

    return {
        authToken,
        franchiseId,
        storeId: storeRes.body.id,
        storeRes,
        storeName
    };
}

test('delete store', async () => {
    const { authToken, franchiseId, storeId } = await createStore();
    const deleteRes = await request(app)
        .delete(`/api/franchise/${franchiseId}/store/${storeId}`)
        .set('Authorization', `Bearer ${authToken}`);

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body).toHaveProperty('message', 'store deleted');
});








