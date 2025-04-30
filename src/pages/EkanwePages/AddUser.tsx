import { useState } from "react";
import { db, auth } from "../../firebase/firebase";
import {
    collection,
    query,
    where,
    getDocs,
    setDoc,
    updateDoc,
    doc,
    serverTimestamp,
    getDoc,
    arrayUnion
} from "firebase/firestore";
import profile from "../../assets/profile.png"

interface User {
    id: string;
    pseudonyme: string;
    photoURL?: string;
}

export default function AddUser({ onUserAdded }: { onUserAdded: () => void }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState<User[]>([]);

    const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!searchTerm) return;

        const q = query(
            collection(db, "users"),
            where("pseudonyme", ">=", searchTerm),
            where("pseudonyme", "<=", searchTerm + "\uf8ff")
        );

        const querySnapshot = await getDocs(q);
        const usersFound: User[] = [];

        querySnapshot.forEach((docSnap) => {
            usersFound.push({ id: docSnap.id, ...docSnap.data() } as User);
        });

        setResults(usersFound);
    };


    const handleAdd = async (userToAdd: User) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        try {
            const chatRef = doc(collection(db, "chats"));
            await setDoc(chatRef, {
                createdAt: serverTimestamp(),
                messages: []
            });
            const userChatsRef = doc(db, "userchats", currentUser.uid);
            const receiverChatsRef = doc(db, "userchats", userToAdd.id);
            const userChatsSnap = await getDoc(userChatsRef);
            if (!userChatsSnap.exists()) {
                await setDoc(userChatsRef, {
                    chats: []
                });
            }
            const receiverChatsSnap = await getDoc(receiverChatsRef);
            if (!receiverChatsSnap.exists()) {
                await setDoc(receiverChatsRef, {
                    chats: []
                });
            }
            await updateDoc(userChatsRef, {
                chats: arrayUnion({
                    chatId: chatRef.id,
                    lastMessage: "",
                    receiverId: userToAdd.id,
                    updatedAt: Date.now()
                })
            });
            await updateDoc(receiverChatsRef, {
                chats: arrayUnion({
                    chatId: chatRef.id,
                    lastMessage: "",
                    receiverId: currentUser.uid,
                    updatedAt: Date.now()
                })
            });
            onUserAdded();
        } catch (error) {
            console.error("Erreur lors de la création du chat :", error);
        }
    };

    return (
        <div className="mt-4">
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Rechercher un utilisateur"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg p-2 outline-none"
                />
                <button
                    type="submit"
                    className="bg-[#FF6B2E] text-white rounded-lg px-4"
                >
                    Chercher
                </button>
            </form>

            <div className="space-y-4">
                {results.map((user) => (
                    <div
                        key={user.id}
                        className="flex items-center justify-between bg-white p-4 rounded-lg border"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300">
                                <img
                                    src={user.photoURL || profile}
                                    alt={user.pseudonyme}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <span className="text-[#1A2C24] font-medium">{user.pseudonyme}</span>
                        </div>
                        <button
                            onClick={() => handleAdd(user)}
                            className="bg-[#1A2C24] text-white text-sm px-3 py-1 rounded-lg"
                        >
                            Ajouter
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
