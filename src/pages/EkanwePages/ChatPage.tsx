import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import sign from "../../assets/ekanwesign.png";
import { db, auth } from "../../firebase/firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

export default function ChatPage() {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!chatId) return;

    const chatRef = doc(db, "chats", chatId);

    const unsub = onSnapshot(chatRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMessages(data.messages || []);
      }
    });

    return () => unsub();
  }, [chatId]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    if (!chatId || !currentUser) return;

    const chatRef = doc(db, "chats", chatId);
    const userChatsRef = doc(db, "userchats", currentUser.uid);

    const message = {
      id: Date.now(),
      senderId: currentUser.uid,
      text: newMessage,
      createdAt: new Date().toISOString(),
    };

    try {
      await updateDoc(chatRef, {
        messages: arrayUnion(message),
      });

      await updateDoc(userChatsRef, {
        chats: arrayUnion({
          chatId: chatId,
          lastMessage: newMessage,
          receiverId: "",
          updatedAt: Date.now(),
        }),
      });

      setNewMessage("");
    } catch (err) {
      console.error("Erreur d'envoi de message :", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5E7] text-[#14210F] flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-4 bg-white/10 border-b border-gray-200">
        <div className="flex items-center">
          <button onClick={() => navigate("/discussion")} className="mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
            <h1 className="text-xl font-semibold">Discussion</h1>
          </div>
        </div>
        <img src={sign} alt="Ekanwe Sign" className="w-6 h-6" />
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                message.senderId === currentUser?.uid
                  ? 'bg-[#1A2C24] text-white rounded-br-none'
                  : 'bg-white rounded-bl-none'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className={`text-xs ${message.senderId === currentUser?.uid ? 'text-gray-300' : 'text-gray-500'} text-right`}>
                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white/10 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            className="flex-1 bg-white/10 border border-black rounded-lg px-4 py-2 outline-none"
          />
          <button
            onClick={handleSend}
            className="bg-[#1A2C24] text-white px-4 py-2 rounded-lg"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
