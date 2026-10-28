import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, ROLE_VALUES } from '../utils/constants.js';

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 160,
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: 8,
      // Never returned by default — controllers must opt in with .select('+password').
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ROLE_VALUES,
        message: 'Role must be one of: {VALUES}.',
      },
      default: ROLES.CITIZEN,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
      default: '',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: '',
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        ret.id = ret._id?.toString();
        delete ret._id;
        return ret;
      },
    },
  },
);

userSchema.virtual('isAdmin').get(function isAdmin() {
  return this.role === ROLES.ADMIN;
});

userSchema.index({ createdAt: -1 });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.statics.findByCredentials = function findByCredentials(email) {
  return this.findOne({ email: String(email).toLowerCase().trim() }).select(
    '+password',
  );
};

const User = mongoose.model('User', userSchema);

export default User;
