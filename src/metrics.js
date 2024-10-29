const config = require('./config.js');
const os = require('os');

class Metrics {
    constructor() {
        this.totalRequests = 0;
        this.requestCounts = { GET: 0, POST: 0, DELETE: 0, PUT: 0 };
        this.authSuccesses = 0;
        this.authFailures = 0;
        this.pizzasSold = 0;
        this.revenuePerMin = 0;
        this.creationLatency = [];
        this.creationFailure = 0;
        this.pizzasOrdered = 0;
        this.activeUsers = 0;
        this.timer = null;

        this.startSendingMetrics();
    }

    startSendingMetrics(interval = 10000) {
        this.timer = setInterval(() => {
            this.sendMetricToGrafana('request', 'all', 'total', this.totalRequests);
            this.sendMetricToGrafana('request', 'post', 'total', this.requestCounts.POST);
            this.sendMetricToGrafana('request', 'get', 'total', this.requestCounts.GET);
            this.sendMetricToGrafana('request', 'delete', 'total', this.requestCounts.DELETE);
            this.sendMetricToGrafana('request', 'put', 'total', this.requestCounts.PUT);
            this.sendMetricToGrafana('cpu', 'all', 'usage', this.getCpuUsagePercentage());
            this.sendMetricToGrafana('memory', 'all', 'usage', this.getMemoryUsagePercentage());
            this.sendMetricToGrafana('order', 'all', 'total', this.pizzasOrdered);
            this.sendMetricToGrafana('user', 'all', 'active', this.activeUsers);
            this.sendMetricToGrafana('auth', 'all', 'success', this.authSuccesses);
            this.sendMetricToGrafana('auth', 'all', 'failure', this.authFailures);
            this.sendMetricToGrafana('order', 'all', 'revenue', this.revenuePerMin);
            this.sendMetricToGrafana('order', 'all', 'failure', this.creationFailure);

            if (this.creationLatency.length > 0) {
                const averageLatency = this.creationLatency.reduce((a, b) => a + b, 0) / this.creationLatency.length;
                this.sendMetricToGrafana('order', 'all', 'latency', averageLatency);
            }

        }, interval);
    }

    incrementRequests(method) {
        this.totalRequests++;
        if (this.requestCounts[method]) {
            this.requestCounts[method]++;
        }
    }

    sendMetricToGrafana(metricPrefix, httpMethod, metricName, metricValue) {
        const metric = `${metricPrefix},source=${config.source},method=${httpMethod} ${metricName}=${metricValue}`;

        fetch(`${config.metrics.url}`, {
            method: 'post',
            body: metric,
            headers: { Authorization: `Bearer ${config.userId}:${config.apiKey}` },
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

    getCpuUsagePercentage() {
        const cpuUsage = os.loadavg()[0] / os.cpus().length;
        return (cpuUsage * 100).toFixed(2); // Ensure this returns a percentage
    }

    getMemoryUsagePercentage() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsage = (usedMemory / totalMemory) * 100;
        return memoryUsage.toFixed(2);
    }

    failedToCreate() {
        this.creationFailure++;
    }

    logout() {
        this.activeUsers--;
    }

    login() {
        this.activeUsers++;
        this.authSuccesses++;
    }

    get() {
        this.incrementRequests('GET');
    }

    delete() {
        this.incrementRequests('DELETE');
    }

    put() {
        this.incrementRequests('PUT');
    }

    post() {
        this.incrementRequests('POST');
    }

    orderPizza(amount, latency) {
        this.pizzasSold++;
        this.revenuePerMin += amount;
        this.creationLatency.push(latency);
    }

    stopMetrics() {
        clearInterval(this.timer);
    }
}

const metrics = new Metrics();
module.exports = metrics;
