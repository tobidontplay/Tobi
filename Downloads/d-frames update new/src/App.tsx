import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Frame, Scan, Sparkles, Github, Linkedin } from 'lucide-react';
import JoinMovement from './components/JoinMovement';
import Navigation from './components/Navigation';
import AdminRoutes from './routes/AdminRoutes';
import EmployeePortal from './pages/EmployeePortal';

function FeatureIcon({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="group flex flex-col items-center transition-all duration-300 ease-in-out hover:scale-110 hover:-translate-y-1"
        aria-expanded={isExpanded}
      >
        <div className="bg-purple-600/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-all duration-300 group-hover:bg-purple-600/30 group-hover:shadow-lg group-hover:shadow-purple-500/20">
          <Icon className="w-8 h-8 text-purple-400 transition-all duration-300 group-hover:text-purple-300" />
        </div>
        <h3 className="text-xl font-semibold mb-4 transition-colors duration-300 group-hover:text-purple-400">{title}</h3>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="text-gray-400 text-center px-4">{description}</p>
      </div>
    </div>
  );
}

function MainApp() {
  const [showJoinMovement, setShowJoinMovement] = React.useState(false);

  if (showJoinMovement) {
    return <JoinMovement onBack={() => setShowJoinMovement(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-purple-950">
      <Navigation onOrderNow={() => setShowJoinMovement(true)} />
      
      {/* Hero Section */}
      <header className="relative h-screen flex items-center justify-center text-white overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1544365558-35aa4afcf11f?auto=format&fit=crop&q=80"
            alt="Artistic Background"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-purple-950/70" />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Art has spoken. <br/>
            <span className="text-purple-400">Memories have whispered.</span><br/>
            The future is listening.
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto">
            Welcome to D-frames studio, where technology meets the human soul. 
            We're not just reimagining how you see the world, we're redefining how the world sees you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => setShowJoinMovement(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all"
            >
              Order Now
            </button>
            <a 
              href="#features"
              className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/10 transition-all"
            >
              Learn More
            </a>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureIcon
              icon={Frame}
              title="Smart Frames"
              description="Every frame is a gateway to endless possibilities, powered by cutting-edge AR technology."
            />
            <FeatureIcon
              icon={Scan}
              title="Seamless Experience"
              description="Simply scan with your smartphone to unlock a universe of stories and interactive experiences."
            />
            <FeatureIcon
              icon={Sparkles}
              title="Living Memories"
              description="Transform static images into dynamic, emotional experiences that connect on a deeper level."
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 relative">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1633412802994-5c058f151b66?auto=format&fit=crop&q=80"
            alt="Tech Background"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-purple-950/90" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            This isn't just the launch of a brand.<br/>
            This is the birth of a movement.
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            This is not the future you were promised. It's the future you deserve.
          </p>
          <button 
            onClick={() => setShowJoinMovement(true)}
            className="bg-white text-purple-900 px-8 py-4 rounded-full text-lg font-semibold hover:bg-purple-100 transition-all"
          >
            Order Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/50 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold mb-2">D-frames studios</h3>
              <p className="text-gray-400">Where every image has a story, and every story has a soul.</p>
            </div>
            <div className="flex gap-6">
              <a href="https://instagram.com/theeframestudio" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">
                <Github className="w-6 h-6" />
              </a>
              <a href="https://tiktok.com/@dframestudio" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">
                <Linkedin className="w-6 h-6" />
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-gray-400">
            <p>&copy; 2024 D-frames studios. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/employee-portal/*" element={<EmployeePortal />} />
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </Router>
  );
}

export default App;