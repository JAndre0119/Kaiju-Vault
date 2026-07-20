-- Initial schema for Kaiju Vault
-- Tables: users, films, reviews, watchlist, showdowns, votes

-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Films
CREATE TABLE films (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  genre VARCHAR(100),
  year INT,
  poster_url TEXT,
  tmdb_id INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  film_id INT NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Watchlist (many-to-many between users and films)
CREATE TABLE watchlist (
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  film_id INT NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, film_id)
);

-- Showdowns
CREATE TABLE showdowns (
  id SERIAL PRIMARY KEY,
  film_a_id INT NOT NULL REFERENCES films(id),
  film_b_id INT NOT NULL REFERENCES films(id),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Votes (one row per user per showdown, prevents double voting)
CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  showdown_id INT NOT NULL REFERENCES showdowns(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  choice VARCHAR(10) NOT NULL CHECK (choice IN ('film_a', 'film_b')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (showdown_id, user_id)
);
