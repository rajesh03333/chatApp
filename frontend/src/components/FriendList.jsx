import { useState, useContext } from "react";
import { ChatContext } from "../contexts/chatContext";

export default function FriendList() {
  const { user, loadFriends } = useContext(ChatContext);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const searchUsers = async () => {
    if (!query.trim()) return;

    const res=await fetch(`http://localhost:5000/api/friends/search?username=${query}`);
    const data = await res.json();
    setResults(data);
  };

  const addFriend = async (friendId) => {
    await fetch("http://localhost:5000/api/friends/auto-add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user._id,
        friendId,
      }),
    });

    loadFriends(user._id);
  };

  return (
    <div style={{ padding: "10px" }}>
      <h2>Find Friends</h2>

      <input
        type="text"
        value={query}
        placeholder="Search by username..."
        onChange={(e) => setQuery(e.target.value)}
        style={{
          padding: "8px",
          width: "80%",
          marginBottom: "10px",
        }}
      />

      <button
        onClick={searchUsers}
        style={{
          padding: "8px 15px",
          cursor: "pointer",
        }}
      >
        Search
      </button>

      <div style={{ marginTop: "20px" }}>
        {results.map((u) => (
          <div
            key={u._id}
            style={{
              padding: "10px",
              borderBottom: "1px solid #ddd",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{u.name}</span>

            {u._id !== user._id && (
              <button
                onClick={() => addFriend(u._id)}
                style={{
                  padding: "6px 10px",
                  cursor: "pointer",
                }}
              >
                Add Friend
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
