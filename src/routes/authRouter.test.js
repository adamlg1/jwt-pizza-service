const request = require('supertest');
const app = require('../service');

//tried changing db password to get this to work...

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;
let userId;


if (process.env.VSCODE_INSPECTOR_OPTIONS) {
  jest.setTimeout(60 * 1000 * 5); // 5 minutes
}

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserAuthToken = registerRes.body.token;
  userId = registerRes.body.user.id;
});

test('login', async () => {
  const loginRes = await request(app).put('/api/auth').send(testUser);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
  //modified to get lint to stop being so annoying
  // const { password, ...user } = { ...testUser, roles: [{ role: 'diner' }] };
  const user = {
    email: testUser.email,
    roles: [{ role: 'diner' }]
  };

  expect(loginRes.body.user).toMatchObject(user);
});

test('logout', async () => {
  const newUser = { name: 'lauri', email: 'gojazz@test.com', password: 'suomi' };
  const registerRes = await request(app).post('/api/auth').send(newUser).expect(200);
  // expect(registerRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
  let lauriAuthToken = registerRes.body.token;
  const logoutRes = await request(app)
    .delete('/api/auth')
    .set('Authorization', `Bearer ${lauriAuthToken}`)
    .expect(200);

  expect(logoutRes.body.message).toBe('logout successful');
  // for lint purposes we will remove this
  // const protectedRes = await request(app).get('/api/auth/protected-endpoint')
  //   .set('Authorization', `Bearer ${lauriAuthToken}`).expect(404);

});

test('update user', async () => {
  const updateUserRes = await request(app)
    .put('/api/auth/' + userId)
    .set('Authorization', `Bearer ${testUserAuthToken}`)
    .send({ email: 'plzchangemyemail@gojazz.click', password: 'plznewpassword' });
  expect(updateUserRes.status).toBe(200);
});



