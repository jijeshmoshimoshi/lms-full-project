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
    // Gamification & Streaks System
    xp: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    streak: { type: Number, default: 0, min: 0 },
    longestStreak: { type: Number, default: 0, min: 0 },
    lastActiveDate: { type: String, default: "" }, // YYYY-MM-DD
    streakHistory: [{ type: String }], // Array of YYYY-MM-DD dates
    streakFreezeCount: { type: Number, default: 1, min: 0 },
    dailyGoalXp: { type: Number, default: 50, min: 10 },
    todayXp: { type: Number, default: 0, min: 0 },
    badges: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, default: "" },
        icon: { type: String, default: "trophy" },
        category: { type: String, default: "achievement" },
        unlockedAt: { type: Date, default: Date.now },
      },
    ],
    xpHistory: [
      {
        action: { type: String, required: true },
        xp: { type: Number, required: true },
        description: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
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
