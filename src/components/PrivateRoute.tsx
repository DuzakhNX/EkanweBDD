import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import sign from "../assets/ekanwesign.png"

export default function ProtectedRoute({ children, allowedRole }: { children: JSX.Element; allowedRole?: string }) {
  const [status, setStatus] = useState<"loading" | "authorized" | "unauthorized">("loading");

  useEffect(() => {
    const checkAuth = async () => {
      const user = auth.currentUser;
      if (!user) return setStatus("unauthorized");

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) return setStatus("unauthorized");

      const userData = userDoc.data();
      if (allowedRole && userData.role !== allowedRole) {
        return setStatus("unauthorized");
      }

      setStatus("authorized");
    };
    checkAuth();
  }, []);

  if (status === "loading") {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F5E7]">
          <div className="animate-spin-slow">
            <img src={sign} alt="Ekanwe Logo" className="w-16 h-16" />
          </div>
          <p className="mt-4 text-[#14210F]">Chargement en cours...</p>
        </div>
      );
  }

  if (status === "unauthorized") {
    return (
      <Navigate
        to="/loginorsignup"
        replace
        state={{ error: "Vous devez être connecté avec le bon rôle pour accéder à cette page." }}
      />
    );
  }

  return children;
}
