const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

//Global error controller
const { globalErrorHandler } = require('./controllers/error.controller');

//Utils
const { AppError } = require('./utils/appError.util');

// Routers
const { usersRouter } = require('./routes/users.routes');
const { productsRouter } = require('./routes/products.routes');
const { cartsRouter } = require('./routes/carts.routes');

// Init express app
const app = express();

// Add to the app the json method
app.use(express.json());

app.set('view engine', 'pug');

// Limit the number of requests that can be accepted to our server
const limiter = rateLimit({
    max: 5,
    windowMs: 1 * 60 * 1000,
    message: 'Number of requests have been exceeded'
});

app.use(limiter);

app.use(helmet());

app.use(compression());

if(process.env.NODE_ENV === 'development') app.use(morgan('dev'));
else app.use(morgan('combined'));

// Define endpoints
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/carts', cartsRouter);

//Hanlde incoming unknown routes to the server
app.all('*', (req, res, next) => {
    next(new AppError(`${req.method} ${req.originalUrl} not found in this server`), 404);
});

//Global error controller
app.use(globalErrorHandler);

module.exports = { app };