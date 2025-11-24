import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: Date, required: true },
  time: { type: String, default: '' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  category: { type: String, default: 'general' },
  reminder: { type: Boolean, default: false },
  // Minutes before the event time/date to notify the user (e.g. 15 = 15 minutes before)
  reminderOffsetMinutes: { type: Number, default: null },
  // Computed timestamp when the reminder should fire (server-side convenience, client schedules locally)
  reminderAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model('Event', eventSchema);
