import { BrowserRouter as Router } from 'react-router-dom';
import AdminRoutes from './routes/AdminRoutes';

function AdminApp() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <AdminRoutes />
      </div>
    </Router>
  );
}

export default AdminApp;
