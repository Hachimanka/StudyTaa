import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ts: {
    type: Number,
    required: true
  },
  minutes: {
    type: Number,
    default: 0
  },
  meta: {
    type: Object,
    default: {}
  }
}, { timestamps: true });

sessionSchema.index({ userId: 1, ts: -1 });

export default mongoose.model('Session', sessionSchema);
