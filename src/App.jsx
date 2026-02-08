import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { onAuthChange, getUserProfile } from './firebase/authService';
import { getOrganizerPendingRequests } from './firebase/gameService';
import { AuthContext } from './contexts/AuthContext';
import { PageLoadingSkeleton } from './components/LoadingSkeleton';
import PhonePromptModal from './components/PhonePromptModal';
import JoinRequestModal from './components/JoinRequestModal';
import ProtectedRoute from './components/ProtectedRoute';
import styles from './App.module.css';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./components/HomePage'));
const GameCreationPage = lazy(() => import('./components/GameCreationPage'));
const GameDetailsPage = lazy(() => import('./components/GameDetailsPage'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const NotificationsPage = lazy(() => import('./components/NotificationsPage'));

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [currentRequestIndex, setCurrentRequestIndex] = useState(0);
  const [requestUserProfiles, setRequestUserProfiles] = useState({});

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthChange(async (user) => {
      setCurrentUser(user);
      setShowPhonePrompt(false);
      
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          // Show phone prompt only if user has no phone
          if (!profile?.phone) {
            setShowPhonePrompt(true);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Fetch pending requests for organizer
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const fetchRequests = async () => {
      try {
        const requests = await getOrganizerPendingRequests(currentUser.uid);
        setPendingRequests(requests);
        setCurrentRequestIndex(0);

        // Fetch user profiles for all requesters
        const profiles = {};
        for (const request of requests) {
          if (!profiles[request.userId]) {
            const profile = await getUserProfile(request.userId);
            profiles[request.userId] = profile;
          }
        }
        setRequestUserProfiles(profiles);
      } catch (err) {
        console.error('Error fetching pending requests:', err);
      }
    };

    // Fetch immediately and then every 5 seconds
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleApproveRequest = () => {
    setPendingRequests(prev => prev.filter((_, idx) => idx !== currentRequestIndex));
    setCurrentRequestIndex(0);
  };

  const handleRejectRequest = () => {
    setPendingRequests(prev => prev.filter((_, idx) => idx !== currentRequestIndex));
    setCurrentRequestIndex(0);
  };

  const currentRequest = pendingRequests.length > 0 ? pendingRequests[currentRequestIndex] : null;

  if (loading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser }}>
      <Router>
        <div className={styles.app}>
          {showPhonePrompt && currentUser && (
            <PhonePromptModal 
              userId={currentUser.uid} 
              onClose={() => setShowPhonePrompt(false)}
            />
          )}
          
          {currentRequest && (
            <JoinRequestModal
              request={currentRequest}
              userProfile={requestUserProfiles[currentRequest.userId]}
              onClose={() => {
                // Move to next request or close
                if (currentRequestIndex < pendingRequests.length - 1) {
                  setCurrentRequestIndex(currentRequestIndex + 1);
                }
              }}
              onApprove={handleApproveRequest}
              onReject={handleRejectRequest}
            />
          )}

          <Suspense fallback={<PageLoadingSkeleton />}>
            <Routes>
              <Route 
                path="/login" 
                element={currentUser ? <Navigate to="/" replace /> : <LoginPage />} 
              />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute 
                    currentUser={currentUser} 
                    element={<HomePage pendingRequests={pendingRequests} />} 
                  />
                } 
              />
              <Route 
                path="/create-game" 
                element={
                  <ProtectedRoute 
                    currentUser={currentUser} 
                    element={<GameCreationPage />} 
                  />
                } 
              />
              <Route 
                path="/game/:gameId" 
                element={
                  <ProtectedRoute 
                    currentUser={currentUser} 
                    element={<GameDetailsPage />} 
                  />
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute 
                    currentUser={currentUser} 
                    element={<ProfilePage />} 
                  />
                } 
              />
              <Route 
                path="/notifications" 
                element={
                  <ProtectedRoute 
                    currentUser={currentUser} 
                    element={<NotificationsPage />} 
                  />
                } 
              />
              <Route path="*" element={<Navigate to={currentUser ? "/" : "/login"} replace />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
