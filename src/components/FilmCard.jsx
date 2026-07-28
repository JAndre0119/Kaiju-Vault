function FilmCard({ film, action }) {
  return (
    <div className="film-card">
      {film.poster_url && <img src={film.poster_url} alt={film.title} width={100} />}
      <div className="film-card-body">
        <h3>{film.title}</h3>
        {film.genre && <p className="film-genre">{film.genre}{film.year ? ` · ${film.year}` : ''}</p>}
        {film.description && <p className="film-description">{film.description}</p>}
      </div>
      {action && <div className="film-card-action">{action}</div>}
    </div>
  )
}

export default FilmCard
