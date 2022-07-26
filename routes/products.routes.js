const express = require('express');

// Controllers
const { 
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct, 
    deleteProduct,
    getCategories,
    createCategory,
    updateCategory
} = require('../controllers/products.controller');

//Middlewares
const { createProductValidators } = require('../middlewares/validators.middleware');
const { productExists, categoryExists } = require('../middlewares/products.middleware');
const { protectSession, protectUserAccount } = require('../middlewares/auth.middleware');

//Utils
const { upload } = require('../utils/upload.util');

// Define endpoints before activate server listening to requests
const productsRouter = express.Router();

productsRouter.get('/', getAllProducts);

productsRouter.get('/:id', productExists, getProductById);

productsRouter.get('/categories', getCategories);

productsRouter.use(protectSession);

productsRouter.post('/', createProductValidators, upload.array("productImg", 5), createProduct);

productsRouter.patch('/:id', protectUserAccount, productExists, updateProduct);

productsRouter.delete('/:id', protectUserAccount, productExists, deleteProduct);

productsRouter.post('/categories', createCategory);

productsRouter.patch('/categories/:id', categoryExists, updateCategory);

module.exports = { productsRouter };