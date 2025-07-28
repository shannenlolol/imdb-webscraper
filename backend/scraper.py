import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import pandas as pd
import time

def crawl_imdb():
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument(
    "user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
)
    driver = webdriver.Chrome(options=options)
    driver.get("https://www.imdb.com/chart/moviemeter/")

    time.sleep(3)

    items = driver.find_elements(By.CSS_SELECTOR, "li.ipc-metadata-list-summary-item")[:10]
    print("Found", len(items), "movies")

    data = []
    for item in items:
        try:
            title_el = item.find_element(By.CSS_SELECTOR, "h3")
            title = title_el.text.strip()

            link = item.find_element(By.CSS_SELECTOR, "a.ipc-title-link-wrapper").get_attribute("href")

            meta_spans = item.find_elements(By.CSS_SELECTOR, "div.cli-title-metadata span")
            year = meta_spans[0].text if len(meta_spans) > 0 else None
            duration = meta_spans[1].text if len(meta_spans) > 1 else None
            age_rating = meta_spans[2].text if len(meta_spans) > 2 else None
            try:
                poster = item.find_element(By.CSS_SELECTOR, "img.ipc-image").get_attribute("src")
            except:
                poster = None
            try:
                rating_container = item.find_element(By.CSS_SELECTOR, "div.cli-ratings-container")
                imdb_score = rating_container.find_element(By.CLASS_NAME, "ipc-rating-star--rating").text.strip()
                vote_count = rating_container.find_element(By.CLASS_NAME, "ipc-rating-star--voteCount").text.strip("() ").replace(",", "")
            except Exception:
                imdb_score = None
                vote_count = None

            # Normalise values
            imdb_score = imdb_score if imdb_score != "N/A" else None
            vote_count = vote_count if vote_count != "N/A" else None

            data.append({
                "Title": title,
                "Year": year,
                "Duration": duration,
                "Rating": age_rating,
                "IMDbScore": imdb_score,
                "VoteCount": vote_count,
                "Link": link,
                "Poster": poster
            })

        except Exception as e:
            print("Error parsing item:", e)

    driver.quit()
    print("Collected", len(data), "entries")

    df = pd.DataFrame(data)
    df.replace({"N/A": None, "": None}, inplace=True)

    timestamp = datetime.datetime.now().isoformat()
    filename = f"imdb_popular_movies_{timestamp}.csv"
    df.to_csv(f"scraped_data/{filename}", index=False, encoding="utf-8")  # Save to a folder
    print(f"Saved to scraped_data/{filename}")

if __name__ == "__main__":
    crawl_imdb()
