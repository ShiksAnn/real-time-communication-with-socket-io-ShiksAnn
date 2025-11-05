const express = require('express');
const router = express.Router();
const Room = require('../models/Room');


// get public rooms
router.get('/', async (req, res) => {
const rooms = await Room.find({ isPrivate: false }).limit(50);
res.json(rooms);
});


module.exports = router;