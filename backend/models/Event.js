import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: Date, required: true },
  time: { type: String, default: '' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  category: { type: String, default: 'general' },
  reminder: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Event', eventSchema);
