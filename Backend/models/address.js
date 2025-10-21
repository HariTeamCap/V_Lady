const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    type: { 
        type: String, 
        enum: ['home', 'work', 'other'],
        required: true 
    },
    street: { 
        type: String, 
        required: true 
    },
    city: { 
        type: String, 
        required: true 
    },
    state: { 
        type: String, 
        required: true 
    },
    pincode: { 
        type: String, 
        required: true,
        validate: {
            validator: function(v) {
                return /^\d{6}$/.test(v);
            },
            message: props => `${props.value} is not a valid pincode!`
        }
    },
    isDefault: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

// Ensure only one default address per user
addressSchema.pre('save', async function(next) {
    if (this.isDefault) {
        await this.constructor.updateMany(
            { userId: this.userId, _id: { $ne: this._id } },
            { $set: { isDefault: false } }
        );
    }
    next();
});

module.exports = mongoose.model('Address', addressSchema);