var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
const os = require('os');
const { router: indexRouter, pool } = require('./routes/index'); // Import the existing pool

var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use('/uploads', express.static('uploads'));

require("dotenv").config();

app.use('/', indexRouter);
// app.use('/users', usersRouter);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection using existing pool
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    // Get system metrics
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const loadAvg = os.loadavg();

    // Calculate usage percentages
    const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;
    const heapUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    // Get pool statistics
    const poolStats = {
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingClients: pool.waitingCount
    };

    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        pool: poolStats
      },
      system: {
        memory: {
          total: `${Math.round(totalMemory / 1024 / 1024)} MB`,
          free: `${Math.round(freeMemory / 1024 / 1024)} MB`,
          usage: `${Math.round(memoryUsagePercent)}%`,
          heap: {
            total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
            used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
            usage: `${Math.round(heapUsagePercent)}%`
          }
        },
        cpu: {
          load: loadAvg,
          usage: {
            user: cpuUsage.user,
            system: cpuUsage.system
          }
        }
      }
    };

    // Set warning status if resources are running low
    if (memoryUsagePercent > 90 || 
        heapUsagePercent > 90 || 
        loadAvg[0] > 0.8 ||
        poolStats.waitingClients > 0) {
      status.status = 'warning';
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      details: {
        database: 'disconnected',
        message: error.toString()
      }
    });
  }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
