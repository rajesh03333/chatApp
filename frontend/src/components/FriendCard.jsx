export default function FriendCard({ friend, onSelect }) {
  if (!friend) return null;

  return (
    <button
      onClick={() => onSelect(friend)}
      className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
    >
      <h3 className="text-lg font-semibold text-slate-900">{friend.name}</h3>
      <p className="mt-1 text-sm text-slate-500">Tap to open a secure chat</p>
    </button>
  );
}
