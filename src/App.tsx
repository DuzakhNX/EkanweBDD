import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Splash from './pages/Splash';
import CreatorType from './pages/EkanwePages/CreatorType';
import Concept from './pages/EkanwePages/Concept';
import LoginOrConnect from './pages/LoginPages/LoginOrConnect';
import Connection from './pages/LoginPages/Connection';
import RegistrationStepOne from './pages/LoginPages/RegistrationStepOne';
import SocialConnectStep from './pages/LoginPages/SocialConnect';
import InterestsStep from './pages/LoginPages/InterestStep';
import PortfolioStep from './pages/LoginPages/PortfolioStep';
import ValidateInscription from './pages/LoginPages/ValidateIncription';
import Deals from './pages/InfluenceurPages/Deals';
import DealSeeMore from './pages/InfluenceurPages/DealsSeeMore';
import Suivis from './pages/InfluenceurPages/SuivisDeals';
import DealDetailsPage from './pages/InfluenceurPages/DealDetailsPage';
import SaveDealsPage from './pages/InfluenceurPages/SaveDealsPage';
import Profile from './pages/InfluenceurPages/Profile';
import NotificationPage from './pages/InfluenceurPages/NotificationPage';
import LoginPage from './pages/LoginPages/Login';
import DealsPage from './pages/CommercantPages/DealsPage';
import MerchantDetailPage from './pages/CommercantPages/MerchantDetailPage';
import DealCandidatesPage from './pages/CommercantPages/DealCandidatesPage';
import DashboardPage from './pages/CommercantPages/DashboardPage';
import Register from './pages/LoginPages/Register';
import RegistrationComplete from './pages/LoginPages/RegistrationComplete';
import Profilinfluenceur from './pages/CommercantPages/ProfilInfluenceur';
import NotifyPage from './pages/CommercantPages/Notif';
import WelcomeComercant from './pages/EkanwePages/WelcomeComercant';
import WelcomeInfluenceur from './pages/EkanwePages/WelcomeInfluenceur';
import CreatorTypeInfluenceur from './pages/EkanwePages/CreatorTypeInfluenceur';
import ConceptInfluenceur from './pages/EkanwePages/ConceptInfluenceur';
import PublicProfil from './pages/CommercantPages/ProfilPublic';
import EvaluationPage from './pages/InfluenceurPages/Review';
import ChatPage from './pages/EkanwePages/ChatPage';
import ConversationsPage from './pages/InfluenceurPages/Discussion';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/welcomecommercant" element={<WelcomeComercant />} />
        <Route path="/creator-type" element={<CreatorType />} />
        <Route path="/concept" element={<Concept />} />
        <Route path="/login" element={<LoginPage/>} />
        <Route path='/loginOrconnect' element={<LoginOrConnect/>} />
        <Route path='/connection' element={<Connection/>} />
        <Route path='/registerstepone' element={<RegistrationStepOne/>} />
        <Route path='/interestsstep' element={<InterestsStep/>} />
        <Route path='/socialconnect' element={<SocialConnectStep/>} />
        <Route path='/portfolio' element={<PortfolioStep/>} />
        <Route path='/validateinscription' element={<ValidateInscription/>} />
        <Route path='/deals' element={<Deals/>} />
        <Route path='/dealseemore/:dealId' element={<DealSeeMore/>} />
        <Route path='/review/:dealId' element={<EvaluationPage/>} />
        <Route path='/suivideals' element={<Suivis/>} />
        <Route path='/dealdetailspage/:dealId' element={<DealDetailsPage/>} />
        <Route path='/savedealspage' element={<SaveDealsPage/>} />
        <Route path='/profile' element={<Profile/>} />
        <Route path='/notification' element={<NotificationPage/>} />
        <Route path="/profilPublic/:userId" element={<PublicProfil/>} />
        <Route path="/chat/:chatId" element={<ChatPage/>} />
        <Route path="/discussion" element={<ConversationsPage/>} />

        <Route path="/welcomeinfluenceur" element={<WelcomeInfluenceur />} />
        <Route path="/dealInfluenceur" element={<DealsPage />} />
        <Route path="/merchantdetail" element={<MerchantDetailPage />} />
        <Route path="/dealCandidates/:dealId" element={<DealCandidatesPage />} />
        <Route path="/dashboardpage" element={<DashboardPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/registercomplete" element={<RegistrationComplete />} />
        <Route path="/profilinfluenceur" element={<Profilinfluenceur />} />
        <Route path="/notifypage" element={<NotifyPage />} />
        <Route path="/creator-typeinfluenceur" element={<CreatorTypeInfluenceur />} />
        <Route path="/conceptinfluenceur" element={<ConceptInfluenceur />} />
      </Routes>
    </Router>
  );
}

export default App;