const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

//Models
const { User } = require('../models/user.model');
const { Order } = require('../models/order.model');
const { Product } = require('../models/product.model');
const { ProductsInCart } = require('../models/productsInCart.model');
const { Cart } = require('../models/cart.model');

//Utils
const { catchAsync } = require('../utils/catchAsync.util');
const { AppError } = require('../utils/appError.util');
const { Email } = require('../utils/email.util');

dotenv.config({ path: './config.env' });

const createUser = catchAsync(async (req, res, next) => {
    const { username, email, password, role } = req.body;

    //Hash password
    const salt = await bcrypt.genSalt(12);
    const hashPassword = await bcrypt.hash(password, salt); //salt 

    let newRole = "admin";

    if(!role){
        newRole = "normal";
    }

    const newUser = await User.create({ 
        username, 
        email, 
        password: hashPassword,
        role: newRole
    });

    //Remove password from response
    newUser.password = undefined;

    await new Email(email).sendWelcome(username);

    res.status(201).json({
        status: 'success',
        newUser
    });   
});

const getUsersProducts = catchAsync(async (req, res, next) => {
    const { sessionUser } = req;
    
    const products = await Product.findAll({ 
        where: { userId: sessionUser.id }
    });

    res.status(200).json({
        status: 'success',
        products
    });  
});

const updateUser = catchAsync(async (req, res, next) => {
    const { user } = req;
    const { username, email } = req.body;

    if(!username || !email){
        return next(new AppError('You must provide an email and username', 400));
    }

    await user.update({ username, email });

    res.status(204).json({ status: 'success' });
});

const deleteUser = catchAsync(async (req, res, next) => {
    const { user } = req;

    await user.update({ status: 'deleted'});

    res.status(204).json({ status: 'success' });
});

const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    //Validate credentials (email)
    const user = await User.findOne({ where: { email, status: 'active' } });

    if(!user){
        return next(new AppError('Credentials invalid', 400));
    }

    //Validate password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if(!isValidPassword){
        return next(new AppError('Credentials invalid', 400));
    }

    const token = await jwt.sign({ id: user.id }, process.env.JWT_SECRET, { 
        expiresIn: '30d',
    });

    //Send response
    res.status(200).json({
        status: 'success',
        token,
    });
});

const getAllOrders = catchAsync(async (req, res, next) => {
    const { sessionUser } = req;
    
    const orders = await Order.findAll({ 
        where: { userId: sessionUser.id },
        include: [{ 
            model: Cart,
            include: [{ 
                where: { status: 'purchased'},
                model: ProductsInCart 
            }]
        }]
    });

    res.status(200).json({
        status: 'success',
        orders
    });    
});

const getOrderById = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { sessionUser } = req;
    
    const order = await Order.findOne({ 
        where: { id, userId: sessionUser.id },
        include: [{ 
            model: Cart,
            include: [{ 
                where: { status: 'purchased'},
                model: ProductsInCart 
            }]
        }]
    });

    if(!order){
        return next(new AppError('Order does not exist', 400));
    }

    res.status(200).json({
        status: 'success',
        order
    });    
});

module.exports = { 
    createUser,
    login,
    getUsersProducts,
    updateUser, 
    deleteUser,
    getAllOrders,
    getOrderById,
};