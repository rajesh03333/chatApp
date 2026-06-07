# Decentralized Secure Chat Application

## Problem Statement

Most modern chat applications rely on centralized servers to store and manage user data and messages. This creates several issues:

- Single point of failure
- Privacy concerns due to centralized data control
- Risk of data breaches
- Lack of true end-to-end ownership of communication
- Trust dependency on third-party servers

There is a need for a secure, real-time communication system that ensures privacy, authenticity, and decentralization without depending on traditional backend servers.

---

## About the Project

The Decentralized Secure Chat Application is a real-time peer-to-peer messaging platform built using React and GUN.js. The application eliminates centralized backend dependency and instead uses a decentralized graph-based database for communication.

The core focus of this project is security and privacy. Messages are encrypted before storage, digitally signed by the sender, and decrypted only by the intended recipient. The system ensures confidentiality, integrity, and authenticity of communication.

This project demonstrates the integration of decentralized architecture with applied cryptography in a full-stack web application.

---

## How the Project Solves the Problem

1. Eliminates Centralized Server Dependency  
   The application uses GUN.js for decentralized data synchronization, removing the need for a traditional backend server.

2. Ensures End-to-End Encryption  
   Messages are encrypted using a shared secret derived through cryptographic key exchange. Only the receiver can decrypt the message.

3. Guarantees Message Integrity  
   Digital signatures verify that messages have not been altered.

4. Provides Real-Time Communication  
   GUN’s real-time data streams allow instant message updates across peers.

5. Enhances Privacy and Ownership  
   Users control their cryptographic keys, ensuring secure peer-to-peer communication.

---

## Tech Stack

![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=white)
![JavaScript](https://img.shields.io/badge/Language-JavaScript-F7DF1E?logo=javascript&logoColor=black)
![GUN.js](https://img.shields.io/badge/Database-GUN.js-000000?logo=databricks&logoColor=white)
![Web Crypto API](https://img.shields.io/badge/Security-Web%20Crypto%20API-4285F4?logo=googlechrome&logoColor=white)
![Node.js](https://img.shields.io/badge/Runtime-Node.js-339933?logo=node.js&logoColor=white)
![React Router](https://img.shields.io/badge/Routing-React%20Router-CA4245?logo=reactrouter&logoColor=white)



### Cryptography
- Web Crypto API
- Public/Private Key Generation
- Shared Secret Derivation
- AES Encryption
- Digital Signature and Verification

---

## Features

- Real-time peer-to-peer messaging
- End-to-end encrypted communication
- Digital signature verification
- Decentralized data storage
- Secure shared secret key derivation
- Message encryption and decryption
- Friend-based private chat system
- Unread message counter
- No traditional backend server
- Secure cryptographic authentication

---

## Key Highlights

- Fully decentralized architecture
- No centralized database
- Applied real-world cryptography
- Secure distributed communication model
- Demonstrates understanding of distributed systems and encryption principles
