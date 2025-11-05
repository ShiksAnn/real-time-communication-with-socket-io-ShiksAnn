const mongoose = require('mongoose');
require('dotenv').config();


const connectDB = async () => {
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ChatBloom';
return mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
};


module.exports = connectDB;