import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ChatContext } from "../contexts/chatContext";
import nacl from "tweetnacl";
import { encodeBase64 } from "tweetnacl-util";
import {
  generateKeys,
  exportPrivateKey,
  exportPublicKey
} from "../utils/cryptoUtils";



const AuthForm = () => {

  const navigate = useNavigate();
  const { user, saveUser } = useContext(ChatContext);  

  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [responseMessage, setResponseMessage] = useState(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const url = isSignup
    ? "http://localhost:5000/auth/signup"
    : "http://localhost:5000/auth/login";

  let publicKey = null;
  let publicECDH = null;
  let publicSign = null;

  if (isSignup) {
    const keyPair = nacl.sign.keyPair();

    publicKey = encodeBase64(keyPair.publicKey);

    let privateECDH = localStorage.getItem("privateECDH");
 publicECDH  = localStorage.getItem("publicECDH");
let privateSign = localStorage.getItem("privateSign");
 publicSign  = localStorage.getItem("publicSign");

if (isSignup && (!privateECDH || !publicECDH || !privateSign || !publicSign)) {
  const { ecdhKeyPair, signKeyPair } = await generateKeys();

  privateECDH = await exportPrivateKey(ecdhKeyPair.privateKey);
  publicECDH  = await exportPublicKey(ecdhKeyPair.publicKey);
  privateSign = await exportPrivateKey(signKeyPair.privateKey);
  publicSign  = await exportPublicKey(signKeyPair.publicKey);

  localStorage.setItem("privateECDH", privateECDH);
  localStorage.setItem("publicECDH", publicECDH);
  localStorage.setItem("privateSign", privateSign);
  localStorage.setItem("publicSign", publicSign);
}
  }


  const body = isSignup
    ? {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        publicKey, 
        publicECDH,
        publicSign,
      }
    : {
        email: formData.email,
        password: formData.password,
      };

  try {
    const response = await axios.post(url, body, {
      headers: { "Content-Type": "application/json" },
    });

    setIsError(false);
    setResponseMessage("Success!");

    console.log("AUTH RESPONSE USER =", response.data.user);

    saveUser(response.data.user);
    navigate("/dashboard", { replace: true });

  } catch (error) {
    setIsError(true);
    setResponseMessage(error.response?.data?.msg || "Something went wrong");
  }
};

  return (
    <main className="auth-page">
      <div className="auth-layout">
        <section className="auth-intro">
          <div>
            <h1>Conversations that stay yours.</h1>
            <p>Private, direct messaging for the people you actually want to hear from.</p>
          </div>
          <p className="small-copy" style={{ color: "#91aaa1", margin: 0 }}>End-to-end encrypted by design.</p>
        </section>

        <section className="auth-form-panel">
          <p className="eyebrow">Private messaging</p>
          <h2>{isSignup ? "Create your account" : "Welcome back"}</h2>
          <p className="small-copy">{isSignup ? "Start a private conversation in a few seconds." : "Sign in to pick up where you left off."}</p>

          <form onSubmit={handleSubmit} className="auth-form">
            {isSignup && <div className="field"><label htmlFor="name">Name</label><input id="name" className="input" type="text" name="name" value={formData.name} onChange={handleChange} autoComplete="name" required /></div>}
            <div className="field"><label htmlFor="email">Email address</label><input id="email" className="input" type="email" name="email" value={formData.email} onChange={handleChange} autoComplete="email" required /></div>
            <div className="field"><label htmlFor="password">Password</label><input id="password" className="input" type="password" name="password" value={formData.password} onChange={handleChange} autoComplete={isSignup ? "new-password" : "current-password"} required /></div>
            <button type="submit" className="btn btn-primary">{isSignup ? "Create account" : "Sign in"}</button>
          </form>

          <p className="small-copy" style={{ marginTop: 22 }}>
            {isSignup ? "Already have an account?" : "New here?"}{" "}
            <button type="button" className="btn btn-quiet" style={{ minHeight: "auto", padding: 0, color: "var(--mint-700)" }} onClick={() => { setIsSignup(!isSignup); setResponseMessage(null); }}>
              {isSignup ? "Sign in" : "Create an account"}
            </button>
          </p>
          {responseMessage && <div className={`auth-message ${isError ? "error" : "success"}`}><strong>{isError ? "Could not continue" : "Success"}</strong><div>{responseMessage}</div></div>}
        </section>
      </div>
    </main>
  );
};

export default AuthForm;
