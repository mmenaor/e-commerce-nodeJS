const express = require('express');

// Controllers
const { 
    createUser,
    login,
    getUsersProducts,
    updateUser, 
    deleteUser,
    getAllOrders,
    getOrderById,
} = require('../controllers/users.controller');

//Middlewares
const { createUserValidators } = require('../middlewares/validators.middleware');
const { userExists } = require('../middlewares/users.middleware');
const { protectSession, protectUserAccount } = require('../middlewares/auth.middleware');

// Define endpoints before activate server listening to requests
const usersRouter = express.Router();

usersRouter.post('/', createUserValidators, createUser);

usersRouter.post('/login', login);

usersRouter.use(protectSession);

usersRouter.get('/me', getUsersProducts)

usersRouter.get('/orders', getAllOrders);

usersRouter.get('/orders/:id', getOrderById);

usersRouter
    .use('/:id', userExists)
    .route('/:id')
    .patch(protectUserAccount, updateUser)
    .delete(protectUserAccount, deleteUser);

module.exports = { usersRouter };