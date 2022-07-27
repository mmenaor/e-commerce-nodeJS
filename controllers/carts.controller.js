const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const dotenv = require('dotenv');

//Models
const { Product } = require('../models/product.model');
const { Category } = require('../models/category.model');
const { ProductImg } = require('../models/productImg.model');
const { Cart } = require('../models/cart.model');
const { ProductsInCart } = require('../models/productsInCart.model');

//Utils
const { catchAsync } = require('../utils/catchAsync.util');
const { AppError } = require('../utils/appError.util');
const { storage } = require('../utils/firebase.util');

dotenv.config({ path: './config.env' });

const addProductToCart = catchAsync(async (req, res, next) => {
    const { productId, quantity } = req.body;
    const { sessionUser } = req;

    const product = await Product.findOne({ where: { id: productId, status: 'active' } });

    if(!product){
        return next(new AppError('Invalid Product', 404));
    } else if (quantity > product.quantity) {
        return next(new AppError(`This product only has ${product.quantity} items available`, 400));
    }

    const usersCart = await Cart.findOne({ where: { userId: sessionUser.id, status: 'active' }});

    if(!usersCart){
        usersCart = await Cart.create({ userId: sessionUser.id })

        await ProductsInCart.create({
            cartId: usersCart.id,
            productId,
            quantity
        })
    } else {
        const productExists = await ProductsInCart.findOne({ where: { cartId: usersCart.id, productId }})
        if(productExists && productExists.status === 'active'){
            return next(new AppError('Product is already in the cart', 400));
        } else if (productExists && productExists.status === 'removed'){
            await productExists.update({ quantity, status: 'active' });
        } else {
            await ProductsInCart.create({ 
                cartId: usersCart.id, 
                productId, 
                quantity
            })
        }
    }

    res.status(201).json({
        status: 'success',
    });   
});

//NOT DONE
const updateProductInCart = catchAsync(async (req, res, next) => {
    const { productId, newQuantity } =  req.body;
    const { sessionUser } = req;

    //Look for the users cart
    //Validate product stock
    //If quantity = 0, then change status to removed
    //If product is added again (being its status as removed, then change status to active and add quantity)
    const product = await Product.findOne({ where: productId, status: 'active' });

    if(!product){
        return next(new AppError('Invalid Product', 404))
    }

    const cart = await Cart.findOne({ where: { userId: sessionUser.id, status: 'active' } });

    if(!cart){
        return next(new AppError('You need to add products at your cart'))
    }

});

const deleteProductFromCart = catchAsync(async (req, res, next) => {
    const { productId } = req.body;
    const { sessionUser } = req;

    const cart = await Cart.findOne({ where: { userId: sessionUser.id, status: 'active' } });

    if(!cart){
        return next(new AppError('Cart does not exist', 400))
    }

    const product = await ProductsInCart.findOne({ where: { cartId: cart.id, productId, status: 'active' } });

    if(!product){
        return next(new AppError('Product does not exist in the current cart', 400))
    }

    await product.update({ quantity: 0, status: 'removed' });
    
    res.status(204).json({ status: 'success'});
});

const purchaseCart = catchAsync(async (req, res, next) => {
    const { title, description, price, quantity } = req.body;
    const { sessionUser, product } = req;

    if(sessionUser.id !== product.userId){
        return next(new AppError('You can only modify your own products', 400));
    }

    await product.update({ title, description, price, quantity });

    res.status(204).json({ status: 'success' });
});

module.exports = { 
    addProductToCart,
    updateProductInCart,
    deleteProductFromCart,
    purchaseCart, 
};