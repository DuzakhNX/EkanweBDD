import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onSnapshot, doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";
import sign from "../../assets/ekanwesign.png";
import loupe from "../../assets/loupe.png";
import menu from "../../assets/menu.png";
import BottomNavbar from "./BottomNavbar";
import AddUser from "../EkanwePages/AddUser";
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
    } | null;
}

export default function DiscussionPageInfluenceur() {
    const navigate = useNavigate();
    const [chats, setChats] = useState<ChatItem[]>([]);
    const [input, setInput] = useState("");
    const [addMode, setAddMode] = useState(false);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const unsub = onSnapshot(doc(db, "userchats", user.uid), async (snapshot) => {
            const data = snapshot.data();
            if (!data?.chats) {
                setChats([]);
                return;
            }

            const items = data.chats as ChatItem[];

            const promises = items.map(async (item) => {
                // Get user info
                const userDoc = await getDoc(doc(db, "users", item.receiverId));
                let user = null;
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    if (typeof data.pseudonyme === "string") {
                        user = {
                            pseudonyme: data.pseudonyme,
                            photoURL: data.photoURL || undefined,
                        };
                    }
                }

                // Get chat messages
                const chatDoc = await getDoc(doc(db, "chats", item.chatId));
                const messages = chatDoc.exists() ? chatDoc.data()?.messages || [] : [];
                const lastMessage = messages.length > 0 ? messages[messages.length - 1].text : "";

                return { 
                    ...item, 
                    user,
                    lastMessage
                };
            });

            const chatData = await Promise.all(promises);
            setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
        });

        return () => unsub();
    }, []);

    const handleSelect = async (chat: ChatItem) => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const userChatsRef = doc(db, "userchats", user.uid);
            const updatedChats = chats.map((item) => {
                const { user, ...rest } = item;
                return item.chatId === chat.chatId ? { ...rest, read: true } : rest;
            });

            await updateDoc(userChatsRef, { chats: updatedChats });

            navigate(`/chat/${chat.chatId}`, {
                state: {
                    pseudonyme: chat.user?.pseudonyme,
                    photoURL: chat.user?.photoURL,
                    role: "influenceur"
                },
            });
        } catch (err) {
            console.error("Erreur lors de la mise à jour du chat :", err);
        }
    };

    const filteredChats = chats.filter((chat) =>
        chat.user?.pseudonyme.toLowerCase().includes(input.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F5F5E7] text-[#14210F] pb-32 pt-5">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4">
                <h1 className="text-3xl font-bold">Discussions</h1>
                <img src={sign} alt="Ekanwe" className="w-6 h-6" />
            </div>

            {/* Search & Add */}
            <div className="px-4 mb-4 flex items-center gap-2">
                <div className="flex items-center bg-white/10 border border-black rounded-lg px-3 py-2 flex-1">
                    <img src={loupe} alt="loupe" className="w-6 h-6 mr-2" />
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Rechercher une conversation"
                        className="flex-grow bg-transparent text-sm outline-none"
                    />
                    <img src={menu} alt="Menu" className="w-6 h-6 ml-2" />
                </div>
                <button
                    onClick={() => setAddMode((prev) => !prev)}
                    className="bg-[#14210F] text-white px-4 py-2 rounded-lg text-sm"
                >
                    {addMode ? "Annuler" : "Ajouter"}
                </button>
            </div>

            {/* Chat List */}
            <div className="px-4">
                {addMode ? (
                    <AddUser onUserAdded={() => setAddMode(false)} />
                ) : filteredChats.length > 0 ? (
                    filteredChats.map((chat) => (
                        <div
                            key={chat.chatId}
                            onClick={() => handleSelect(chat)}
                            className="bg-[#F5F5E7] p-4 rounded-lg shadow-lg mb-4 border border-gray-200 cursor-pointer"
                        >
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden mr-4">
                                    <img
                                        src={chat.user?.photoURL || profile}
                                        alt={chat.user?.pseudonyme || "Profil"}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold">{chat.user?.pseudonyme || "Utilisateur"}</h3>
                                        <span className="text-xs text-gray-500">
                                            {new Date(chat.updatedAt).toLocaleTimeString("fr-FR", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p
                                            className={`text-sm truncate max-w-[80%] ${chat.read ? "text-gray-600" : "text-black font-bold"}`}
                                        >
                                            {chat.lastMessage || "Commencez la conversation..."}
                                        </p>
                                        {!chat.read && (
                                            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2">
                                                1
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="mt-20 p-2 rounded-lg shadow-lg mb-4 text-center text-gray-600">
                        <p className="text-sm">Aucune conversation</p>
                    </div>
                )}
            </div>
            <BottomNavbar />
        </div>
    );
}