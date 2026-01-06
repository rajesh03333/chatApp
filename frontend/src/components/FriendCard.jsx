export default function FriendCard({ friend, onSelect }) {
  if (!friend) return null;

  return (
    <div
      onClick={() => onSelect(friend)}
      style={{
        padding: "12px",
        marginBottom: "10px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        background: "#f8f8f8",
        cursor: "pointer",
      }}
    >
      <h3 style={{ marginBottom: "6px" }}>{friend.name}</h3>

    </div>
  );
}
