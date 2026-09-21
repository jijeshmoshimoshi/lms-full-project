const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true, 
    index: true 
  },
  items: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course' 
  }],
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  instructor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  razorpayOrderId: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  razorpayPaymentId: { 
    type: String, 
    sparse: true, 
    index: true 
  },
  razorpaySignature: { 
    type: String 
  },
  razorpayTransferId: { 
    type: String, 
    sparse: true 
  },
  razorpayRefundId: { 
    type: String, 
    sparse: true 
  },
  amountPaid: { 
    type: Number, 
    required: true 
  }, // Total amount charged in INR
  currency: { 
    type: String, 
    default: 'INR' 
  },
  originalPrice: { 
    type: Number, 
    default: 0 
  },
  discountAmount: { 
    type: Number, 
    default: 0 
  },
  couponCode: {
    type: String,
    default: ''
  },
  taxAmount: { 
    type: Number, 
    default: 0 
  }, // GST component if applicable
  platformCut: { 
    type: Number, 
    required: true 
  }, // Platform share in INR
  instructorCut: { 
    type: Number, 
    required: true 
  }, // Instructor share in INR
  gatewayFee: { 
    type: Number, 
    default: 0 
  }, // Razorpay fee ~2%
  platformSharePercent: { 
    type: Number, 
    required: true 
  }, // Snapshotted percentage at checkout (e.g. 30)
  instructorSharePercent: { 
    type: Number, 
    required: true 
  }, // Snapshotted percentage at checkout (e.g. 70)
  status: { 
    type: String, 
    enum: ['created', 'paid', 'settled', 'refunded', 'failed'], 
    default: 'created',
    index: true 
  },
  transferStatus: { 
    type: String, 
    enum: ['pending', 'processed', 'reversed', 'failed', 'clawback_pending'], 
    default: 'pending' 
  },
  settlementId: { 
    type: String 
  },
  refundReason: { 
    type: String 
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
