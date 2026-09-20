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
      <div className="app-shell"><div className="empty-state"><strong>Preparing your conversation</strong>Please wait while we load your secure chat.</div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="app-shell chat-app-shell">
      <div className="page-wrap">
        <header className="topbar">
          <button onClick={() => navigate("/dashboard")} className="btn btn-quiet" aria-label="Back to dashboard">← Back</button>
          <button onClick={handleLogout} className="btn btn-quiet">Log out</button>
        </header>

        <main className="chat-layout">
          <section className="surface chat-panel">
            <header className="chat-header">
              <div className="chat-person"><span className="avatar" aria-hidden="true">{friend.name?.slice(0, 1).toUpperCase()}</span><div><h1>{friend.name}</h1><p>End-to-end encrypted</p></div></div>
              <button onClick={() => navigate("/dashboard")} className="btn btn-secondary">All chats</button>
            </header>
            <div className="message-scroll">
              <div className="message-list">
              {messages
                .sort((a, b) => a.createdAt - b.createdAt)
                .map((m) => (
                  <div key={m._id} className={`message-line ${m.senderId === user._id ? "own" : ""}`}>
                    <div className="message-bubble">
                      <p className="message-text">{m.text}</p>
                      <div className="message-meta"><span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      {m.senderId === user._id && (
                        <span aria-label={`Message ${messageStatus[m._id] || STATUS.SENT}`}>{messageStatus[m._id] === STATUS.SENT && "✓"}{messageStatus[m._id] === STATUS.DELIVERED && "✓✓"}{messageStatus[m._id] === STATUS.SEEN && "✓✓"}</span>
                      )}
                      </div>
                    </div>
                  </div>
                ))}
              <div ref={scrollRef} />
              {!messages.length && <div className="empty-state"><strong>Start the conversation</strong>Say hello to {friend.name}.</div>}
              </div>
            </div>

            <form className="composer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
              <input
                aria-label="Message"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Write a message"
                className="input"
              />
              <button type="submit" disabled={!input.trim()} className="btn btn-primary">
                Send
              </button>
            </form>
          </section>

          <aside className="surface chat-aside">
            <p className="eyebrow">Conversation</p>
            <h2 className="section-title">Chat details</h2>
            <div className="detail"><p className="detail-label">Contact</p><p className="detail-value">{friend.name}</p></div>
            <div className="detail"><p className="detail-label">Privacy</p><p className="detail-value">Encrypted before sending</p></div>
          </aside>
        </main>
      </div>
    </div>
  );
}
