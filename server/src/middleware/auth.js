const jwt = require('jsonwebtoken');
require('dotenv').config();


module.exports = (req, res, next) => {
try {
const auth = req.headers.authorization;
if (!auth) return res.status(401).json({ message: 'No token' });
const token = auth.split(' ')[1];
const data = jwt.verify(token, process.env.JWT_SECRET || 'secret');
req.user = data;
next();
} catch (err) {
res.status(401).json({ message: 'Unauthorized' });
}
};