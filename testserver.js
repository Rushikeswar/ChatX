import express, { Router } from 'express';
import http from 'http';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import ObjectId from 'mongodb';
const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});
app.use(express.json());
app.use(cookieParser());
const server = http.createServer(app);

import { connecttomongodb } from './backend/connect.js';
import { Message } from './backend/MessageSchema.js';
import { User } from './backend/User.js';
import {Chatroom} from './backend/ChatroomSchema.js';
const mongodburl = 'mongodb://localhost:27017/Chat';
connecttomongodb(mongodburl)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins their personal room based on their userId
  socket.on('joinUserRoom', (userId) => {
    socket.join(userId);  // Join a room with the userId
    console.log(`User with ID ${userId} joined their room.`);
  });

  socket.on('checkActiveConversation', async (senderId, callback) => {
    const isActive = receiverId === senderId;
    callback(isActive);  // Pass the result back to the client
  });
  // Send message from one user to another
  socket.on('sendMessage', async (messageData) => {
    const { senderId, receiverId, content } = messageData;
  
    // Save the message to the database
    const newMessage = new Message({
      sender: senderId,
      content: content,
      receiver: receiverId,
      isRead: false,  // Message is unread by default
    });
  
    await newMessage.save();
    // Check if the receiver is logged in
    const receiverRoom = io.sockets.adapter.rooms.get(receiverId);
    
    if (receiverRoom) {
      // The receiver is logged in; emit the message to the receiver's room
      io.to(receiverId).emit('receiveMessage', newMessage);
  
      // Check if the receiver is actively chatting with the sender
      socket.broadcast.to(receiverId).emit('checkActiveConversation', senderId, (isActive) => {
          socket.to(receiverId).emit('increaseUnreadCount', senderId);
      });
    }
  
    // Send the message back to the sender so they can see it in their UI as well
    io.to(senderId).emit('receiveMessage', newMessage);
  });
  

  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
  });
});

// API for registering new users
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const existingUser = await User.findOne({ username });
  const existingEmail = await User.findOne({ email });

  if (existingEmail) {
    return res.status(409).json({ errormessage: 'Email already exists' });
  }
  if (existingUser) {
    return res.status(409).json({ errormessage: 'Username already exists' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, email, password: hashedPassword });
  await newUser.save();
  res.json(newUser);
});

// API for logging in
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && await bcrypt.compare(password, user.password)) {
    res.json({ user });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});


app.get('/searchUsers', async (req, res) => {
  const { query } = req.query;
  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'Search query cannot be empty' });
  }
  try {
    const users = await User.find({ username: { $regex: query, $options: 'i' } });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search users' });
  }
});


// Route to fetch messages and mark them as read
app.get('/messages/:senderId/:receiverId', async (req, res) => {
  const { senderId, receiverId } = req.params;
  try {
    // Fetch messages between sender and receiver
    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    }).sort({ createdAt: 1 });

    // Mark all unread messages from receiver as read when user views the chat
    await Message.updateMany(
      { sender: receiverId, receiver: senderId, isRead: false },
      { $set: { isRead: true } }
    );

    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      await User.updateOne(
        { _id:new  mongoose.Types.ObjectId(senderId) },
        { $pull: { lastReadMessages: { receiver: new mongoose.Types.ObjectId(receiverId) } } }
      );
      await User.updateOne(
        { _id:new  mongoose.Types.ObjectId(senderId) },
        { $push: { lastReadMessages: { receiver: new mongoose.Types.ObjectId(receiverId), lastReadMessageId: lastMessage._id } } }
      );
    }

    res.json(messages);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error occurred!' });
  }
});

// Mark messages as read when a user opens the chat
app.post('/markMessagesAsRead/:senderId/:receiverId', async (req, res) => {
  const { senderId, receiverId } = req.params;
  try {
    await Message.updateMany(
      { receiver: receiverId, sender: senderId, isRead: false },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to mark messages as read:', err);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

app.get('/previousMessagedUsers/:userId', async (req, res) => {
  const userId = req.params.userId; // Assuming userId is a valid ObjectId

  try {
    const previousUsers = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender:new mongoose.Types.ObjectId(userId) },
            { receiver:new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender',new mongoose.Types.ObjectId(userId)] },
              '$receiver',
              '$sender'
            ]
          },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiver', new mongoose.Types.ObjectId(userId)] }, { $eq: ['$isRead', false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        // Look up the user details from the User collection
        $lookup: {
          from: 'users', // The name of the user collection
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        // Unwind the userDetails array to simplify the structure
        $unwind: {
          path: '$userDetails',
          preserveNullAndEmptyArrays: true // Optional: if you want to keep messages without users
        }
      },
      {
        $project: {
          _id: 1,
          unreadCount: 1,
          username:'$userDetails.username',
        }
      }
    ]);
    console.log(previousUsers);
    res.json(previousUsers);
  } catch (err) {
    console.error('Failed to fetch previous users:', err);
    res.status(500).json({ error: 'Failed to fetch previous users' });
  }
});

const port = 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
