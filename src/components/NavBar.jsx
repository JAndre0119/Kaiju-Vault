import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

function NavBar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Kaiju Vault
      </Link>

      <div className="navbar-links">
        <Link to="/">Home</Link>
        {currentUser ? (
          <>
            <Link to="/watchlist">Watchlist</Link>
            <span className="navbar-user">Hi, {currentUser.username}</span>
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login">Login / Register</Link>
        )}
      </div>
    </nav>
  )
}

export default NavBar
