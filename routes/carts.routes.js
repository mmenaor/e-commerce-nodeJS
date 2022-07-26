const express = require('express');

// Controllers
const { 
    addProductToCart,
    updateProductInCart,
    deleteProductFromCart,
    purchaseCart, 
} = require('../controllers/carts.controller');

//Middlewares
const { productExists } = require('../middlewares/products.middleware');
const { protectSession } = require('../middlewares/auth.middleware');

// Define endpoints before activate server listening to requests
const cartsRouter = express.Router();

cartsRouter.use(protectSession);

cartsRouter.post('/add-product', productExists, addProductToCart);

cartsRouter.patch('/update-cart', updateProductInCart);

cartsRouter.delete('/:productId', deleteProductFromCart);

cartsRouter.post('/purchase', purchaseCart);

module.exports = { cartsRouter };