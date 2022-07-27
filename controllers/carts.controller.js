const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const dotenv = require('dotenv');

//Models
const { Product } = require('../models/product.model');
const { Cart } = require('../models/cart.model');
const { ProductsInCart } = require('../models/productsInCart.model');
const { Order } = require('../models/order.model');

//Utils
const { catchAsync } = require('../utils/catchAsync.util');
const { AppError } = require('../utils/appError.util');
const { storage } = require('../utils/firebase.util');
const { Email } = require('../utils/email.util');

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
        const newCart = await Cart.create({ userId: sessionUser.id })

        await ProductsInCart.create({
            cartId: newCart.id,
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
    const { productId, newQty } =  req.body;
    const { sessionUser } = req;

    const product = await Product.findOne({ where: { id: productId, status: 'active' } });

    if(!product){
        return next(new AppError('Invalid Product', 404));
    } else if (newQty > product.quantity) {
        return next(new AppError(`This product only has ${product.quantity} items available`, 400));
    }

    const cart = await Cart.findOne({ where: { userId: sessionUser.id, status:'active' } });

    if(!cart){
        return next(new AppError('You do not have a cart yet', 404));
    }

    const productInCart = await ProductsInCart.findOne({ cartId: cart.id, productId, status: 'active' });

    if(!productInCart){
        return next(new AppError('Product is not in your cart'), 404);
    }

    if(newQty <= 0){
        await productInCart.update({ quantity: 0, status: 'removed' });
    } else {
        await productInCart.update({ quantity: newQty })
    }

    res.status(200).json({ status: 'success' });
});

const deleteProductFromCart = catchAsync(async (req, res, next) => {
    const { productId } = req.params;
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
    const { sessionUser } = req;

    const cart = await Cart.findOne({ 
        where: {userId: sessionUser.id, status: 'active'},
        include: [{ 
            model: ProductsInCart, 
            required: false, 
            where:{ status: 'active' }, 
            include: { model: Product } 
        }]
    });

    if(!cart){
        return next(new AppError('Cart does not exist', 404))
    }

    let totalPrice = 0;
    const emailInfo = [];

    const purchasePromises = cart.productsInCarts.map(async productInCart => {
        const newQuantity = productInCart.product.quantity - productInCart.quantity;

        const subTotal = productInCart.quantity * +productInCart.product.price;

        totalPrice += subTotal;

        emailInfo.push({
            productName: productInCart.product.title,
            unitPrice: +productInCart.product.price,
            purchaseQuantity: productInCart.quantity,
            subTotal
        });

        await productInCart.product.update({ quantity: newQuantity });

        await productInCart.update ({ status: 'purchased' });
    });

    await Promise.all(purchasePromises);

    await cart.update({ status: 'purchased' });

    await Order.create({
        userId: sessionUser.id,
        cartId: cart.id,
        totalPrice
    })

    await new Email(sessionUser.email).sendPurchase(sessionUser.username, emailInfo, totalPrice);

    res.status(200).json({ status: 'success' });
});

module.exports = { 
    addProductToCart,
    updateProductInCart,
    deleteProductFromCart,
    purchaseCart, 
};