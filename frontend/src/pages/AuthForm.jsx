import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import bgImage from "./bg.jpg"; 
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
    const privateKey = encodeBase64(keyPair.secretKey);

    // console.log(privateKey);
    // console.log(publicKey);

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
    <div
      className="min-h-screen flex items-center justify-center bg-slate-950/95 p-4"
      style={{ backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="w-full max-w-md rounded-[32px] border border-white/20 bg-white/10 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
        <h2 className="text-3xl font-semibold text-center text-white sm:text-4xl">
          {isSignup ? "Sign Up" : "Log In"}
        </h2>
        <p className="mt-3 text-center text-sm text-slate-200">
          {isSignup
            ? "Create your secure chat account and start messaging."
            : "Enter your credentials to continue."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="block font-semibold mb-1 text-white">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-3xl border border-slate-200 bg-white/10 px-4 py-3 text-white placeholder-slate-300 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold mb-1 text-white">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-3xl border border-slate-200 bg-white/10 px-4 py-3 text-white placeholder-slate-300 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-white">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-3xl border border-slate-200 bg-white/10 px-4 py-3 text-white placeholder-slate-300 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-2 rounded font-semibold hover:bg-purple-700"
          >
            {isSignup ? "Sign Up" : "Log In"}
          </button>
        </form>

        <p className="text-sm text-center mt-4 text-white">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => {
              setIsSignup(!isSignup);
              setResponseMessage(null);
            }}
            className="text-blue-400 hover:underline"
          >
            {isSignup ? "Log In" : "Sign Up"}
          </button>
        </p>

        {responseMessage && (
          <div
            className={`mt-6 p-4 text-sm rounded break-words ${
              isError
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            <strong>{isError ? "Error" : "Success"}:</strong>
            <pre className="whitespace-pre-wrap break-all mt-1">
              {responseMessage}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
