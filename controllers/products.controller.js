const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const dotenv = require('dotenv');

//Models
const { Product } = require('../models/product.model');
const { Category } = require('../models/category.model');
const { ProductImg } = require('../models/productImg.model');

//Utils
const { catchAsync } = require('../utils/catchAsync.util');
const { AppError } = require('../utils/appError.util');
const { storage } = require('../utils/firebase.util');

dotenv.config({ path: './config.env' });

const createProduct = catchAsync(async (req, res, next) => {
    const { title, description, price, categoryId, quantity } = req.body;
    const { sessionUser } = req;

    const newProduct = await Product.create({ 
        title,
        description,
        price,
        categoryId,
        quantity,
        userId: sessionUser.id
    });

    if (req.files && req.files.length > 0) {
		const filesPromises = req.files.map(async file => {
			const imgRef = ref(storage, `products/${Date.now()}_${file.originalname}`);
			const imgRes = await uploadBytes(imgRef, file.buffer);
	
			return await ProductImg.create({ 
				productId: newProduct.id, 
				imgUrl: imgRes.metadata.fullPath 
			})
		});
	
		await Promise.all(filesPromises);
	}

    res.status(201).json({
        status: 'success',
        newProduct
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
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct, 
    deleteProduct,
    getCategories,
    createCategory,
    updateCategory
};