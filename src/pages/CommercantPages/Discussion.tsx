import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onSnapshot, doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";
import sign from "../../assets/ekanwesign.png";
import loupe from "../../assets/loupe.png";
import menu from "../../assets/menu.png";
import AddUser from "../EkanwePages/AddUser";
import Navbar from "./Navbar";
import profile from "../../assets/profile.png";

interface Message {
  text: string;
  createdAt: Date;
}

interface ChatItem {
  chatId: string;
  lastMessage: string;
  receiverId: string;
  updatedAt: number;
  read: boolean;
  messages?: Message[];
  user?: {
    pseudonyme: string;
    photoURL?: string;
  };
}

export default function DiscussionPageInfluenceur() {
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [addMode, setAddMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const unsub = onSnapshot(doc(db, "userchats", currentUser.uid), async (snapshot) => {
      const data = snapshot.data();
      if (!data?.chats) {
        setChats([]);
        setLoading(false);
        return;
      }

      const items = data.chats;

      const promises = items.map(async (item: ChatItem) => {
        const userDoc = await getDoc(doc(db, "users", item.receiverId));
        const user = userDoc.exists() ? userDoc.data() : null;
        
        // Get chat messages
        const chatDoc = await getDoc(doc(db, "chats", item.chatId));
        const messages = chatDoc.exists() ? chatDoc.data()?.messages : [];
        const lastMessage = messages?.length > 0 ? messages[messages.length - 1].text : "";
        
        return { ...item, user, lastMessage };
      });

      const chatData = await Promise.all(promises);
      setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser?.uid]);

  const handleSelect = async (chat: ChatItem) => {
    if (!currentUser) return;
    const userChatsRef = doc(db, "userchats", currentUser.uid);
    try {
      const updatedChats = chats.map((item) => {
        const { user, ...rest } = item;
        if (item.chatId === chat.chatId) {
          return { ...rest, read: true };
        }
        return rest;
      });
      await updateDoc(userChatsRef, { chats: updatedChats });
      navigate(`/chat/${chat.chatId}`, {
        state: {
          pseudonyme: chat.user?.pseudonyme,
          photoURL: chat.user?.photoURL,
          role: "commerçant"
        },
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du chat :", error);
    }
  };

  const filteredChats = chats.filter((chat) =>
    chat.user?.pseudonyme.toLowerCase().includes(input.toLowerCase())
  );

  const handleUserAdded = () => {
    setAddMode(false);
  };

  const handleSignClick = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const role = userSnap.data()?.role;
      if (role === "influenceur") navigate("/dealsinfluenceur");
      else navigate("/dealscommercant");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F5E7]">
        <div className="animate-spin-slow">
          <img src={sign} alt="Ekanwe Logo" className="w-16 h-16" />
        </div>
        <p className="mt-4 text-[#14210F]">Chargement en cours...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5E7] text-[#14210F] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#F5F5E7] px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Discussions</h1>
          <button 
            onClick={handleSignClick}
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
          >
            <img src={sign} alt="Ekanwe Sign" className="w-6 h-6" />
          </button>
        </div>

        {/* Barre de recherche + bouton ajout */}
        <div className="mt-4 flex items-center gap-2">
          <div className="flex items-center bg-white rounded-lg px-3 py-2.5 flex-1 shadow-sm">
            <img src={loupe} alt="loupe" className="w-5 h-5 mr-2 opacity-50" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Rechercher une conversation"
              className="flex-grow bg-white/10 text-sm outline-none placeholder:text-gray-400"
            />
            <img src={menu} alt="Menu" className="w-5 h-5 ml-2 opacity-50" />
          </div>
          <button
            onClick={() => setAddMode(!addMode)}
            className="bg-[#14210F] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#FF6B2E]/90 transition-colors"
          >
            {addMode ? "Annuler" : "Ajouter"}
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="px-4 mt-4">
        {addMode ? (
          <AddUser onUserAdded={handleUserAdded} />
        ) : filteredChats.length > 0 ? (
          <div className="space-y-3">
            {filteredChats.map((chat) => (
              <div
                key={chat.chatId}
                onClick={() => handleSelect(chat)}
                className="bg-white p-2 rounded-xl shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4 ring-2 ring-gray-100">
                    <img
                      src={chat.user?.photoURL || profile}
                      alt={chat.user?.pseudonyme}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold truncate">
                        {chat.user?.pseudonyme || "Utilisateur"}
                      </h3>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(chat.updatedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p
                        className={`text-sm truncate max-w-[200px] ${
                          chat.read ? "text-gray-500" : "text-black font-medium"
                        }`}
                        title={chat.lastMessage}
                      >
                        {chat.lastMessage || "Commencez la conversation..."}
                      </p>
                      {!chat.read && (
                        <span className="bg-[#FF6B2E] text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center ml-2 shrink-0">
                          1
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <p className="text-gray-500 text-center">
              Aucune conversation pour le moment
            </p>
          </div>
        )}
      </div>

      <Navbar />
    </div>
  );
}
