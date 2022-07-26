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
        const productExists = await ProductInCart.findOne({ where: { cartId: usersCart.id, productId }})
        if(productExists){
            return next(new AppError('Product is already in the cart', 400));
        }

        await ProductInCart.create({ 
            cartId: usersCart.id, 
            productId, 
            quantity
        })
    }

    res.status(201).json({
        status: 'success',
    });   
});

const getAllProducts = catchAsync(async (req, res, next) => {
    
    const products = await Product.findAll({ 
        where: { status: 'active' }
    });

    res.status(200).json({
        status: 'success',
        products
    });  
});

const getProductById = catchAsync(async (req, res, next) => {
    const { product } = req;
    
    const productImgsPromises = product.productImgs.map(async productImg => {
		const imgRef = ref(storage, productImg.imgUrl);
		const imgFullPath = await getDownloadURL(imgRef);
		productImg.imgUrl = imgFullPath;
	});

	await Promise.all(productImgsPromises);

    res.status(200).json({
        status: 'success',
        product
    });  
});

const updateProduct = catchAsync(async (req, res, next) => {
    const { title, description, price, quantity } = req.body;
    const { sessionUser, product } = req;

    if(sessionUser.id !== product.userId){
        return next(new AppError('You can only modify your own products', 400));
    }

    await product.update({ title, description, price, quantity });

    res.status(204).json({ status: 'success' });
});

const deleteProduct = catchAsync(async (req, res, next) => {
    const { sessionUser, product } = req;

    if(sessionUser.id !== product.userId){
        return next(new AppError('You can only modify your own products', 400));
    }

    await product.update({ status: 'deleted'});

    res.status(204).json({ status: 'success' });
});

const getCategories = catchAsync(async (req, res, next) => {
    const categories = await Category.findAll({ 
        where: { status: 'active' }
    });

    res.status(200).json({
        status: 'success',
        categories
    });  
});

const createCategory = catchAsync(async (req, res, next) => {
    const { name } = req.body;
    const { sessionUser } = req;

    if(sessionUser.role === "normal"){
        return next(new AppError('Credentials invalid', 400));
    }

    const newCategory = await Category.create({ 
        name
    });

    res.status(201).json({
        status: 'success',
        newCategory
    });  
});

const updateCategory = catchAsync(async (req, res, next) => {
    const { name } = req.body;
    const { sessionUser, category } = req;

    if(sessionUser.role === "normal"){
        return next(new AppError('Credentials invalid', 400));
    }

    await category.update({ name });

    res.status(204).json({ status: 'success' });  
});

module.exports = { 
    addProductToCart,
    updateProductInCart,
    deleteProductFromCart,
    purchaseCart, 
};