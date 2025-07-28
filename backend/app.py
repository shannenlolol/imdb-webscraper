import os
import numpy as np
import pandas as pd
from flask import Flask, jsonify
from flask_cors import CORS
from scraper import crawl_imdb 
from analyse_scrapes import load_all_scrapes

app = Flask(__name__)
CORS(app)

@app.route("/api/analysis", methods=["GET"])
def get_analysis_data():
    try:
        df = load_all_scrapes()
        df = df.dropna(subset=["Title", "IMDbScore"])

        top_titles = df["Title"].value_counts().head(5).index.tolist()
        df = df[df["Title"].isin(top_titles)]

        grouped = df.groupby(["Title", "ScrapeTime"]).agg({
            "IMDbScore": "mean",
            "VoteCount": "mean"
        }).reset_index()
        grouped = grouped.replace({np.nan: None}) 

        grouped = grouped.where(pd.notnull(grouped), None)
        return jsonify(grouped.to_dict(orient="records"))
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


@app.route('/api/crawl', methods=['GET'])
def trigger_crawl():
    crawl_imdb()  # run the scraper
    return jsonify({"message": "Crawling completed!"})

@app.route('/api/data', methods=['GET'])
def get_data():
    folder = "scraped_data"
    csv_files = [f for f in os.listdir(folder) if f.endswith(".csv")]
    if not csv_files:
        return jsonify({"error": "No CSV files found."}), 400

    latest_csv = sorted(csv_files)[-1]
    df = pd.read_csv(os.path.join(folder, latest_csv))

    if df.empty:
        return jsonify({"error": "CSV contains no data."}), 400

    df = df.dropna(subset=["Title", "Year"])  
    df["Year"] = pd.to_numeric(df["Year"], errors="coerce")
    df["Rating"] = df["Rating"].astype(str) 
    df = df.where(pd.notnull(df), None)
    df = df.replace({np.nan: None})

    print(df.to_dict(orient="records"))
    return jsonify(df.to_dict(orient="records"))

if __name__ == '__main__':
    app.run(debug=True)


