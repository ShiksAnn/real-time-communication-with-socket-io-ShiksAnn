const Room = require('../models/Room');

exports.createRoom = async (req, res) => {
  try {
    const { name, isPrivate } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    const room = await Room.create({ name, isPrivate: !!isPrivate });
    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().limit(100);
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
