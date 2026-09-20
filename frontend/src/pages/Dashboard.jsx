import { useContext, useState , useEffect} from "react";
import FriendCard from "../components/FriendCard";
import { useNavigate } from "react-router-dom";
import { ChatContext } from "../contexts/chatContext";

export default function Dashboard() {
  const { user, friends, loadFriends, logout } = useContext(ChatContext);
  const navigate = useNavigate();

  const storedName = localStorage.getItem("name") || "";
  const userId = localStorage.getItem("id");

  const capitalize = (str) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  const name = capitalize(user?.name || storedName);

  useEffect(() => {
    if (!user && !userId) {
      navigate("/");
    }
  }, [user, userId, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Unified search
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState("");

  const filteredFriends = friends.filter(f =>
  f.name?.toLowerCase().startsWith(query.toLowerCase())
);


  // Search function (your backend uses ?username=)
  const searchUsers = async (text) => {
    setQuery(text);

    if (!text.trim()) {
      setSearchResults([]);
      setSearchError("");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/friends/search?username=${text}`
      );

      const data = await res.json();

      // Remove users already in friends
      const filtered = data.filter(
      (u) =>
        u._id !== userId &&                      
        !friends.some((f) => f._id === u._id)    
    );

      setSearchError("");
      setSearchResults(filtered);
    } catch (err) {
      console.log("Search failed:", err);
      setSearchError("Search is unavailable right now. Please try again.");
    }
  };

  useEffect(() => {
  console.log("Friends list:", friends);
}, [friends]);


  // Add friend using your working backend
  const addFriend = async (friendId) => {
    try {
      const res = await fetch("http://localhost:5000/api/friends/auto-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, friendId }),
      });

      console.log("Add friend response:", await res.json());

      // Reload friend list in dashboard
      loadFriends(userId);

      // Refresh search results
      searchUsers(query);

    } catch (err) {
      console.log("Failed to add friend:", err);
    }
  };

  const openChat = (friend) => {
    console.log(friend);
    navigate(`/chat/${friend._id}`, { state: { friend } });
  };

  return (
    <div className="app-shell">
      <div className="page-wrap">
        <header className="topbar">
          <span className="section-title">Messages</span>
          <button onClick={handleLogout} className="btn btn-quiet">Log out</button>
        </header>

        <main className="dashboard-grid">
          <section className="surface dashboard-main">
            <div className="section-heading">
              <div><p className="eyebrow">Your space</p><h1 className="page-title">Good to see you, {name}.</h1><p className="small-copy">Choose a conversation or find someone new.</p></div>
              <span className="small-copy">{friends.length} {friends.length === 1 ? "friend" : "friends"}</span>
            </div>

            <div className="search-row">
              <input type="text" aria-label="Search friends" placeholder="Search friends or usernames" value={query} onChange={(e) => searchUsers(e.target.value)} className="input" />
            </div>
            {searchError && <div className="auth-message error" role="alert">{searchError}</div>}

            {searchResults.length > 0 && (
              <div className="add-results">
                <p className="eyebrow">People you can add</p>
                {searchResults.map((u) => (
                  <div key={u._id} className="add-result">
                    <div className="friend-copy"><p className="friend-name">{capitalize(u.name)}</p><p className="friend-meta">Not in your conversations yet</p></div>
                    <button onClick={() => addFriend(u._id)} className="btn btn-secondary">Add</button>
                  </div>
                ))}
              </div>
            )}

            <div className="friend-list">
              {query.trim() ? (
                filteredFriends.length > 0 ? (
                  filteredFriends.map((friend) => (
                    <FriendCard
                      key={friend._id}
                      friend={friend}
                      onSelect={openChat}
                    />
                  ))
                ) : (
                  <div className="empty-state"><strong>No matching friends</strong>Try another name or search for someone new.</div>
                )
              ) : friends.length === 0 ? (
                  <div className="empty-state"><strong>Your conversations start here</strong>Search for a friend above to begin.</div>
              ) : (
                friends.map((friend) => (
                  <FriendCard
                    key={friend._id}
                    friend={friend}
                    onSelect={openChat}
                  />
                ))
              )}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
