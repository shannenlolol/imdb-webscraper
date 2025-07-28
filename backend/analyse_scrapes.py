import pandas as pd
import os
import matplotlib.pyplot as plt

def load_all_scrapes(folder="scraped_data"):
    all_data = []
    for file in sorted(os.listdir(folder)):
        if file.endswith(".csv"):
            timestamp = file.replace("imdb_popular_movies_", "").replace(".csv", "")
            df = pd.read_csv(os.path.join(folder, file))
            df["ScrapeTime"] = timestamp
            df["IMDbScore"] = pd.to_numeric(df["IMDbScore"], errors="coerce")
            df["VoteCount"] = df["VoteCount"].astype(str).str.replace("K", "e3").str.replace("M", "e6")
            df["VoteCount"] = pd.to_numeric(df["VoteCount"], errors="coerce")
            all_data.append(df)

    if not all_data:
        raise ValueError("No CSV files found in scraped_data/")

    return pd.concat(all_data, ignore_index=True)


def plot_top_movie_trend(df, top_n=5):
    # Focus on movies that appear multiple times
    grouped = df.groupby(["Title", "ScrapeTime"])["IMDbScore"].mean().reset_index()
    title_counts = grouped["Title"].value_counts()
    top_titles = title_counts.head(top_n).index.tolist()

    plt.figure(figsize=(12, 6))
    for title in top_titles:
        temp = grouped[grouped["Title"] == title]
        plt.plot(temp["ScrapeTime"], temp["IMDbScore"], label=title)

    plt.xticks(rotation=45)
    plt.ylabel("IMDb Score")
    plt.title(f"IMDb Score Trends for Top {top_n} Reappearing Movies")
    plt.legend()
    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    df = load_all_scrapes()
    df = df.dropna(subset=["Title", "IMDbScore"])
    plot_top_movie_trend(df)
