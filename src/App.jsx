import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn, SignUp, UserButton } from '@clerk/clerk-react';

import Header from './components/Header';
import Home from './pages/Home';
import NotFound from './pages/NotFound'; //404대응

import DagymGuide from './pages/dagymguide';

import ScriptEditor from './pages/scriptEditor';

function App() {
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
            element={<ScriptEditor />}
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;