import mongoose from 'mongoose';
import {
  ISSUE_CATEGORIES,
  ISSUE_PRIORITY,
  ISSUE_STATUS,
  PRIORITY_VALUES,
  STATUS_VALUES,
} from '../utils/constants.js';

const photoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true, default: '' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: { values: STATUS_VALUES, message: 'Unknown status: {VALUE}.' },
      required: true,
    },
    note: { type: String, trim: true, maxlength: 600, default: '' },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    changedByName: { type: String, trim: true, default: 'System' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const resolutionSchema = new mongoose.Schema(
  {
    note: { type: String, trim: true, maxlength: 1000, default: '' },
    proofPhotos: { type: [photoSchema], default: [] },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedByName: { type: String, trim: true, default: '' },
    resolvedAt: { type: Date, default: null },
  },
  { _id: false },
);

const issueSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Issue title is required.'],
      trim: true,
      minlength: 5,
      maxlength: 140,
    },
    description: {
      type: String,
      required: [true, 'Description is required.'],
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    category: {
      type: String,
      required: [true, 'Category is required.'],
      enum: { values: ISSUE_CATEGORIES, message: 'Unknown category: {VALUE}.' },
      index: true,
    },
    photos: {
      type: [photoSchema],
      default: [],
      validate: {
        validator: (photos) => photos.length <= 5,
        message: 'A maximum of 5 photos can be attached to a complaint.',
      },
    },
    location: {
      address: {
        type: String,
        required: [true, 'Address is required.'],
        trim: true,
        maxlength: 240,
      },
      area: { type: String, trim: true, maxlength: 120, default: '' },
      city: { type: String, trim: true, maxlength: 120, default: '' },
      pincode: { type: String, trim: true, maxlength: 12, default: '' },
      lat: {
        type: Number,
        required: [true, 'Latitude is required.'],
        min: [-90, 'Latitude must be between -90 and 90.'],
        max: [90, 'Latitude must be between -90 and 90.'],
      },
      lng: {
        type: Number,
        required: [true, 'Longitude is required.'],
        min: [-180, 'Longitude must be between -180 and 180.'],
        max: [180, 'Longitude must be between -180 and 180.'],
      },
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: { values: STATUS_VALUES, message: 'Unknown status: {VALUE}.' },
      default: ISSUE_STATUS.SUBMITTED,
      index: true,
    },
    priority: {
      type: String,
      enum: { values: PRIORITY_VALUES, message: 'Unknown priority: {VALUE}.' },
      default: ISSUE_PRIORITY.MEDIUM,
      index: true,
    },
    /**
     * Numeric mirror of `priority` so "sort by priority" actually respects the
     * semantic order (urgent > high > medium > low) instead of alphabetical.
     * Maintained in the issue service.
     */
    priorityWeight: { type: Number, default: 2, min: 1, max: 4, index: true },

    assignedDepartment: { type: String, trim: true, default: '', index: true },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    upvotes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
      select: false,
    },
    upvoteCount: { type: Number, default: 0, min: 0, index: true },

    statusHistory: { type: [statusHistorySchema], default: [] },
    resolution: { type: resolutionSchema, default: () => ({}) },
    rejectionReason: { type: String, trim: true, maxlength: 600, default: '' },

    acknowledgedAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    lastActivityAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        delete ret.upvotes;
        ret.id = ret._id?.toString();
        delete ret._id;
        return ret;
      },
    },
  },
);

issueSchema.virtual('supporterCount').get(function supporterCount() {
  return this.upvoteCount ?? 0;
});

issueSchema.virtual('isResolved').get(function isResolved() {
  return this.status === ISSUE_STATUS.RESOLVED;
});

/** Appends a timeline entry and keeps `lastActivityAt` in sync. */
issueSchema.methods.addStatusEntry = function addStatusEntry({
  status,
  note = '',
  changedBy = null,
  changedByName = 'System',
  at = new Date(),
}) {
  this.statusHistory.push({
    status,
    note,
    changedBy,
    changedByName,
    changedAt: at,
  });
  this.lastActivityAt = at;
  return this.statusHistory[this.statusHistory.length - 1];
};

// Indexes for the list/filter/sort queries the dashboards actually run.
// (`complaintId` already gets its unique index from `unique: true` above.)
issueSchema.index({ status: 1, createdAt: -1 });
issueSchema.index({ category: 1, createdAt: -1 });
issueSchema.index({ priority: 1, createdAt: -1 });
issueSchema.index({ reportedBy: 1, createdAt: -1 });
issueSchema.index({ upvoteCount: -1, createdAt: -1 });
issueSchema.index({ createdAt: -1 });
issueSchema.index({ assignedDepartment: 1, status: 1 });

const Issue = mongoose.model('Issue', issueSchema);

export default Issue;
