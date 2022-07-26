const { body, validationResult } = require('express-validator');
const { AppError } = require('../utils/appError.util');

const checkResult = (req, res, next) => {
    const errors = validationResult(req);

    if( !errors.isEmpty() ) {
        const errorMsgs = errors.array().map(err => err.msg);
        const message = errorMsgs.join('. ');

        return next(new AppError(message, 400));
    }

    next();
};

const createUserValidators = [
    body('username').notEmpty().withMessage('Username cannot be empty'), 
    body('email').isEmail().withMessage('Must provide a valid email'), 
    body('password')
        .isLength({ min: 8 })
        .withMessage('Pwd must be at least 8 chars long')
        .isAlphanumeric()
        .withMessage('Pwd must contain an alphanumeric value'),
    checkResult
];

const createProductValidators = [
    body('title').notEmpty().withMessage('Title cannot be empty'), 
    body('description').notEmpty().withMessage('Description cannot be empty'), 
    body('quantity').isInt().withMessage('Quantity must be an integer'),
    body('price').isInt().withMessage('Price must be an integer'),
    checkResult
];

module.exports = { createUserValidators, createProductValidators };