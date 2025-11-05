const mongoose = require('mongoose');


const MessageSchema = new mongoose.Schema({
sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
room: { type: String, required: true }, // room id or "global"
content: { type: String },
type: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
meta: { type: Object }, // for file urls, reactions, etc
readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });


module.exports = mongoose.model('Message', MessageSchema);