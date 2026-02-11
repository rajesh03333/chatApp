import { useEffect, useState, useContext, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
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
  const { user, saveUser } = useContext(ChatContext);

  const friend = state?.friend;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");


  const [messageStatus, setMessageStatus] = useState({});

  const scrollRef = useRef();

  const roomKey =
    user?._id < friendId
      ? `${user?._id}-${friendId}`
      : `${friendId}-${user?._id}`;

useEffect(() => {
  const chat = gun.get(roomKey);

  chat.map().on(async (msg, id) => {
    if (!msg?.ciphertext) return;
    console.log("Entered");
    console.log("Not same");

    try {
      const privateECDH = localStorage.getItem("privateECDH");
      const privateSign = localStorage.getItem("privateSign");

      

      if (!privateECDH || !privateSign) return;
      if (!msg.senderPublicECDH || !msg.senderPublicSign) return;

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
          status: STATUS.DELIVERED
        });
      }
      

      const keyStart = performance.now();
      const sharedKey = await deriveSharedSecret(
        privateECDH,
        msg.senderPublicECDH,
      );
      const keyEnd = performance.now();

      const decryptStart = performance.now();
      const plaintext = await decryptMessage(
        msg.ciphertext,
        msg.iv,
        sharedKey
      );
      const decryptEnd = performance.now();

      const e2eLatency = Date.now() - msg.createdAt;

      console.log(msg.ciphertext);
      console.log(plaintext);

      console.log("📊 LATENCY");
      console.log("E2E:", e2eLatency, "ms");
      console.log("Verify:", verifyEnd - verifyStart, "ms");
      console.log("Key Derive:", keyEnd - keyStart, "ms");
      console.log("Decrypt:", decryptEnd - decryptStart, "ms");

      setMessages(prev => {
        if (prev.find(m => m._id === id)) return prev;
        return [...prev, {
          _id: id,
          senderId: msg.senderId,
          text: plaintext,
          createdAt: msg.createdAt,
          latencyMs: e2eLatency
        }];
      });

     
      if (msg.status) {
        setMessageStatus(prev => ({
          ...prev,
          [id]: msg.status
        }));
      }
      

    } catch (err) {
      console.error("Decrypt failed:", err);
    }
  });

  return () => gun.get(roomKey).off();
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

  const publicECDH=friend.publicECDH;
  const publicSign=friend.publicSign;

   console.log("publicECDH",publicECDH);

  if (!privateECDH || !privateSign || !publicECDH || !publicSign) return;

  const t0 = performance.now();

  console.log("privateECDH",privateECDH);
  console.log("privateSign",privateSign);
  console.log("friendECDH",publicECDH);
  console.log("userECDH",user.publicECDH);

  if (!friend?.publicECDH || !friend?.publicSign) return;

  const sharedKeyCache = new Map();

const cacheKey = publicECDH;

let sharedKey = sharedKeyCache.get(cacheKey);

if (!sharedKey) {
  sharedKey = await deriveSharedSecret(
    privateECDH,
    cacheKey
  );
  sharedKeyCache.set(cacheKey, sharedKey);
}

  console.log("SharedKey",sharedKey);
  
  const t1 = performance.now();

  const { cipher, iv } = await encryptMessage(input, sharedKey);
  const t2 = performance.now();

  const signature = await signMessage(cipher, privateSign);
  const t3 = performance.now();

  
  const msgId = Gun.text.random(8);
  

  gun.get(roomKey).set({
    _id: msgId,

    senderId: user._id,

    senderPublicECDH: user.publicECDH,
    senderPublicSign: user.publicSign,

    ciphertext: cipher,
    iv,
    signature,

    createdAt: Date.now(),

    
    status: STATUS.SENT,
    

    perf: {
      encryptMs: t2 - t1,
      signMs: t3 - t2,
      totalCryptoMs: t3 - t0
    }
  });

  console.log("totalMs",t3-t0);

  setMessageStatus(prev => ({
    ...prev,
    [msgId]: STATUS.SENT
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
    return <h2 style={{ padding: 20 }}>Loading chat...</h2>;
  }

  return (
    <div
      style={{
        padding: 20,
        height: "90vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h2>Chat with {friend.name}</h2>

      <div
        style={{
          flex: 1,
          overflowY: "scroll",
          marginTop: 10,
          padding: 10,
          border: "1px solid #ccc",
          borderRadius: 8,
          background: "#fafafa",
        }}
      >
        {messages
          .sort((a, b) => a.createdAt - b.createdAt)
          .map((m, idx) => (
            <div
              key={idx}
              style={{
                textAlign: m.senderId === user._id ? "right" : "left",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "8px 14px",
                  borderRadius: "14px",
                  background:
                    m.senderId === user._id ? "#d1e7ff" : "#e8e8e8",
                }}
              >
                <strong>{m.senderId === user._id ? "You" : m.sender}</strong>
                <p style={{ marginTop: 4 }}>{m.text}</p>

                {m.senderId === user._id && (
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    {messageStatus[m._id] === STATUS.SENT && "✓"}
                    {messageStatus[m._id] === STATUS.DELIVERED && "✓✓"}
                    {messageStatus[m._id] === STATUS.SEEN && (
                      <span style={{ color: "#4fc3f7" }}>seen</span>
                    )}
                  </div>
                )}
                

              </div>
            </div>
          ))}

        <div ref={scrollRef} />
      </div>

      <div style={{ display: "flex", marginTop: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message..."
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 6,
            border: "1px solid #bbb",
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            marginLeft: 10,
            padding: "10px 20px",
            borderRadius: 6,
            border: "none",
            background: "#5b2be0",
            color: "white",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
