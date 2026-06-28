import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional for Google Auth users
    authProvider: { type: String, default: 'local' },
    avatarUrl: { type: String },
    topicsOfInterest: [String],
    solvedProblems: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodingQuestion'
    }],
    streak: {
      type: Number,
      default: 0
    },
    lastSolvedAt: {
      type: Date
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      required: true
    },
    stats: {
      interviewsCount: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 }
    },
    profile: {
      resumeText: { type: String },
      resumeData: { type: Object },
      skills: [String]
    }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) {
      return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

userSchema.methods.refreshToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: '60d' }
  );
};

const User = mongoose.model('User', userSchema);
export default User;
