import mongoose from 'mongoose';
import { NOTIFICATION_TYPES } from '../utils/constants.js';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 600 },
    type: {
      type: String,
      enum: { values: NOTIFICATION_TYPES, message: 'Unknown type: {VALUE}.' },
      default: 'system',
    },
    issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', default: null },
    /** Denormalised so the UI can render a link without an extra populate. */
    issueComplaintId: { type: String, trim: true, default: '' },
    issueTitle: { type: String, trim: true, default: '' },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        ret.id = ret._id?.toString();
        delete ret._id;
        return ret;
      },
    },
  },
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
