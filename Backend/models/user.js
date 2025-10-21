const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    type: { type: String, enum: ['home', 'work', 'other'], required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
});

const userSchema = new mongoose.Schema({
    mobile: { 
        type: String, 
        required: true, 
        unique: true,
        validate: {
            validator: function(v) {
                return /^\+91[1-9]\d{9}$/.test(v);
            },
            message: props => `${props.value} is not a valid Indian mobile number!`
        }
    },
    name: { type: String },
    email: { type: String },
    addresses: [addressSchema],
    isVerified: { type: Boolean, default: false },
    otp: {
        code: String,
        generatedAt: Date,
        attempts: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);