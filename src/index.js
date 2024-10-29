const app = require('./service.js');
app.use(metrics.requestTracker);


metrics.sendMetrics(1000);

const port = process.argv[2] || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
