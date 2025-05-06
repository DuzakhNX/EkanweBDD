import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { db, auth } from "../../firebase/firebase";
import { doc, onSnapshot, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import EmojiPicker from "emoji-picker-react";
import { format } from "timeago.js";
import sign from "../../assets/ekanwesign.png";
import { sendNotification } from "../../hooks/sendNotifications";
import profile from "../../assets/profile.png"

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: Date;
  img?: string;
}

export default function ChatPage() {
  const { chatId } = useParams();
  const location = useLocation();
  const { pseudonyme, photoURL } = location.state || {};

  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!chatId) return;

    const chatRef = doc(db, "chats", chatId);
    const unsub = onSnapshot(chatRef, (snapshot) => {
      const data = snapshot.data();
      if (data?.messages) {
        setMessages(
          data.messages.map((msg: any) => ({
            ...msg,
            createdAt: msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date(),
          }))
        );
      }
    });

    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() && !imagePreview) return;

    if (!chatId || !auth.currentUser) return;

    const chatRef = doc(db, "chats", chatId);

    const senderId = auth.currentUser.uid;
    const receiverId = location.state?.receiverId;

    const newMsg = {
      senderId,
      text: newMessage,
      createdAt: new Date(),
      ...(imagePreview && { img: imagePreview }),
    };

    try {
      await updateDoc(chatRef, {
        messages: arrayUnion(newMsg),
      });

      const userChatsRefSender = doc(db, "userchats", senderId);
      const userChatsRefReceiver = doc(db, "userchats", receiverId);

      const senderChatsSnap = await getDoc(userChatsRefSender);
      const receiverChatsSnap = await getDoc(userChatsRefReceiver);

      if (senderChatsSnap.exists() && receiverChatsSnap.exists()) {
        const senderChats = senderChatsSnap.data().chats;
        const receiverChats = receiverChatsSnap.data().chats;

        const updateChatsList = (chatsList: any[]) => {
          const index = chatsList.findIndex((c) => c.chatId === chatId);
          if (index !== -1) {
            chatsList[index].lastMessage = newMessage;
            chatsList[index].updatedAt = Date.now();
            chatsList[index].isSeen = true;
          }
          return chatsList;
        };

        await updateDoc(userChatsRefSender, {
          chats: updateChatsList(senderChats),
        });

        await updateDoc(userChatsRefReceiver, {
          chats: updateChatsList(receiverChats),
        });
      }

      await sendNotification({
        toUserId: receiverId,
        fromUserId: senderId,
        message: `Vous avez un nouveau message.`,
        relatedDealId: "",
        targetRoute: `/chat/${chatId}`,
        type: "new_message",
      });

    } catch (err) {
      console.error("Erreur d'envoi de message:", err);
    }

    setNewMessage("");
    setImagePreview(null);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleEmojiClick = (emojiData: any) => {
    setNewMessage(prev => prev + emojiData.emoji);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const cancelImage = () => {
    setImagePreview(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F5E7] text-[#14210F] flex flex-col">
      {/* HEADER */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-white shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-gray-200">
              <img src={photoURL || profile} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-base font-semibold">{pseudonyme || "Utilisateur"}</h1>
          </div>
        </div>
        <button 
          onClick={() => navigate((location.state.role === "influenceur" ? "/dealsinfluenceur" : "/dealscommercant"))}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        >
          <img src={sign} alt="Ekanwe Sign" className="w-5 h-5" />
        </button>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[75%] p-2.5 rounded-xl shadow-sm break-words
                ${message.senderId === auth.currentUser?.uid 
                  ? 'bg-[#1A2C24] text-white rounded-br-none' 
                  : 'bg-white rounded-bl-none'}`}
            >
              {message.img && (
                <img 
                  src={message.img} 
                  alt="Message" 
                  className="mb-1.5 rounded-lg max-h-60 w-full object-cover" 
                />
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
              <p className={`text-[10px] mt-1 ${message.senderId === auth.currentUser?.uid ? 'text-gray-300' : 'text-gray-500'} text-right`}>
                {format(message.createdAt)}
              </p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* IMAGE PREVIEW */}
      {imagePreview && (
        <div className="px-3 pb-2">
          <div className="relative w-32">
            <img src={imagePreview} alt="Aperçu" className="rounded-lg shadow-md" />
            <button 
              onClick={cancelImage} 
              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors"
            >
              ✖
            </button>
          </div>
        </div>
      )}

      {/* ENVOI */}
      <div className="sticky bottom-0 p-3 bg-white border-t border-gray-100 shadow-md">
        <div className="flex items-center space-x-2">
          <label className="p-1.5 hover:bg-gray-100 rounded-full cursor-pointer transition-colors shrink-0">
            <span className="text-lg">📎</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
          </label>

          <input
            type="text"
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-full px-3 py-2 text-sm focus:outline-none focus:border-[#1A2C24] transition-colors"
          />

          <button 
            onClick={() => setShowEmojiPicker(prev => !prev)} 
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors shrink-0"
          >
            <span className="text-lg">😊</span>
          </button>

          <button 
            onClick={handleSend} 
            className="bg-[#1A2C24] text-white px-3 py-2 rounded-full hover:bg-[#2A3C34] transition-colors whitespace-nowrap shrink-0 text-sm"
          >
            <span className="hidden sm:inline">Envoyer</span>
            <span className="sm:hidden">↑</span>
          </button>
        </div>

        <div className={`transition-all duration-300 ${showEmojiPicker ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          {showEmojiPicker && (
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          )}
        </div>
      </div>
    </div>
  );
}
