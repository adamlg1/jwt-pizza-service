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

test('delete improper auth', async () => {
    const { franchiseId, storeId } = await createStore();

    const deleteRes = await request(app)
        .delete(`/api/franchise/${franchiseId}/store/${storeId}`)
        .set('Authorization', `Bearer Please don't accept, fakeToken`);

    expect(deleteRes.statusCode).not.toBe(200);

});

test('create franchise improper auth :/', async () => {
    const franchiseName = randomName();

    const createRes = await request(app).post('/api/franchise')
        .set('Authorization', `Bearer fake token lolz`)
        .send({
            name: franchiseName,
            admins: [{ email: user.email }]
        });

    expect(createRes.statusCode).not.toBe(200);
    expect(createRes.body).toHaveProperty('message', 'unauthorized');

});


async function loginUser(user) {
    const loginRes = await request(app).put('/api/auth').send(user);

    const authToken = loginRes.body.token;
    return authToken;
}

test(('admin add menu item'), async () => {
    const newPizza = {
        title: randomName(),
        description: randomName(),
        price: Math.random(),
        image: randomName()
    };
    let adminUser = await createAdminUser();
    const authToken = await loginUser(adminUser);

    const addNewItemRes = await request(app)
        .put('/api/order/menu')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newPizza);
    // console.log(addNewItemRes);
    expect(addNewItemRes.statusCode).toBe(200);

});

test('create order test', async () => {
    // let adminUser = user;
    // let authToken = await loginUser(adminUser);
    const loginRes = await request(app).put('/api/auth').send(user);

    const authToken = loginRes.body.token;
    const franchiseName = randomName();

    const franchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${authToken}`)
        .send({
            name: franchiseName,
            admins: [{ email: user.email }],
        });
    const franchiseId = franchiseRes.body.id;
    const storeName = randomName();
    const storeRes = await request(app)
        .post(`/api/franchise/${franchiseId}/store`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: storeName });

    const storeId = storeRes.body.id;
    // dinerId: adminUser.id,
    const order = {
        franchiseId: franchiseId,
        storeId: storeId,
        items: [
            {
                menuId: 1,
                description: randomName(),
                price: Math.random(),
            }
        ]
    }

    const orderRes = await request(app)
        .post('/api/order')
        .set('Authorization', `Bearer ${authToken}`)
        .send(order);

    // console.log(orderRes);
    expect(orderRes.status).toBe(200);
});


// test('create order test', async () => {
//     // Step 1: Create an admin user and log them in
//     let adminUser = await createAdminUser();
//     let authToken = await loginUser(adminUser);

//     // Step 2: Create a franchise for the admin user
//     const { franchiseRes } = await createFranchise(adminUser);
//     const franchiseId = franchiseRes.body.id;

//     // Step 3: Create a store under the created franchise
//     const { storeId } = await createStore(franchiseId, authToken);

//     // Step 4: Add a menu item to the store
//     const menuItem = {
//         title: randomName(),
//         description: randomName(),
//         price: Math.random() * 100,
//     };

//     const addMenuItemRes = await request(app)
//         .put('/api/order/menu')
//         .set('Authorization', `Bearer ${authToken}`)
//         .send(menuItem);

//     const menuId = addMenuItemRes.body.id;

//     const order = {
//         franchiseId: franchiseId,
//         storeId: storeId,
//         items: [
//             {
//                 menuId: menuId,  // Use the correct menuId from the response
//                 description: menuItem.description,
//                 price: menuItem.price,
//             }
//         ]
//     };

//     const orderRes = await request(app)
//         .post('/api/order')
//         .set('Authorization', `Bearer ${authToken}`)
//         .send(order);

//     console.log(orderRes.body);

// \    expect(orderRes.status).toBe(200);
//     expect(orderRes.body).toHaveProperty('orderId'); // Ensure the response includes the generated orderId
//     expect(orderRes.body.items).toHaveLength(1);     // Ensure the order has 1 item
//     expect(orderRes.body.items[0]).toHaveProperty('menuId', menuId); // Ensure menuId matches
// });
