import { useLocation, useNavigate } from "react-router-dom";
import home from "../../assets/home.png";
import startistique from "../../assets/startistique.png";
import navigationsave from "../../assets/navigationsave.png";
import profile from "../../assets/profile.png";
import chat from "../../assets/chat.png";

export default function BottomNavbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 px-4 py-2 bg-gray-500 shadow-inner flex justify-between items-center">
      <button onClick={() => navigate("/dealsinfluenceur")}>
        <img
          src={home}
          alt="Home"
          className={`w-12 h-12 ${pathname === "/dealsinfluenceur" ? "filter-orange" : ""}`}
        />
      </button>
      <button onClick={() => navigate("/suivisdealsinfluenceur")}>
        <img
          src={startistique}
          alt="Stats"
          className={`w-6 h-6 ${pathname === "/suivisdealsinfluenceur" ? "filter-orange" : ""}`}
        />
      </button>
      <button onClick={() => navigate("/discussioninfluenceur")}>
        <img
          src={chat}
          alt="Chat"
          className={`w-6 h-6 ${pathname === "/discussioninfluenceur" ? "filter-orange" : ""}`}
        />
      </button>
      <button onClick={() => navigate("/savedealsinfluenceur")}>
        <img
          src={navigationsave}
          alt="Save"
          className={`w-6 h-6 ${pathname === "/savedealsinfluenceur" ? "filter-orange" : ""}`}
        />
      </button>
      <button onClick={() => navigate("/profileinfluenceur")}>
        <img
          src={profile}
          alt="Profile"
          className={`w-6 h-6 ${pathname === "/profileinfluenceur" ? "filter-orange" : ""}`}
        />
      </button>
    </nav>
  );
}
