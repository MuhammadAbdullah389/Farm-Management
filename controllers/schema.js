const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    date: { 
        type: String, 
        required: true, 
        unique: true 
    },
    morningMilkQuantity: { 
        type: Number, 
        required: true 
    },
    eveningMilkQuantity: { 
        type: Number, 
        required: true 
    },
    expenses: [
        {
            description: { 
                type: String, 
                required: true 
            }, 
            amount: { 
                type: Number, 
                required: true 
            }, 
        }
    ],
    revenues: [
        {
            description: { 
                type: String, 
                required: true 
            },
            amount: { 
                type: Number, 
                required: true 
            }, 
        }
    ],
    totalRevenue : {
        type: Number, 
        required: true         
    },
    totalExpenditure : {
        type: Number, 
        required: true 
    },
    Balance : {
        type: Number, 
        required: true 
    }
}, 
{
    timestamps: true,
}
);

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
