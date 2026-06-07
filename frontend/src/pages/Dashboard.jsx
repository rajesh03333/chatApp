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
    <div className="min-h-screen w-full bg-slate-50 px-4 py-4 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <header className="rounded-3xl bg-gradient-to-r from-emerald-600 to-green-500 p-5 text-white shadow-lg shadow-emerald-200/30">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-100/90">
                Welcome back
              </p>
              <h1 className="text-3xl font-semibold sm:text-4xl">Hi, {name} 👋</h1>
              <p className="mt-2 text-sm text-emerald-100/90 max-w-2xl">
                Find a friend, join a chat, and keep your messages secure.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                disabled
                className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white opacity-70 cursor-not-allowed transition"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                Log out
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Friends & Chats</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tap a friend to open the conversation.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                {friends.length} friends
              </div>
            </div>

            <div className="w-full">
              <input
                type="text"
                placeholder="Search friends or add a new friend…"
                value={query}
                onChange={(e) => searchUsers(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-3 rounded-3xl bg-slate-50 p-4">
                <h3 className="text-base font-semibold text-slate-800">
                  Add new friends
                </h3>
                {searchResults.map((u) => (
                  <div
                    key={u._id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-base font-medium text-slate-900">
                        {capitalize(u.name)}
                      </p>
                      <p className="text-sm text-slate-500">Tap Add to connect</p>
                    </div>
                    <button
                      onClick={() => addFriend(u._id)}
                      className="w-full rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:w-auto"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
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
                  <p className="py-10 text-center text-sm text-slate-500">
                    No matching friends.
                  </p>
                )
              ) : friends.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  No friends yet. Search and add someone!
                </p>
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

          <section className="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/60">
            <h2 className="text-xl font-semibold text-slate-900">Quick tips</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Use search to add new friends quickly, then tap any friend card to start a secure chat. Your messages are encrypted end-to-end and delivered in real-time.
            </p>
            <div className="mt-6 grid gap-4 text-sm text-slate-700">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold">Responsive layout</p>
                <p className="mt-1 text-slate-600">The dashboard adapts to mobile and desktop screens.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold">Secure chat</p>
                <p className="mt-1 text-slate-600">Every message is encrypted and signed before sending.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
