import "./App.css";
import AuthForm from "./pages/AuthForm";
import Dashboard from "./pages/Dashboard";
import ChatRoom from "./pages/ChatRoom";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ChatProvider from "./contexts/ChatContext";

function App() {
  return (
    <ChatProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AuthForm />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat/:id" element={<ChatRoom />} />
        </Routes>
      </Router>
    </ChatProvider>
  );
}

export default App;
