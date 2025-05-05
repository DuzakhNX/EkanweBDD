import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase/firebase";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";

type RoleBasedRouteProps = {
  children: JSX.Element;
  allowedRole: "influenceur" | "commerçant";
};

export default function RoleBasedRoute({ children, allowedRole }: RoleBasedRouteProps) {
  const [user, loading] = useAuthState(auth);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const snap = await getDoc(docRef);
        const role = snap.data()?.role;
        setAuthorized(role === allowedRole);
      }
    };

    if (user) checkRole();
  }, [user]);

  if (loading || authorized === null) return <div className="text-white text-center">Chargement...</div>;

  if (!user || !authorized) return <Navigate to="/login" replace />;
  return children;
}
