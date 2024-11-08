import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import '../css/ChatRoom.css';

const socket = io('http://localhost:3000', { reconnection: true });

const ChatRoom = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [receiverUsername, setReceiverUsername] = useState('');
  const [users, setUsers] = useState([]);  // Store searched users
  const [previousUsers, setPreviousUsers] = useState([]);  // Store previously messaged users with unread count
  const [searchQuery, setSearchQuery] = useState('');
  const [senderId, setSenderId] = useState(sessionStorage.getItem('user_id'));
  const [receiverId, setReceiverId] = useState('');

  const messagesEndRef = useRef(null);

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scroll only when messages are updated
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle searching users
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setUsers([]);
    }
  }, [searchQuery]);

  // Listen to incoming messages and append to the chat
  useEffect(() => {
    socket.on('receiveMessage', (msg) => {
      if (msg.sender === receiverId) {
        setMessages((prevMessages) => [...prevMessages, msg]);
        fetch(`http://localhost:3000/markMessagesAsRead/${receiverId}/${senderId}`, {
          method: 'POST',
        }).catch((err) => console.error('Failed to mark messages as read:', err));
      }
    });
    return () => {
      socket.off('receiveMessage');
    };
  }, [senderId, receiverId]);

  // Handle joining the room and unread message count
  useEffect(() => {
    if (senderId) {
      socket.emit('joinUserRoom', senderId);
    }

    socket.on('checkActiveConversation', (senderId, callback) => {
      const isActive = receiverId === senderId;
      callback(isActive);
    });

    socket.on('increaseUnreadCount', (senderId) => {
      updateUnreadCount(senderId);
    });

    return () => {
      socket.off('checkActiveConversation');
      socket.off('increaseUnreadCount');
    };
  }, [senderId, receiverId]);

  // Fetch previously messaged users
  useEffect(() => {
    const fetchPreviousUsers = async () => {
      try {
        const response = await fetch(`http://localhost:3000/previousMessagedUsers/${senderId}`);
        if (!response.ok) {
          const errorResponse = await response.json();
          console.log(errorResponse.errormessage);
        } else {
          const data = await response.json();
          setPreviousUsers(data);
        }
      } catch (err) {
        console.error('Failed to fetch previously messaged users:', err);
      }
    };

    if (senderId) fetchPreviousUsers();
  }, [senderId]);

  const searchUsers = async (query) => {
    if (query.trim().length === 0) return;
    try {
      const response = await fetch(`http://localhost:3000/searchUsers?query=${query}`, { credentials: 'include' });
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Failed to search users:', err);
    }
  };

  const fetchMessages = async (receiverId) => {
    if (!receiverId || !senderId) {
      console.error('Invalid receiverId or senderId');
      return;
    }
    try {
      const response = await fetch(`http://localhost:3000/messages/${senderId}/${receiverId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        console.error('Failed to fetch messages');
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const sendMessage = () => {
    if (!receiverId) {
      alert('Please select a user to chat with!');
      return;
    }
    const msg = { senderId, receiverId, content: message };
    socket.emit('sendMessage', msg);
    setMessage('');
    fetchMessages(receiverId);
  };

  const updateUnreadCount = (userId) => {
    setPreviousUsers((prevUsers) =>
      prevUsers.map((user) =>
        user._id === userId ? { ...user, unreadCount: user.unreadCount + 1 } : user
      )
    );
  };

  const updateUnread = (userId, x) => {
    setPreviousUsers((prevUsers) =>
      prevUsers.map((user) =>
        user._id === userId ? { ...user, unreadCount: x } : user
      )
    );
  };

  const handleUserClick = (user) => {
    if (!user || !user._id) {
      console.error('Invalid user clicked');
      return;
    }
    setReceiverId(user._id);
    setReceiverUsername(user.username);
    fetchMessages(user._id);
    updateUnread(user._id, 0);

    fetch(`http://localhost:3000/markMessagesAsRead/${user._id}/${senderId}`, {
      method: 'POST',
    }).catch((err) => console.error('Failed to mark messages as read:', err));
  };
  const getTime = (timestamp) => {
    // Ensure that the timestamp is converted to a Date object
    const date = new Date(timestamp);
  
    if (isNaN(date.getTime())) {
      console.error("Invalid Date object:", timestamp);
      return "Invalid time";
    }
  
    // Extract hours and minutes in HH:mm format
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  
    return `${hours}:${minutes}`;  // Returns time in HH:mm format
  };
  
  return (
    <div className="chat-room">
      {/* Search Bar */}
      <div className='user-list-section'>
      <div>
        <input
          type="text"
          placeholder="Search for a user..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchUsers(e.target.value);
          }}
        />
      </div>

      {/* Search Results */}
      <div className="user-list">
        {users.map((user) => (
          user._id !== senderId && <div key={user._id} onClick={() => handleUserClick(user)}>
            {user.username}
          </div>
        ))}
      </div>
      
      {/* Previously Messaged Users */}
      <h3>Chats</h3>
      <div className="user-list">
        {previousUsers.map((user) => (
          <div key={user._id} onClick={() => handleUserClick(user)}>
            {user.username} {(user.unreadCount > 0 && user._id !== receiverId) && <span> ({user.unreadCount} unread)</span>}
          </div>
        ))}
      </div>
      </div>

        <div className='chat-section'>
      {/* Chat with Selected User */}
      <h3>Chatting with: {receiverUsername || 'No user selected'}</h3>
      {receiverUsername && (
        <div className="messages">
          {messages.map((msg, i) => (
            <p key={i} className={msg.sender === senderId ? 'message right' : 'message left'}>
              {/* {msg.sender === senderId ? 'You' : receiverUsername}:  */}
              <div className='msgbox'>
              <span className='msgcontent'>{msg.content}</span>
              <span className='time'>{getTime(msg.timestamp)}</span>
              </div>
            </p>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Message Input */}
      <div className="message-input">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
    </div>
  );
};

export default ChatRoom;
