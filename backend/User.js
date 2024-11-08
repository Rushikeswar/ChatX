import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  lastReadMessages: [
    { receiver: mongoose.Schema.Types.ObjectId,
      lastReadMessageId: mongoose.Schema.Types.ObjectId
    }]
});
const User = mongoose.model('User', userSchema);
export {User};

