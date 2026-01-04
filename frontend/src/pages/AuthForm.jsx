import React, { useState, useContext } from "react";
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
  const { saveUser } = useContext(ChatContext);  

  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [responseMessage, setResponseMessage] = useState(null);
  const [isError, setIsError] = useState(false);

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

    localStorage.setItem("privateKey", privateKey);
    localStorage.setItem("publicKey", publicKey);

    const { ecdhKeyPair, signKeyPair } = await generateKeys();

  const privateECDH = await exportPrivateKey(ecdhKeyPair.privateKey);
   publicECDH = await exportPublicKey(ecdhKeyPair.publicKey);

  const privateSign = await exportPrivateKey(signKeyPair.privateKey);
   publicSign = await exportPublicKey(signKeyPair.publicKey);

  // store PRIVATE keys locally
  localStorage.setItem("privateECDH", privateECDH);
  localStorage.setItem("privateSign", privateSign);
  localStorage.setItem("publicECDH", publicECDH);
  localStorage.setItem("publicSign", publicSign);

  console.log("publicECDH",publicECDH);
  console.log("publicSign",publicSign);

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
    navigate("/dashboard");

  } catch (error) {
    setIsError(true);
    setResponseMessage(error.response?.data?.msg || "Something went wrong");
  }
};

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="p-8 rounded-xl shadow-lg w-full max-w-md bg-white/5 border border-white/20 backdrop-blur-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-white">
          {isSignup ? "Sign Up" : "Log In"} to SmartStudy
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="block font-semibold mb-1 text-white">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border p-2 rounded bg-white/10 text-white placeholder-gray-300"
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
              className="w-full border p-2 rounded bg-white/10 text-white placeholder-gray-300"
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
              className="w-full border p-2 rounded bg-white/10 text-white placeholder-gray-300"
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
