import { createContext, useState, useEffect } from "react";

export const ChatContext = createContext();

export default function ChatProvider({ children }) {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);

  const loadFriends = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/friends/${userId}`);
      const data = await res.json();
      setFriends(data);
    } catch (err) {
      console.log("Failed to load friends:", err);
    }
  };

  const saveUser = (userData) => {
    localStorage.setItem("id", userData._id);
    localStorage.setItem("name", userData.name);
    localStorage.setItem("email", userData.email);
    localStorage.setItem("publicKey", userData.publicKey);
    localStorage.setItem("publicECDH",userData.publicECDH);
    localStorage.setItem("publicSign",userData.publicSign);

    setUser(userData);

    if (userData._id) {
      loadFriends(userData._id);
    }
  };

  useEffect(() => {
    const id = localStorage.getItem("id");
    const name = localStorage.getItem("name");
    const email = localStorage.getItem("email");
    const publicKey = localStorage.getItem("publicKey");
    const publicECDH = localStorage.getItem("publicECDH");
    const publicSign = localStorage.getItem("publicSign");

    if (!id || !name) {
      console.log("No user in localStorage");
      return;
    }

    const u = { _id: id, name, email, publicKey, publicECDH, publicSign };

    setUser(u);
    loadFriends(id);

  }, []);

  return (
    <ChatContext.Provider value={{
      user,
      setUser,
      friends,
      loadFriends,
      saveUser
    }}>
      {children}
    </ChatContext.Provider>
  );
}
