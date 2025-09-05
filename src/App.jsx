import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn, SignUp, UserButton, RedirectToSignIn, useUser } from '@clerk/clerk-react'; // Import useUser
import { useSupabase } from './components/SupabaseProvider'; // Import useSupabase
import { useEffect } from 'react';

import Header from './components/Header';
import Home from './pages/Home';
import NotFound from './pages/NotFound'; //404대응

import DagymGuide from './pages/dagymguide';

import ScriptEditor from './pages/scriptEditor';
import AdminDashboard from './pages/AdminDashboard'; // Import AdminDashboard
import UserProfile from './pages/UserProfile'; // Import UserProfile

function App() {
  const { user, isLoaded, isSignedIn } = useUser();
  const supabase = useSupabase();

  useEffect(() => {
    if (isLoaded && isSignedIn && supabase) {
      const checkAndCreateProfile = async () => {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('user_id')
            .filter('user_id', 'eq', user.id) // Use filter instead of eq directly
            .single();

          if (error && error.code === 'PGRST116') { // PGRST116 means "no rows found"
            // Profile does not exist, create it
            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: user.id,
                member_name: user.username || user.firstName || user.id, // Use username or firstName as member_name
                // phone_number can be added later via a user profile page
              });

            if (insertError) {
              console.error('Error creating user profile:', insertError);
            } else {
              console.log('User profile created successfully for:', user.id);
            }
          } else if (error) {
            console.error('Error checking user profile:', error);
          }
        } catch (e) {
          console.error('Unexpected error in profile check:', e);
        }
      };
      checkAndCreateProfile();
    }
  }, [isLoaded, isSignedIn, user, supabase]);

  return (
    <Router>
      <Header />
      <div className="min-h-screen mt-30">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dagymguide" element={<DagymGuide />} />
          
          
          {/* Private Route */}
          <Route
            path="/editor/:scriptId?"
            element={
              <>
                <SignedIn>
                  <ScriptEditor />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          {/* Admin Dashboard Route */}
          <Route
            path="/admin"
            element={
              <>
                <SignedIn>
                  <AdminDashboard />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          {/* Sign In & Sign Up */}
          <Route
            path="/sign-in/*"
            element={<SignIn routing="path" path="/sign-in" />}
          />
          <Route
            path="/sign-up/*"
            element={<SignUp routing="path" path="/sign-up" />}
          />

          {/* 404 */}
          {/* User Profile Route */}
          <Route
            path="/profile"
            element={
              <>
                <SignedIn>
                  <UserProfile />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;