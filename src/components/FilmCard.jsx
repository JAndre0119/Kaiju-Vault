function FilmCard({ film, action }) {
  return (
    <div className="film-card">
      <div className="film-card-poster">
        {film.poster_url ? (
          <img src={film.poster_url} alt={film.title} />
        ) : (
          <div className="film-card-poster-placeholder">{film.title}</div>
        )}
        <div className="film-card-title-overlay">
          <h3>{film.title}</h3>
          {film.genre && (
            <p className="film-card-meta">
              {film.genre}
              {film.year ? ` · ${film.year}` : ''}
            </p>
          )}
        </div>
      </div>
      <div className="film-card-body">
        {film.description && <p className="film-description">{film.description}</p>}
        {action && <div className="film-card-action">{action}</div>}
      </div>
    </div>
  )
}

export default FilmCard
