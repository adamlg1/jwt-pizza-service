const config = require('./config.js');
const os = require('os');

class Metrics {
    constructor() {
        this.totalRequests = 0;
        this.requestCounts = { GET: 0, POST: 0, DELETE: 0, PUT: 0 };
        this.authSuccesses = 0;
        this.authFailures = 0;
        this.pizzasSold = 0;
        this.revenue = 0;
        this.creationLatency = 0;
        this.creationFailure = 0;
        this.activeUsers = 0;
        this.timer = null;
        this.requestLatency = 0;
    }

    //I think it ignores the order of these, bc I tried to put all the order stuff together and it didn't work
    sendMetricsPeriodically(interval) {
        this.timer = setInterval(() => {
            this.sendMetricToGrafana('request', 'all', 'total', this.totalRequests);
            this.sendMetricToGrafana('request', 'post', 'total', this.requestCounts.POST);
            this.sendMetricToGrafana('request', 'get', 'total', this.requestCounts.GET);
            this.sendMetricToGrafana('request', 'delete', 'total', this.requestCounts.DELETE);
            this.sendMetricToGrafana('request', 'put', 'total', this.requestCounts.PUT);
            this.sendMetricToGrafana('cpu', 'all', 'usage', this.getCpuUsagePercentage());
            this.sendMetricToGrafana('memory', 'all', 'usage', this.getMemoryUsagePercentage());
            this.sendMetricToGrafana('user', 'all', 'active', this.activeUsers);
            this.sendMetricToGrafana('auth', 'all', 'success', this.authSuccesses);
            this.sendMetricToGrafana('auth', 'all', 'failure', this.authFailures);
            this.sendMetricToGrafana('order', 'all', 'revenue', this.revenue);
            this.sendMetricToGrafana('order', 'all', 'failure', this.creationFailure);
            this.sendMetricToGrafana('order', 'all', 'total', this.pizzasSold);
            this.sendMetricToGrafana('order', 'all', 'latency', this.creationLatency);
            this.sendMetricToGrafana('request', 'all', 'latency', this.requestLatency);




            // if (this.creationLatency.length > 0) {
            //     const averageLatency = this.creationLatency.reduce((a, b) => a + b, 0) / this.creationLatency.length;
            //     this.sendMetricToGrafana('order', 'all', 'latency', averageLatency);
            // }

        }, interval);
    }

    requestTracker(req, res, next) {
        this.totalRequests++;
        const startTime = Date.now();

        // Capture the response finish event to calculate latency
        res.on('finish', () => {
            const endTime = Date.now();
            const latency = endTime - startTime;
            this.setRequestLatency(latency); // Accumulate the total latency
            // If needed, you can also calculate and log average latency
            console.log(`Request Latency: ${latency} ms`);
        });

        switch (req.method) {
            case 'GET':
                this.requestCounts.GET++;
                break;
            case 'POST':
                this.requestCounts.POST++;
                break;
            case 'DELETE':
                this.requestCounts.DELETE++;
                break;
            case 'PUT':
                this.requestCounts.PUT++;
                break;
            default:
                console.log("not a defined http request that we can do");
                break;
        }
        next();

    }

    sendMetricToGrafana(metricPrefix, httpMethod, metricName, metricValue) {
        const metric = `${metricPrefix},source=${config.metrics.source},method=${httpMethod} ${metricName}=${metricValue}`;

        fetch(`${config.metrics.url}`, {
            method: 'post',
            body: metric,
            headers: { Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}` },
        })
            .then((response) => {
                if (!response.ok) {
                    console.error('Failed to push metrics data to Grafana');
                } else {
                    console.log(`Pushed ${metric}`);
                }
            })
            .catch((error) => {
                console.error('Error pushing metrics:', error);
            });
    }

    setLatency(latency) {
        this.creationLatency = latency;
    }
    setRequestLatency(latency) {
        this.requestLatency = latency;
    }


    getCpuUsagePercentage() {
        const cpuUsage = os.loadavg()[0] / os.cpus().length;
        return (cpuUsage * 100).toFixed(2);
    }

    getMemoryUsagePercentage() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsage = (usedMemory / totalMemory) * 100;
        return memoryUsage.toFixed(2);
    }

    orderFailure() {
        this.creationFailure++;
    }

    logout() {
        console.log("logout");
        this.activeUsers--;
    }

    login() {
        // console.log("login", this.activeUsers);
        this.activeUsers++;
        this.authSuccesses++;
    }

    authSuccess() {
        this.authSuccesses++;
    }

    authFailure() {
        this.authFailures++;
    }

    //failed experiment

    // orderPizzas(order) {
    //     this.pizzasSold += order.items.length;
    //     //tried pizza, item,  nothing gets order to show up
    //     let totalRevenue = 0
    //     for (const item of order.items) {
    //         console.log("item price: ", item.price);
    //         totalRevenue += item.price;
    //     }

    //     this.revenue += totalRevenue;
    // }

    // try to separate them?

    addPrice(price) {
        console.log('Price metric updated with:', price);
        this.revenue += price;
    }
    numPizzasSold(numPizzasSold) {
        console.log('Pizzas sold metric updated with:', numPizzasSold);

        this.pizzasSold += numPizzasSold;
    }


}

const metrics = new Metrics();
module.exports = metrics;