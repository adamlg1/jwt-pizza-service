const config = require('./config.js');

class Metrics {
    constructor() {
        this.totalRequests = 0;

        // This will periodically sent metrics to Grafana
        const timer = setInterval(() => {
            this.sendMetricToGrafana('request', 'all', 'total', this.totalRequests);
        }, 10000);
        timer.unref();
    }

    incrementRequests() {
        this.totalRequests++;
    }

    sendMetricToGrafana(metricPrefix, httpMethod, metricName, metricValue) {
        const metric = `${metricPrefix},source=${config.source},method=${httpMethod} ${metricName}=${metricValue}`;

        fetch(`${config.url}`, {
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
}

const metrics = new Metrics();
module.exports = metrics;