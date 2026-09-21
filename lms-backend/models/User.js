const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
    },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    headline: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    razorpayAccountId: { type: String, default: null, trim: true },
    payoutStatus: {
      type: String,
      enum: ["not_onboarded", "pending_kyc", "active", "suspended"],
      default: "not_onboarded",
    },
    payoutSchedule: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "weekly",
    },
    payoutDetails: {
      businessName: { type: String, default: "" },
      businessType: { type: String, default: "individual" },
      accountNumberLast4: { type: String, default: "" },
      ifsc: { type: String, default: "" },
      pan: { type: String, default: "" },
      beneficiaryName: { type: String, default: "" },
    },
    unsettledClawbackAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
