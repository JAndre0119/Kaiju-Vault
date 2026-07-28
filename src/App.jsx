import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Watchlist from './pages/Watchlist.jsx'

function App() {
  return (
    <>
      <NavBar />
      <main className="page-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/watchlist" element={<Watchlist />} />
          </Route>
        </Routes>
      </main>
    </>
  )
}

export default App
