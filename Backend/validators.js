
const Joi = require('joi');

const registerSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
});

const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
});

const productSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().required(),
    image: Joi.string().required(),
    category: Joi.string(),
});

const contactSchema = Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().allow('').optional(),
    email: Joi.string().email().required(),
    message: Joi.string().required(),
});

const cartSchema = Joi.object({
    productId: Joi.string().required(),
    quantity: Joi.number().integer().min(1).max(20),
});

const orderSchema = Joi.object({
    shippingAddress: Joi.string().required(),
});

module.exports = {
    registerSchema,
    loginSchema,
    productSchema,
    contactSchema,
    cartSchema,
    orderSchema,
};
