import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn, SignUp, UserButton, RedirectToSignIn, useUser } from '@clerk/clerk-react'; // Import useUser
import { useSupabase } from './components/SupabaseProvider'; // Import useSupabase
import { useEffect } from 'react';

import AdminLayout from './pages/AdminLayout';

import AdminOverview from './pages/AdminOverview';
import AdminKanban from './pages/AdminKanban';

import AdminProject from './pages/AdminProject';
import AdminCreateProject from './pages/AdminCreateProject';
import AdminScript from './pages/AdminScript';
import AdminVideo from './pages/AdminVideo';

import AdminUsers from './pages/AdminUsers';
import AdminCreateUsers from './pages/AdminCreateUsers';

import AdminSettings from './pages/AdminSettings';

import Header from './components/Header';
import Home from './pages/Home';
import DagymGuide from './pages/dagymguide';
import ScriptEditor from './pages/scriptEditor';
import UserProfile from './pages/UserProfile';

import NotFound from './pages/NotFound';

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
      <div className="h-32 bg-[rgb(21,26,35)]" />
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

          {/* Admin Dashboard Routes (Nested) */}
          <Route
            path="/admin"
            element={
              <>
                <SignedIn>
                  <AdminLayout />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          >
            <Route index element={<AdminOverview />} />

            <Route path="kanban" element={<AdminKanban />} />

            <Route path="project" element={<AdminProject />} />
            <Route path="createproject" element={<AdminCreateProject />} />
            <Route path="script" element={<AdminScript />} />
            <Route path="video" element={<AdminVideo />} />

            <Route path="users" element={<AdminUsers />} />
            <Route path="createusers" element={<AdminCreateUsers />} />
            
            <Route path="settings" element={<AdminSettings />} />
          </Route>

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
      
    </Router>
  );
}

export default App;