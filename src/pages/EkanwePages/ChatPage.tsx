import { useNavigate } from "react-router-dom";
import sign from "../../assets/ekanwesign.png";
import { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { format } from "timeago.js";

interface Message {
  id: number;
  text: string;
  isSent: boolean;
  timestamp: Date;
  img?: string;
}

export default function ChatPage() {
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() && !imagePreview) return;

    const newMsg: Message = {
      id: Date.now(),
      text: newMessage,
      isSent: true,
      timestamp: new Date(),
      img: imagePreview || undefined,
    };

    setMessages(prev => [...prev, newMsg]);
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
      <div className="flex items-center justify-between px-4 py-4 bg-white/10 border-b border-gray-200">
        <div className="flex items-center">
          <button onClick={() => navigate("/discussion")} className="mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
            <h1 className="text-xl font-semibold">Nom du contact</h1>
          </div>
        </div>
        <img src={sign} alt="Ekanwe Sign" className="w-6 h-6" />
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isSent ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                message.isSent
                  ? 'bg-[#1A2C24] text-white rounded-br-none'
                  : 'bg-white rounded-bl-none'
              }`}
            >
              {message.img && (
                <img
                  src={message.img}
                  alt="Envoyé"
                  className="mb-2 rounded-lg max-h-60 object-cover"
                />
              )}
              <p className="text-sm">{message.text}</p>
              <p className={`text-xs ${message.isSent ? 'text-gray-300' : 'text-gray-500'} text-right`}>
                {format(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* IMAGE PREVIEW */}
      {imagePreview && (
        <div className="px-4 mb-2">
          <div className="relative w-32">
            <img
              src={imagePreview}
              alt="Aperçu"
              className="rounded-lg shadow-lg"
            />
            <button
              onClick={cancelImage}
              className="absolute top-0 right-0 bg-red-500 text-white text-xs p-1 rounded-full"
            >
              ✖
            </button>
          </div>
        </div>
      )}

      {/* ENVOI */}
      <div className="p-4 bg-white/10 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <label className="cursor-pointer">
            📎
            <input type="file" hidden accept="image/*" onChange={handleImageChange} />
          </label>

          <input
            type="text"
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            className="flex-1 bg-white/10 border border-black rounded-lg px-4 py-2 outline-none"
          />

          <button
            onClick={() => setShowEmojiPicker(prev => !prev)}
            className="text-2xl"
          >
            😊
          </button>

          <button
            onClick={handleSend}
            className="bg-[#1A2C24] text-white px-4 py-2 rounded-lg"
          >
            Envoyer
          </button>
        </div>
        <div className={`transition-all duration-300 ${showEmojiPicker ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          {showEmojiPicker && (
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          )}
        </div>
      </div>
    </div>
  );
}
