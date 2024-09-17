const request = require('supertest');
const app = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
  jest.setTimeout(60 * 1000 * 5); // 5 minutes
}

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserAuthToken = registerRes.body.token;
});

test('login', async () => {
  const loginRes = await request(app).put('/api/auth').send(testUser);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);

  const { password, ...user } = { ...testUser, roles: [{ role: 'diner' }] };
  expect(loginRes.body.user).toMatchObject(user);
});

test('logout', async () => {
  const newUser = { name: 'lauri', email: 'gojazz@test.com', password: 'suomi' };
  const registerRes = await request(app).post('/api/auth').send(newUser).expect(200);
  // expect(registerRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
  lauriAuthToken = registerRes.body.token;
  const logoutRes = await request(app)
    .delete('/api/auth')
    .set('Authorization', `Bearer ${lauriAuthToken}`)
    .expect(200);

  expect(logoutRes.body.message).toBe('logout successful');

  const protectedRes = await request(app).get('/api/auth/protected-endpoint')
    .set('Authorization', `Bearer ${lauriAuthToken}`).expect(404);

});
