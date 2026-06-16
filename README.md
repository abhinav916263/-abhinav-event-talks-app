# BigQuery Release Insights Dashboard

A premium, fully-responsive dashboard built using **Python Flask** and **Vanilla HTML/JS/CSS**. The application fetches the real-time Google Cloud BigQuery release notes Atom XML feed, groups updates by date, parses distinct update types (Features, Changes, Issues, Deprecated), and allows users to compose and post updates to X (formerly Twitter) with an interactive character-limited composer.

## 🚀 Key Features

*   **Real-time Feed Synchronization**: Click the "Refresh" button to dynamically fetch and parse the latest BigQuery release notes with a smooth rotating sync animation.
*   **Instant Client-side Searching & Filtering**: Search through updates instantly by date, title, type, or content, and filter by update category (Features, Changes, Issues, Deprecated) without page reloads.
*   **Interactive X (Twitter) Composer**:
    *   Strips complex HTML tags from the release note into clean, tweet-friendly plain text.
    *   Automatically drafts a tweet with the update type, date, truncated description, and a direct anchor link to the official Google Cloud documentation.
    *   Includes a real-time character counter and a **glowing circular progress ring** (modeled after X's composer) that changes color (Blue ➡️ Orange ➡️ Red) as you approach the 280-character limit.
    *   Links directly to X Web Intents for seamless sharing.
*   **Premium Visual Aesthetics**:
    *   Glassmorphic dark design theme (`backdrop-filter: blur(20px)`).
    *   Color-coded highlights indicating note classification (Cyan for Features, Indigo for Changes, Rose for Issues, Purple for Deprecated).
    *   Subtle background blur gradients and micro-animations for interactive hover states.
    *   Skeleton loader cards with a shimmer effect during feed loads.

---

## 🛠️ Tech Stack

*   **Backend**: Python Flask (handling feed fetching, entry segmentation, and HTML cleaning)
*   **Frontend**: Vanilla HTML5, Vanilla CSS3 (Custom Variables, Flexbox/Grid, Animations), Vanilla JavaScript (ES6+, Fetch API, Canvas-free CSS Progress Ring)
*   **Icons**: Handcrafted inline SVGs for scalability and fast loading without external webfont dependencies.

---

## 📂 Project Structure

```
├── app.py                  # Flask backend server & XML parsing engine
├── requirements.txt        # Python library dependencies
├── .gitignore              # Standard git exclusion lists
├── templates/
│   └── index.html          # Dashboard structure & Tweet composer modal
└── static/
    ├── css/
    │   └── style.css       # Custom styles, animations, and theme configuration
    └── js/
        └── app.js          # App lifecycle, search/filters, and modal mechanics
```

---

## 💻 Setup and Installation

### Prerequisites
Make sure you have **Python 3.x** installed on your system.

### Steps to Run Locally

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/abhinav916263/-abhinav-event-talks-app.git
    cd -abhinav-event-talks-app
    ```

2.  **Create a Virtual Environment (Optional but Recommended)**:
    ```bash
    python -m venv venv
    # On Windows:
    .\venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```

3.  **Install Prerequisites**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Start the Server**:
    ```bash
    python app.py
    ```

5.  **Access the Dashboard**:
    Open your browser and navigate to [http://127.0.0.1:5000/](http://127.0.0.1:5000/).

---

## 📝 XML Parsing Logic Details
The application downloads the Atom XML feed from `https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`. It processes individual entry items, extracting the date and link anchor, and uses regular expression matching to split the day's release notes by `<h3>` tags (e.g. `<h3>Feature</h3>`, `<h3>Issue</h3>`). This allows the dashboard to display each note as a standalone cards instead of dumping the day's entire feed as a single block, enabling precise filtering and sharing.
