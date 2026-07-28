import { useAuth } from '../hooks/useAuth.jsx'
import MovieSearch from './MovieSearch.jsx'

function Home() {
  const { currentUser } = useAuth()

  return (
    <div className="home-page">
      <header className="hero">
        <h1>Welcome to Kaiju Vault{currentUser ? `, ${currentUser.username}` : ''}</h1>
        <p>Search TMDB for kaiju movies below, then head to your Watchlist to save the ones you care about.</p>
      </header>
      <div className="action-divider" />
      <MovieSearch />
    </div>
  )
}

export default Home
