import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

interface UserData {
  uid?: string;
  role?: string;
  email?: string;
  [key: string]: any;
}

interface UserContextType {
  userData: UserData | null;
  setUserData: (data: UserData) => void;
  setRole: (role: "influenceur" | "commerçant") => void;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = { uid: user.uid, email: user.email || "", role: "", ...snap.data() };
          setUserData(data);
          localStorage.setItem("userRole", data.role || "");
        }
      } else {
        const savedRole = localStorage.getItem("userRole");
        if (savedRole) {
          setUserData({ role: savedRole as "influenceur" | "commerçant" });
        }
      }
    });

    return () => unsub();
  }, []);

  const setRole = (role: "influenceur" | "commerçant") => {
    setUserData((prev) => ({ ...prev, role }));
    localStorage.setItem("userRole", role);
  };

  return (
    <UserContext.Provider value={{ userData, setUserData, setRole }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserData = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUserData must be used within a UserProvider");
  return context;
};
