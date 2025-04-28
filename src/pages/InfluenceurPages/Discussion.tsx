import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onSnapshot, doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";
import sign from "../../assets/ekanwesign.png";
import loupe from "../../assets/loupe.png";
import menu from "../../assets/menu.png";
import BottomNavbar from "./BottomNavbar";
import AddUser from "../EkanwePages/AddUser";

interface ChatItem {
    chatId: string;
    lastMessage: string;
    receiverId: string;
    updatedAt: number;
    user?: {
        pseudonyme: string;
        photoURL?: string;
        blocked?: string[];
    };
}

export default function ConversationsPage() {
    const navigate = useNavigate();
    const [chats, setChats] = useState<ChatItem[]>([]);
    const [input, setInput] = useState("");
    const [addMode, setAddMode] = useState(false);

    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!currentUser) return;

        const unsub = onSnapshot(doc(db, "userchats", currentUser.uid), async (snapshot) => {
            const data = snapshot.data();
            if (!data?.chats) {
                setChats([]);
                return;
            }

            const items = data.chats;

            const promises = items.map(async (item: ChatItem) => {
                const userDoc = await getDoc(doc(db, "users", item.receiverId));
                const user = userDoc.exists() ? userDoc.data() : null;
                return { ...item, user };
            });

            const chatData = await Promise.all(promises);

            setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
        });

        return () => unsub();
    }, [currentUser?.uid]);

    const handleSelect = async (chat: ChatItem) => {
        if (!currentUser) return;

        const userChatsRef = doc(db, "userchats", currentUser.uid);

        try {
            const updatedChats = chats.map((item) => {
                const { user, ...rest } = item;
                return rest;
            });

            const chatIndex = updatedChats.findIndex((item) => item.chatId === chat.chatId);
            if (chatIndex !== -1) {
                updatedChats[chatIndex].lastMessage = "";
            }

            await updateDoc(userChatsRef, { chats: updatedChats });
            navigate(`/chat/${chat.chatId}`);
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

    return (
        <div className="min-h-screen bg-[#F5F5E7] text-[#14210F] pb-32 pt-5">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4">
                <h1 className="text-3xl font-bold">Discussions</h1>
                <div className="flex items-center space-x-4">
                    <img src={sign} alt="Ekanwe Sign" className="w-6 h-6" />
                </div>
            </div>

            <div className="px-4 mb-4 flex items-center gap-2">
                <div className="flex items-center bg-white/10 border border-black rounded-lg px-3 py-2 flex-1">
                    <img src={loupe} alt="loupe" className="w-6 h-6 mr-2" />
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Rechercher une conversation"
                        className="flex-grow bg-transparent text-2xs outline-none"
                    />
                    <img src={menu} alt="Menu" className="w-6 h-6 ml-2" />
                </div>
                <button
                    onClick={() => setAddMode(!addMode)}
                    className="bg-[#FF6B2E] text-white px-4 py-2 rounded-lg text-sm"
                >
                    {addMode ? "Annuler" : "Ajouter"}
                </button>
            </div>

            <div className="px-4">
                {addMode ? (
                    <AddUser onUserAdded={handleUserAdded} />
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
                                        src={chat.user?.photoURL || "https://via.placeholder.com/100"}
                                        alt={chat.user?.pseudonyme}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold">{chat.user?.pseudonyme || "Utilisateur"}</h3>
                                        <span className="text-xs text-gray-500">
                                            {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 truncate">
                                        {chat.lastMessage || "Commencez la conversation..."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-[#F5F5E7] mt-20 p-2 rounded-lg shadow-lg mb-4">
                        <p className="text-sm text-center text-gray-600">Aucune conversation</p>
                    </div>
                )}
            </div>
            <BottomNavbar />
        </div>
    );
}
