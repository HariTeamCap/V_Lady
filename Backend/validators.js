
const Joi = require('joi');

// Username/password based register/login removed. Authentication is OTP-based.
const registerSchema = Joi.object({});
const loginSchema = Joi.object({});

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
