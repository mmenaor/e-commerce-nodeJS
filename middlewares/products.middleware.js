//Models
const { Product } = require('../models/product.model');
const { Category } = require('../models/category.model');
const { ProductImg } = require('../models/productImg.model');

//Utils
const { AppError } = require('../utils/appError.util')
const { catchAsync } = require('../utils/catchAsync.util')

const productExists = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { productId } = req.body;

    const product = await Product.findOne({ 
        where: { id: id || productId, status: 'active' }, 
        include: { model: ProductImg }
    });

    if (!product){
        return next(new AppError('Product does not exist', 404));
    }

    req.product = product;

    next();
});

const categoryExists = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const category = await Category.findOne({ where: { id, status: 'active' } });

    if (!category){
        return next(new AppError('Category does not exist', 404));
    }

    req.category = category;

    next();
});

module.exports = { productExists, categoryExists }