export default function FriendCard({ friend, onSelect }) {
  if (!friend) return null;

  const initials = friend.name?.slice(0, 1).toUpperCase() || "?";

  return (
    <button
      onClick={() => onSelect(friend)}
      className="friend-row"
    >
      <span className="avatar" aria-hidden="true">{initials}</span>
      <span className="friend-copy">
        <span className="friend-name">{friend.name}</span>
        <span className="friend-meta"><span className="status-dot" aria-hidden="true" /> Available for a secure chat</span>
      </span>
      <span className="muted" aria-hidden="true">→</span>
    </button>
  );
}
