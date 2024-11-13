/* eslint-disable import/no-unresolved */
import { sleep, check, group, fail } from 'k6';
import http from 'k6/http';

const BASE_URL = 'https://pizza.gojazz.click';
const PIZZA_SERVICE_URL = 'https://pizza-service.gojazz.click';
const HEADERS = {
    accept: '*/*',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/json',
    dnt: '1',
    origin: BASE_URL,
    'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
};

export const options = {
    cloud: {
        distribution: { 'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 } },
        apm: [],
    },
    thresholds: {},
    scenarios: {
        Imported_HAR: {
            executor: 'ramping-vus',
            gracefulStop: '30s',
            stages: [
                { target: 20, duration: '1m' },
                { target: 20, duration: '3m30s' },
                { target: 0, duration: '1m' },
            ],
            gracefulRampDown: '30s',
            exec: 'imported_HAR',
        },
    },
};

export function imported_HAR() {
    let response;
    let jwtToken; // Variable to store JWT token

    group('page_1 - Homepage', function () {
        response = http.get(BASE_URL, { headers: HEADERS });
        check(response, { 'Homepage status is 200': (r) => r.status === 200 });
        sleep(11.8);
    });

    group('Login', function () {
        response = http.put(
            `${PIZZA_SERVICE_URL}/api/auth`,
            '{"email":"j@jwt.com","password":"j"}',
            { headers: HEADERS }
        );
        if (!check(response, { 'Login status is 200': (r) => r.status === 200 })) {
            console.log(response.body);
            fail('Login was *not* successful');
        }

        // Extract JWT token from login response
        jwtToken = response.json().jwt; // Assuming the JWT token is in the 'jwt' field of the response
        if (!jwtToken) {
            fail('JWT token not found in the login response');
        }
        sleep(14.3);
    });

    group('Order Pizza', function () {
        response = http.get(`${PIZZA_SERVICE_URL}/api/order/menu`, { headers: HEADERS });
        if (!check(response, { 'Order menu status is 200': (r) => r.status === 200 })) {
            console.log(response.body);
            fail('Order menu request was *not* successful');
        }
        sleep(12.5);
    });

    group('Send to Franchise', function () {
        response = http.get(`${PIZZA_SERVICE_URL}/api/franchise`, { headers: HEADERS });
        sleep(12.5);
    });

    group('Show Order Screen', function () {
        response = http.post(
            `${PIZZA_SERVICE_URL}/api/order`,
            '{"items":[{"menuId":1,"description":"Veggie","price":0.0038},{"menuId":1,"description":"Veggie","price":0.0038},{"menuId":1,"description":"Veggie","price":0.0038},{"menuId":2,"description":"Pepperoni","price":0.0042},{"menuId":3,"description":"Margarita","price":0.0042},{"menuId":5,"description":"Charred Leopard","price":0.0099}],"storeId":"1","franchiseId":1}',
            { headers: HEADERS }
        );
        sleep(2.3);
    });

    group('Verify Order', function () {
        // Use the JWT token from the login step for the order verification
        response = http.post(
            'https://pizza-factory.cs329.click/api/order/verify',
            JSON.stringify({ jwt: jwtToken }), // Pass the JWT token in the body of the request
            { headers: HEADERS }
        );
        if (!check(response, { 'Verify order status is 200': (r) => r.status === 200 })) {
            console.log(response.body);
            fail('Order verification was *not* successful');
        }
    });
}