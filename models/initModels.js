//Models
const { User } = require('./user.model');
const { Cart } = require('./cart.model');
const { Category } = require('./category.model');
const { Order } = require('./order.model');
const { Product } = require('./product.model');
const { ProductImg } = require('./productImg.model');
const { ProductsInCart } = require('./productsInCart.model');

const initModels = () => {

    User.hasMany(Order, {foreignKey: 'userId'});
    Order.belongsTo(User);

    User.hasMany(Product, {foreignKey: 'userId'});
    Product.belongsTo(User);

    User.hasMany(Cart, {foreignKey: 'userId'});
    Cart.belongsTo(User);

    Category.hasMany(Product, {foreignKey: 'categoryId'});
    Product.belongsTo(Category);

    Product.hasMany(ProductImg, {foreignKey: 'productId'});
    ProductImg.belongsTo(Product);

    Product.hasMany(ProductsInCart, {foreignKey: 'productId'});
    ProductsInCart.belongsTo(Product);

    Cart.hasMany(ProductsInCart, {foreignKey: 'cartId'});
    ProductsInCart.belongsTo(Cart);

    Cart.hasOne(Order, {foreignKey: 'cartId'});
    Order.belongsTo(Cart);
};

module.exports = { initModels }