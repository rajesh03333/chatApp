import { useEffect, useState, useContext, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import Gun from "gun";
import { deriveSharedSecret, encryptMessage, decryptMessage, signMessage, verifySignature } from "../utils/cryptoUtils";
import { ChatContext } from "../contexts/chatContext";

const gun = Gun({
  peers: ["http://localhost:8765/gun"]
});


const STATUS = {
  SENT: "sent",
  DELIVERED: "delivered",
  SEEN: "seen",
};


export default function ChatRoom() {
  const { id: friendId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user, friends, logout } = useContext(ChatContext);

  const friend = state?.friend || friends.find((f) => f._id === friendId);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const capitalize = (text) =>
    text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : "";

  const [messageStatus, setMessageStatus] = useState({});
  const sharedKeyCache = useRef(new Map());
  const scrollRef = useRef();

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    if (user && !friend) {
      navigate("/dashboard");
    }
  }, [user, friend, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const roomKey =
    user?._id && friendId
      ? user._id < friendId
        ? `${user._id}-${friendId}`
        : `${friendId}-${user._id}`
      : null;

useEffect(() => {
  if (!roomKey) return;
  const chat = gun.get(roomKey);
  const chatMap = chat.map();

  chatMap.on(async (msg, id) => {
    if (!msg) return;

    const messageId = msg._id || id;
    const isOwnMessage = msg.senderId === user._id;

    if (msg.status) {
      setMessageStatus((prev) => ({
        ...prev,
        [messageId]: msg.status,
      }));
    }

    if (
      !msg.ciphertext ||
      !msg.iv ||
      !msg.signature ||
      !msg.senderPublicECDH ||
      !msg.senderPublicSign ||
      !msg.createdAt ||
      !msg.senderId
    ) {
      return;
    }

    console.log("Entered");
    console.log("Not same");

    try {
      const privateECDH = localStorage.getItem("privateECDH");
      const privateSign = localStorage.getItem("privateSign");

      if (!privateECDH || !privateSign) return;

      const verifyStart = performance.now();

      const valid = await verifySignature(
        msg.ciphertext,
        msg.signature,
        msg.senderPublicSign
      );
      const verifyEnd = performance.now();

      if (!valid) {
        console.log("Not Valid");
        return;
      }

      console.log("Verified");

      if (msg.senderId !== user._id && msg.status === STATUS.SENT) {
        gun.get(roomKey).get(id).put({
          status: STATUS.DELIVERED,
        });
      }

      const decryptPublicECDH = isOwnMessage
        ? msg.recipientPublicECDH
        : msg.senderPublicECDH;

      if (!decryptPublicECDH) {
        return;
      }

      const cacheKey = decryptPublicECDH;
      const cached = sharedKeyCache.current.get(cacheKey);
      const keyStart = performance.now();
      const sharedKey = cached
        ? cached
        : await deriveSharedSecret(privateECDH, decryptPublicECDH);
      if (!cached) {
        sharedKeyCache.current.set(cacheKey, sharedKey);
      }
      const keyEnd = performance.now();

      const decryptStart = performance.now();
      const plaintext = await decryptMessage(msg.ciphertext, msg.iv, sharedKey);
      const decryptEnd = performance.now();

      const e2eLatency = Date.now() - msg.createdAt;

      console.log(msg.ciphertext);
      console.log(plaintext);

      console.log("📊 LATENCY");
      console.log("E2E:", e2eLatency, "ms");
      console.log("Verify:", verifyEnd - verifyStart, "ms");
      console.log("Key Derive:", keyEnd - keyStart, "ms");
      console.log("Decrypt:", decryptEnd - decryptStart, "ms");

      setMessages((prev) => {
        if (prev.find((m) => m._id === messageId)) return prev;
        return [
          ...prev,
          {
            _id: messageId,
            senderId: msg.senderId,
            text: plaintext,
            createdAt: msg.createdAt,
            latencyMs: e2eLatency,
          },
        ];
      });

      if (msg.status) {
        setMessageStatus((prev) => ({
          ...prev,
          [messageId]: msg.status,
        }));
      }
      

    } catch (err) {
      console.error("Decrypt failed:", err);
    }
  });

  return () => chatMap.off();
}, [roomKey, user?._id]);


useEffect(() => {
  if (!messages.length) return;

  const lastMsg = messages[messages.length - 1];

  if (
    lastMsg.senderId !== user._id &&
    messageStatus[lastMsg._id] === STATUS.DELIVERED
  ) {
    gun.get(roomKey).get(lastMsg._id).put({
      status: STATUS.SEEN
    });
  }
}, [messages, messageStatus, roomKey, user?._id]);



  const sendMessage = async () => {
    try {
      console.log("Send Message clicked");
      if (!input.trim()) return;

      const privateECDH = localStorage.getItem("privateECDH");
      const privateSign = localStorage.getItem("privateSign");

  console.log(friend);

  if (!friend || !roomKey) {
    console.warn("ChatRoom: cannot send message, missing friend or room key.");
    return;
  }

  const publicECDH = friend.publicECDH;
  const publicSign = friend.publicSign;

  console.log("publicECDH", publicECDH);

  if (!privateECDH || !privateSign || !publicECDH || !publicSign) return;

  const t0 = performance.now();

  console.log("privateECDH",privateECDH);
  console.log("privateSign",privateSign);
  console.log("friendECDH",publicECDH);
  console.log("userECDH",user.publicECDH);

  if (!friend?.publicECDH || !friend?.publicSign) return;

  const cacheKey = publicECDH;
  let sharedKey = sharedKeyCache.current.get(cacheKey);
  if (!sharedKey) {
    sharedKey = await deriveSharedSecret(privateECDH, cacheKey);
    sharedKeyCache.current.set(cacheKey, sharedKey);
  }
  console.log("Cached shared key used:", !!sharedKey);

  console.log("SharedKey",sharedKey);
  
  const t1 = performance.now();

  const { cipher, iv } = await encryptMessage(input, sharedKey);
  const t2 = performance.now();

  const signature = await signMessage(cipher, privateSign);
  const t3 = performance.now();

  
  const msgId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `msg-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  

  gun.get(roomKey).set({
    _id: msgId,
    senderId: user._id,

    senderPublicECDH: user.publicECDH,
    senderPublicSign: user.publicSign,
    recipientPublicECDH: publicECDH,
    recipientPublicSign: publicSign,

    ciphertext: cipher,
    iv,
    signature,

    createdAt: Date.now(),
    status: STATUS.SENT,

    perf: {
      encryptMs: t2 - t1,
      signMs: t3 - t2,
      totalCryptoMs: t3 - t0,
    },
  });

  console.log("totalMs",t3-t0);

  setMessages((prev) => [
    ...prev,
    {
      _id: msgId,
      senderId: user._id,
      text: input,
      createdAt: Date.now(),
      latencyMs: 0,
    },
  ]);

  setMessageStatus((prev) => ({
    ...prev,
    [msgId]: STATUS.SENT,
  }));

  setInput("");

    try {
      await fetch("http://localhost:5000/api/friends/auto-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          friendId: friendId,
        }),
      });
    } catch (err) {
      console.log("Failed to auto-add friend:", err);
    }
   } catch (err) {
    console.error("Send failed:", err);
  }
};

  if (!user || !friend) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-slate-700">
        <div className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/80 text-center">
          <h2 className="text-xl font-semibold">Loading chat…</h2>
          <p className="mt-2 text-sm text-slate-500">Please wait while we prepare your secure conversation.</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-4 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <div className="rounded-3xl bg-white p-4 shadow-sm shadow-slate-200/80 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Secure Chat Room</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">Chat with {friend.name}</h2>
              <p className="mt-2 text-sm text-slate-600">Encryption, delivery receipts, and responsive layout.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Back to dashboard
              </button>
              <button
                onClick={handleLogout}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="flex min-h-[520px] flex-col rounded-3xl bg-white p-4 shadow-sm shadow-slate-200/70 sm:p-6">
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {messages
                .sort((a, b) => a.createdAt - b.createdAt)
                .map((m) => (
                  <div
                    key={m._id}
                    className={`flex ${m.senderId === user._id ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[85%] rounded-3xl p-4 shadow-sm ${m.senderId === user._id ? "bg-emerald-100 text-slate-900" : "bg-slate-100 text-slate-900"}`}>
                      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                        <span>{m.senderId === user._id ? "You" : friend.name}</span>
                        <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="mt-2 break-words text-sm leading-6">{m.text}</p>
                      {m.senderId === user._id && (
                        <div className="mt-3 text-right text-xs text-slate-500">
                          {messageStatus[m._id] === STATUS.SENT && "✓ Sent"}
                          {messageStatus[m._id] === STATUS.DELIVERED && "✓✓ Delivered"}
                          {messageStatus[m._id] === STATUS.SEEN && "✓✓ Seen"}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              <div ref={scrollRef} />
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a secure message..."
                className="flex-1 rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
              <button
                onClick={sendMessage}
                className="rounded-3xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:w-auto"
              >
                Send
              </button>
            </div>
          </div>

          <aside className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200/70">
            <h3 className="text-lg font-semibold text-slate-900">Chat details</h3>
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              <div>
                <p className="font-semibold text-slate-800">Friend</p>
                <p>{friend.name}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-800">Status</p>
                <p className="text-emerald-600">Connected</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-800">Tips</p>
                <p className="mt-2 leading-6 text-slate-600">
                  Your messages are encrypted before they leave your browser. Delivery receipts update in real time.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
