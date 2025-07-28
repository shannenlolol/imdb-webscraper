import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import TrendChart from "./TrendChart";

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastScraped, setLastScraped] = useState(null);

  const fetchData = () => {
    axios
      .get("http://localhost:5000/api/data")
      .then((res) => {
        try {
          if (Array.isArray(res.data)) {
            setData(res.data);
            console.log("Data set:", res.data);
          } else {
            console.warn("Expected array but got:", typeof res.data);
          }
        } catch (e) {
          console.error("Failed to parse response:", e);
        }
      })
      .catch((err) => console.error("Error fetching data:", err));
  };

  const handleScrape = () => {
    setLoading(true);
    axios
      .get("http://localhost:5000/api/crawl")
      .then(() => {
        fetchData();
        setRefreshKey((prev) => prev + 1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);
  const mapRating = (rating) => {
    const ratingMap = {
      G: "G",
      PG: "PG",
      "PG-13": "PG13",
      12: "PG13",
      "12A": "PG13",
      15: "R",
      18: "R",
      R: "R",
      "NC-17": "NC17",
      U: "G",
      "U/A": "PG",
      A: "R",
      "N/A": "All Ages",
      "": "All Ages",
    };

    const cleaned = rating?.trim().toUpperCase();
    return ratingMap[cleaned] || "All Ages";
  };

  return (
    <>
      <nav className='navbar'>
        <div className='logo'>🎬 IMDb Web Scraper</div>
        <div className='nav-links'>
          <a href='#top10'>Top 10 Movies</a>
          <a href='#chart'>Trend Charts</a>
          <button
            onClick={handleScrape}
            disabled={loading}
            className='scrape-btn'
          >
            {loading ? "Scraping…" : "Scrape IMDb"}
          </button>
        </div>
      </nav>

      <div className='container' id='top10'>
        <div className='header'>
          <h1>🎬 IMDb Top 10 Popular Movies</h1>
          <button onClick={handleScrape} disabled={loading}>
            {loading ? "Scraping..." : "Scrape IMDb"}
          </button>
        </div>
        {lastScraped && (
          <p className='last-scraped-text'>Last scraped at: {lastScraped}</p>
        )}

        {data.length === 0 ? (
          <p className='no-data'>No data available.</p>
        ) : (
          <div className='movie-list'>
            {data.map((movie, idx) => (
              <div key={idx} className='movie-row'>
                <div className='poster-section'>
                  <img
                    src={movie.Poster}
                    alt={movie.Title}
                    className='movie-poster'
                  />
                  <div className='rank-number'>#{idx + 1}</div>
                </div>
                <div className='details-section'>
                  <a
                    href={movie.Link}
                    target='_blank'
                    rel='noreferrer'
                    className='movie-title'
                  >
                    {movie.Title}
                  </a>
                  <p className='meta'>
                    <p className='meta'>
                      {movie.Year} · {movie.Duration} ·{" "}
                      {mapRating(movie.Rating)}
                    </p>
                  </p>
                </div>
                <div className='ratings-section'>
                  <p>⭐ {movie.IMDbScore ?? "N/A"}</p>
                  <p>{movie.VoteCount ? `${movie.VoteCount} votes` : "N/A"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className='container' id='chart'>
        <div className='header'>
          <h1>🎬 IMDb Trend Charts</h1>
          <button onClick={handleScrape} disabled={loading}>
            {loading ? "Scraping..." : "Scrape IMDb"}
          </button>
        </div>
        {lastScraped && (
          <p className='last-scraped-text'>Last scraped at: {lastScraped}</p>
        )}
      </div>
      <TrendChart refreshKey={refreshKey} setLastScraped={setLastScraped} />
    </>
  );
}

export default App;
