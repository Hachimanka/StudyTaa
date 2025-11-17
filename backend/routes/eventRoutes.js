import express from 'express';
import mongoose from 'mongoose';
import Event from '../models/Event.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// All routes below require a valid token (userId)
router.use(verifyToken);

// List all events for current user
router.get('/', async (req, res) => {
  try {
    const events = await Event.find({ userId: req.userId }).sort({ date: 1, createdAt: 1 });
    res.json(events);
  } catch (err) {
    console.error('List events error', err);
    res.status(500).json({ error: 'Failed to list events' });
  }
});

// Create one or more events
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const makeDoc = (e) => ({
      userId: req.userId,
      title: e.title?.toString()?.trim() || 'Event',
      description: e.description?.toString() || '',
      date: new Date(e.date),
      time: e.time || '',
      priority: ['low','medium','high'].includes(e.priority) ? e.priority : 'medium',
      category: e.category || 'general',
      reminder: !!e.reminder
    });

    // Accept array or single object
    if (Array.isArray(body)) {
      const docs = body.map(makeDoc);
      const created = await Event.insertMany(docs);
      return res.status(201).json(created);
    } else {
      const doc = await Event.create(makeDoc(body));
      return res.status(201).json(doc);
    }
  } catch (err) {
    console.error('Create events error', err);
    res.status(400).json({ error: 'Failed to create event(s)', details: err.message });
  }
});

// Update an existing event of the current user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
    const update = { ...req.body };
    if (update.date) update.date = new Date(update.date);
    const updated = await Event.findOneAndUpdate({ _id: id, userId: req.userId }, update, { new: true });
    if (!updated) return res.status(404).json({ error: 'Event not found' });
    res.json(updated);
  } catch (err) {
    console.error('Update event error', err);
    res.status(400).json({ error: 'Failed to update event', details: err.message });
  }
});

// Delete an existing event of the current user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
    const result = await Event.deleteOne({ _id: id, userId: req.userId });
    if (!result.deletedCount) return res.status(404).json({ error: 'Event not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete event error', err);
    res.status(400).json({ error: 'Failed to delete event', details: err.message });
  }
});

export default router;
