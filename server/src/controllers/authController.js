const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();


const JWT_SECRET = process.env.JWT_SECRET || 'secret';


exports.register = async (req, res) => {
try {
const { username, password } = req.body;
if (!username || !password) return res.status(400).json({ message: 'Missing fields' });
const exists = await User.findOne({ username });
if (exists) return res.status(400).json({ message: 'Username exists' });
const hash = await bcrypt.hash(password, 10);
const user = await User.create({ username, passwordHash: hash });
const token = jwt.sign({ id: user._id, username }, JWT_SECRET, { expiresIn: '7d' });
res.json({ token, user: { id: user._id, username } });
} catch (err) {
console.error(err);
res.status(500).json({ message: 'Server error' });
}
};


exports.login = async (req, res) => {
try {
const { username, password } = req.body;
const user = await User.findOne({ username });
if (!user) return res.status(400).json({ message: 'Invalid credentials' });
const ok = await bcrypt.compare(password, user.passwordHash);
if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
const token = jwt.sign({ id: user._id, username }, JWT_SECRET, { expiresIn: '7d' });
res.json({ token, user: { id: user._id, username } });
} catch (err) {
console.error(err);
res.status(500).json({ message: 'Server error' });
}
};


// Simple authenticated route for front-end convenience
exports.authMe = async (req, res) => {
try {
const auth = req.headers.authorization;
if (!auth) return res.status(401).json({ message: 'No token' });
const token = auth.split(' ')[1];
const data = jwt.verify(token, JWT_SECRET);
res.json({ user: { id: data.id, username: data.username } });
} catch (err) {
res.status(401).json({ message: 'Invalid token' });
}
};