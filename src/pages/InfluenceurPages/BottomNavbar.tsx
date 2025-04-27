import { useLocation, useNavigate } from "react-router-dom";
import home from "../../assets/home.png";
import startistique from "../../assets/startistique.png";
import navigationsave from "../../assets/navigationsave.png";
import profile from "../../assets/profile.png";

export default function BottomNavbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 px-4 py-2 bg-gray-500 shadow-inner flex justify-between items-center">
      <button onClick={() => navigate("/deals")}>
        <img
          src={home}
          alt="Home"
          className={`w-12 h-12 ${pathname === "/deals" ? "filter-orange" : ""}`}
        />
      </button>
      <button onClick={() => navigate("/suivideals")}>
        <img
          src={startistique}
          alt="Stats"
          className={`w-6 h-6 ${pathname === "/suivideals" ? "filter-orange" : ""}`}
        />
      </button>
      <button onClick={() => navigate("/savedealspage")}>
        <img
          src={navigationsave}
          alt="Save"
          className={`w-6 h-6 ${pathname === "/savedealspage" ? "filter-orange" : ""}`}
        />
      </button>
      <button onClick={() => navigate("/profile")}>
        <img
          src={profile}
          alt="Profile"
          className={`w-6 h-6 ${pathname === "/profile" ? "filter-orange" : ""}`}
        />
      </button>
    </nav>
  );
}
