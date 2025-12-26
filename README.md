# Ranveer Analytics — Review Trend Analyzer

> **Professional, AI-powered dashboard for analyzing Google Play Store reviews (Swiggy, Zomato, Blinkit, etc.)**

---

## Demo & Try-it-out
- **YouTube demo (replace with your video URL):** https://youtu.be/nU5T-Nn7ACA
- **Try it live (replace with your hosted app URL):** 

---

## Table of Contents
1. Project Overview  
2. Key Features  
3. Architecture & Tech Stack  
4. Database Schema  
5. Edge Functions & Data Flow  
6. Getting Started (Local Setup)  
7. Environment Variables  
8. Running the App (Mock vs Live Data)  
9. How to Use the Dashboard  
10. Custom Topics  
11. Deployment Notes  
12. Troubleshooting  
13. Roadmap  
14. License  

---

## Project Overview

**Ranveer Analytics** is an AI-driven Review Trend Analysis platform designed to process **daily batches of Google Play Store reviews** starting from **June 1, 2024** onward.

The system simulates a real-world production environment where new reviews arrive every day. An AI agent consumes these reviews, extracts meaningful topics, categorizes them as **Issues**, **Requests**, or **Feedback**, deduplicates similar themes, and generates a trend report with historical tracking.

The dashboard is designed with a **Bloomberg-terminal–style dark UI**, optimized for high information density and executive-level insights.

---

## Key Features

- Multi-app support (Swiggy, Zomato, Blinkit, extensible)
- Daily batch-based review ingestion
- AI-powered topic extraction & semantic deduplication
- Classification into:
  - Issues
  - Feature Requests
  - User Feedback
- Trend direction detection (Up / Down / Stable)
- 31-day heatmap & line chart visualizations
- Historical report storage
- CSV export for offline analysis
- Custom seed topics for domain tuning
- Toggle between mock data and live Play Store scraping

---

## Architecture & Tech Stack

**Frontend**
- Next.js (TypeScript)
- Tailwind CSS (custom dark analytics theme)
- Glassmorphism UI with animations

**Backend**
- Edge Functions (Serverless)
- Supabase / PostgreSQL

**AI Layer**
- Ranveer AI (LLM-based topic extraction & deduplication)
- Prompt-engineered for review clustering & trend detection

**Scraping**
- Firecrawl (Google Play Store reviews)

## Database Schema

### Tables

#### `analysis_reports`
Stores metadata for each generated report.
- id (UUID)
- app_id
- app_name
- target_date
- date_range_start
- date_range_end
- total_reviews_analyzed
- created_at

#### `report_topics`
Stores topics discovered per report.
- report_id
- topic
- category (`issue`, `request`, `feedback`)
- total_count
- trend (`up`, `down`, `stable`)
- trend_percentage

#### `topic_frequencies`
Daily frequency of each topic.
- topic_id
- date
- frequency

#### `custom_topics`
User-defined seed topics.
- topic
- category
- app_id (optional)
- is_active

> ⚠️ Demo-friendly RLS policies are enabled. Harden them for production.

---

## Edge Functions & Data Flow

### Core Functions

- **scrape-reviews**
  - Fetches Play Store reviews via Firecrawl
  - Runs per app per day

- **analyze-reviews**
  - Sends reviews to Ranveer AI
  - Extracts topics and categories
  - Stores results in the database

- **deduplicate-topics**
  - Merges semantically similar topics
  - Reduces noise and redundancy

### Daily Flow

1. New reviews arrive (daily batch)
2. Reviews are scraped or simulated
3. AI extracts and categorizes topics
4. Trends are computed vs historical data
5. Report is stored and visualized

---

## Getting Started (Local Setup)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ranveer-analytics.git
cd ranveer-analytics
npm install
npm run dev

