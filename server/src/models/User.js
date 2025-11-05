const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({
username: { type: String, required: true, unique: true },
passwordHash: { type: String },
online: { type: Boolean, default: false },
socketId: { type: String, default: null },
}, { timestamps: true });


module.exports = mongoose.model('User', UserSchema);