import { useContext, useState , useEffect} from "react";
import FriendCard from "../components/FriendCard";
import { useNavigate } from "react-router-dom";
import { ChatContext } from "../contexts/chatContext";

export default function Dashboard() {
  const { friends, loadFriends } = useContext(ChatContext);
  const navigate = useNavigate();

  const storedName = localStorage.getItem("name") || "";
  const userId = localStorage.getItem("id");

  const capitalize = (str) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  const name = capitalize(storedName);

  // Unified search
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const filteredFriends = friends.filter(f =>
  f.name?.toLowerCase().startsWith(query.toLowerCase())
);


  // Search function (your backend uses ?username=)
  const searchUsers = async (text) => {
    setQuery(text);

    if (!text.trim()) {
      setSearchResults([]);
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

      setSearchResults(filtered);
    } catch (err) {
      console.log("Search failed:", err);
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
    <div className="h-screen w-full flex flex-col bg-gray-100">

      {/* HEADER */}
      <div className="bg-green-600 text-white px-5 py-4 flex items-center shadow-md">
        <h1 className="text-2xl font-bold">Hi, {name} 👋</h1>
      </div>

      {/* SEARCH BAR */}
      <div className="p-3 bg-white shadow-sm">
        <input
          type="text"
          placeholder="Search friends or add new friend…"
          value={query}
          onChange={(e) => searchUsers(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                     focus:ring-2 focus:ring-green-500 outline-none"
        />
      </div>

      {/* SEARCH RESULTS (ADD FRIEND) */}
      {searchResults.length > 0 && (
        <div className="p-3 bg-white shadow-md">
          <h2 className="text-md font-semibold text-gray-700 mb-3">
            Add New Friends
          </h2>

          {searchResults.map((u) => (
            <div
              key={u._id}
              className="flex justify-between items-center bg-gray-100 p-3 rounded-lg mb-2 border"
            >
              <span className="font-medium text-lg">{capitalize(u.name)}</span>

              <button
                onClick={() => addFriend(u._id)}
                className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
              >
                Add
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FRIEND LIST */}
      {/* FRIEND LIST */}
<div className="flex-1 overflow-y-auto p-3 space-y-3">

  {/* When searching: show only filtered friends */}
  {query.trim() ? (
    filteredFriends.length > 0 ? (
      filteredFriends.map(friend => (
        <FriendCard
          key={friend._id}
          friend={friend}
          onSelect={openChat}
        />
      ))
    ) : (
      <p className="text-gray-500 text-center mt-10">
        No matching friends
      </p>
    )
  ) : (
    /* When NOT searching: show all friends */
    friends.length === 0 ? (
      <p className="text-gray-500 text-center mt-10">
        No friends yet. Search and add someone!
      </p>
    ) : (
      friends.map(friend => (
        <FriendCard
          key={friend._id}
          friend={friend}
          onSelect={openChat}
        />
      ))
    )
  )}

</div>

    </div>
  );
}
