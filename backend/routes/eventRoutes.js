import express from 'express';
import mongoose from 'mongoose';
import Event from '../models/Event.js';
import { verifyToken } from '../middleware/auth.js';

// Helper to compute reminderAt given date (Date), time string (HH:MM), and offset minutes
function computeReminderAt(date, time, offsetMinutes) {
  if (!date || offsetMinutes == null || offsetMinutes < 0) return null;
  try {
    let eventDateTime = new Date(date);
    if (time && /^(\d{2}):(\d{2})$/.test(time)) {
      const [hh, mm] = time.split(':').map(Number);
      eventDateTime.setHours(hh, mm, 0, 0);
    }
    const reminderMs = eventDateTime.getTime() - offsetMinutes * 60000;
    if (reminderMs <= 0) return null; // avoid invalid past epoch or negative
    return new Date(reminderMs);
  } catch (_) {
    return null;
  }
}

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
    const makeDoc = (e) => {
      const date = new Date(e.date);
      const time = e.time || '';
      const offset = (e.reminderOffsetMinutes !== undefined && e.reminderOffsetMinutes !== null) ? Number(e.reminderOffsetMinutes) : null;
      return {
        userId: req.userId,
        title: e.title?.toString()?.trim() || 'Event',
        description: e.description?.toString() || '',
        date,
        time,
        priority: ['low','medium','high'].includes(e.priority) ? e.priority : 'medium',
        category: e.category || 'general',
        reminder: !!e.reminder,
        reminderOffsetMinutes: offset,
        reminderAt: computeReminderAt(date, time, offset)
      };
    };

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
    // Recompute reminderAt if relevant fields provided
    const dateForReminder = update.date || undefined;
    const timeForReminder = update.time !== undefined ? update.time : undefined;
    const offsetForReminder = update.reminderOffsetMinutes !== undefined ? Number(update.reminderOffsetMinutes) : undefined;
    if (dateForReminder && (timeForReminder !== undefined || offsetForReminder !== undefined)) {
      const existing = await Event.findOne({ _id: id, userId: req.userId });
      if (existing) {
        const date = dateForReminder || existing.date;
        const time = timeForReminder !== undefined ? timeForReminder : existing.time;
        const offset = offsetForReminder !== undefined ? offsetForReminder : existing.reminderOffsetMinutes;
        update.reminderAt = computeReminderAt(date, time, offset);
      }
    }
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

// Bulk delete events by ids and/or dates
// Body: { eventIds?: string[], dates?: string[] } where dates are ISO yyyy-mm-dd (date portion only)
router.post('/bulk-delete', async (req, res) => {
  try {
    const { eventIds = [], dates = [] } = req.body || {};
    const validIds = Array.isArray(eventIds)
      ? eventIds.filter(id => mongoose.Types.ObjectId.isValid(id))
      : [];
    const dateSet = new Set();
    if (Array.isArray(dates)) {
      dates.forEach(d => {
        if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
          // Normalize to midnight local; stored dates appear to be date-only
          const [y, m, da] = d.split('-').map(Number);
          dateSet.add(new Date(y, m - 1, da).toISOString().substring(0, 10));
        }
      });
    }

    if (!validIds.length && !dateSet.size) {
      return res.status(400).json({ error: 'Provide eventIds or dates for bulk deletion' });
    }

    // Fetch matching events first to return which were deleted
    const dateMatchQuery = dateSet.size
      ? {
          $expr: {
            $in: [
              {
                $dateToString: { format: '%Y-%m-%d', date: '$date' }
              },
              Array.from(dateSet)
            ]
          }
        }
      : null;

    const orClauses = [];
    if (validIds.length) orClauses.push({ _id: { $in: validIds } });
    if (dateMatchQuery) orClauses.push(dateMatchQuery);

    const matchFilter = {
      userId: req.userId,
      ...(orClauses.length === 1 ? orClauses[0] : { $or: orClauses })
    };

    const toDelete = await Event.find(matchFilter).select('_id date');
    if (!toDelete.length) {
      return res.json({ deleted: 0, deletedIds: [], datesMatched: Array.from(dateSet) });
    }

    const idsToDelete = toDelete.map(d => d._id);
    const deleteResult = await Event.deleteMany({ userId: req.userId, _id: { $in: idsToDelete } });
    res.json({
      deleted: deleteResult.deletedCount || 0,
      deletedIds: idsToDelete,
      datesMatched: Array.from(dateSet)
    });
  } catch (err) {
    console.error('Bulk delete events error', err);
    res.status(500).json({ error: 'Failed bulk delete', details: err.message });
  }
});

export default router;
