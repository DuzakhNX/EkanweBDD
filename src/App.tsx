import Splash from './pages/Splash';
// Import LoginPages
import Connection from './pages/LoginPages/Connection'
import InterestsStep from './pages/LoginPages/InterestStep'
import LoginPage from './pages/LoginPages/Login'
import LoginOrConnect from './pages/LoginPages/LoginOrConnect'
import PortfolioStep from './pages/LoginPages/PortfolioStep'
import Register from './pages/LoginPages/Register'
import RegistrationComplete from './pages/LoginPages/RegistrationComplete'
import RegistrationStepOne from './pages/LoginPages/RegistrationStepOne'
import SocialConnectStep from './pages/LoginPages/SocialConnect'
import ValidateInscription from './pages/LoginPages/ValidateIncription'
// Import EkanwePages
import ChatPage from './pages/EkanwePages/ChatPage'
import ConceptCommercant from './pages/EkanwePages/ConceptCommercant'
import ConceptInfluenceur from './pages/EkanwePages/ConceptInfluenceur'
import CreatorTypeCommercant from './pages/EkanwePages/CreatorTypeInfluenceur'
import CreatorTypeInfluenceur from './pages/EkanwePages/CreatorTypeCommercant'
import WelcomeInfluenceur from './pages/EkanwePages/WelcomeInfluenceur'
import WelcomeCommercant from './pages/EkanwePages/WelcomeCommercant';
// Import CommerçantPages
import DashboardPageCommercant from './pages/CommercantPages/DashboardPage';
import DealCandidatesPageCommercant from './pages/CommercantPages/DealCandidatesPage';
import DealDetailPageCommercant from './pages/CommercantPages/DealDetailsPage';
import DealsPageCommercant from './pages/CommercantPages/DealsPage';
import DiscussionPageCommercant from './pages/CommercantPages/Discussion';
import MerchantDetailPageCommercant from './pages/CommercantPages/MerchantDetailPage';
import NotificationPageCommercant from './pages/CommercantPages/Notif';
import ProfilePageCommercant from './pages/CommercantPages/Profile';
import ProfilPublicPageCommercant from './pages/CommercantPages/ProfilPublic';
import SuiviDealsPageCommercant from './pages/CommercantPages/SuivisDeals';
// Import InfluenceurPages
import DealDetailsPageInfluenceur from './pages/InfluenceurPages/DealDetailsPage';
import DealsPageInfluenceur from './pages/InfluenceurPages/Deals';
import DealsSeeMorePageInfluenceur from './pages/InfluenceurPages/DealsSeeMore';
import DiscussionPageInfluenceur from './pages/InfluenceurPages/Discussion';
import NotificationPageInfluenceur from './pages/InfluenceurPages/NotificationPage';
import ProfilePageInfluenceur from './pages/InfluenceurPages/Profile';
import ReviewPageInfluenceur from './pages/InfluenceurPages/Review';
import SaveDealsPageInfluenceur from './pages/InfluenceurPages/SaveDealsPage';
import SuivisDealsPageInfluenceur from './pages/InfluenceurPages/SuivisDeals';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Import pages (as is...)
// ... Toutes tes importations existantes ...

function ProtectedRoute({ children, role }: { children: JSX.Element, role?: string }) {
  const [userChecked, setUserChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAuthorized(false);
        setUserChecked(true);
        return;
      }

      if (!role) {
        setIsAuthorized(true);
        setUserChecked(true);
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setIsAuthorized(userData.role === role);
      } else {
        setIsAuthorized(false);
      }
      setUserChecked(true);
    });

    return () => unsubscribe();
  }, [role]);

  if (!userChecked) return <div className='p-4 text-center'>Chargement...</div>;
  return isAuthorized ? children : <Navigate to='/loginorsignup' />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Splash />} />
        {/* Auth pages */}
        <Route path="/connection" element={<Connection />} />
        <Route path="/intereststep" element={<InterestsStep />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/loginorsignup" element={<LoginOrConnect />} />
        <Route path="/portfoliostep" element={<PortfolioStep />} />
        <Route path="/register" element={<Register />} />
        <Route path="/registrationcomplete" element={<RegistrationComplete />} />
        <Route path="/registrationstepone" element={<RegistrationStepOne />} />
        <Route path="/socialconnectstep" element={<SocialConnectStep />} />
        <Route path="/validateinscription" element={<ValidateInscription />} />

        {/* Ekanwe */}
        <Route path="/chat/:chatId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/conceptcommercant" element={<ProtectedRoute><ConceptCommercant /></ProtectedRoute>} />
        <Route path="/conceptinfluenceur" element={<ProtectedRoute><ConceptInfluenceur /></ProtectedRoute>} />
        <Route path="/creatorinfluenceur" element={<ProtectedRoute><CreatorTypeInfluenceur /></ProtectedRoute>} />
        <Route path="/creatorcommercant" element={<ProtectedRoute><CreatorTypeCommercant /></ProtectedRoute>} />
        <Route path="/welcomecommercant" element={<ProtectedRoute role="commercant"><WelcomeCommercant /></ProtectedRoute>} />
        <Route path="/welcomeinfluenceur" element={<ProtectedRoute role="influenceur"><WelcomeInfluenceur /></ProtectedRoute>} />

        {/* Commerçant */}
        <Route path="/dashboard" element={<ProtectedRoute role="commercant"><DashboardPageCommercant /></ProtectedRoute>} />
        <Route path="/dealcandidatescommercant/:dealId" element={<ProtectedRoute role="commercant"><DealCandidatesPageCommercant /></ProtectedRoute>} />
        <Route path="/dealdetailcommercant/:dealId/:influenceurId" element={<ProtectedRoute role="commercant"><DealDetailPageCommercant /></ProtectedRoute>} />
        <Route path="/dealscommercant" element={<ProtectedRoute role="commercant"><DealsPageCommercant /></ProtectedRoute>} />
        <Route path="/discussioncommercant" element={<ProtectedRoute role="commercant"><DiscussionPageCommercant /></ProtectedRoute>} />
        <Route path="/merchantdetailcommercant" element={<ProtectedRoute role="commercant"><MerchantDetailPageCommercant /></ProtectedRoute>} />
        <Route path="/notificationcommercant" element={<ProtectedRoute role="commercant"><NotificationPageCommercant /></ProtectedRoute>} />
        <Route path="/profilecommercant" element={<ProtectedRoute role="commercant"><ProfilePageCommercant /></ProtectedRoute>} />
        <Route path="/profilpubliccommercant/:userId" element={<ProtectedRoute role="commercant"><ProfilPublicPageCommercant /></ProtectedRoute>} />
        <Route path="/suividealscommercant" element={<ProtectedRoute role="commercant"><SuiviDealsPageCommercant /></ProtectedRoute>} />

        {/* Influenceur */}
        <Route path="/dealdetailinfluenceur/:dealId" element={<ProtectedRoute role="influenceur"><DealDetailsPageInfluenceur /></ProtectedRoute>} />
        <Route path="/dealsinfluenceur" element={<ProtectedRoute role="influenceur"><DealsPageInfluenceur /></ProtectedRoute>} />
        <Route path="/dealsseemoreinfluenceur/:dealId" element={<ProtectedRoute role="influenceur"><DealsSeeMorePageInfluenceur /></ProtectedRoute>} />
        <Route path="/discussioninfluenceur" element={<ProtectedRoute role="influenceur"><DiscussionPageInfluenceur /></ProtectedRoute>} />
        <Route path="/notificationinfluenceur" element={<ProtectedRoute role="influenceur"><NotificationPageInfluenceur /></ProtectedRoute>} />
        <Route path="/profileinfluenceur" element={<ProtectedRoute role="influenceur"><ProfilePageInfluenceur /></ProtectedRoute>} />
        <Route path="/reviewinfluenceur/:dealId" element={<ProtectedRoute role="influenceur"><ReviewPageInfluenceur /></ProtectedRoute>} />
        <Route path="/savedealsinfluenceur" element={<ProtectedRoute role="influenceur"><SaveDealsPageInfluenceur /></ProtectedRoute>} />
        <Route path="/suivisdealsinfluenceur" element={<ProtectedRoute role="influenceur"><SuivisDealsPageInfluenceur /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
