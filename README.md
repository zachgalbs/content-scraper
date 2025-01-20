# Overview

## Description

This project is a Slack app designed to fetch, summarize, and score the relevance of articles from various news sources. It utilizes the Slack CLI and Deno runtime to automate workflows and send reminders with article information.

## Goal

To build an evolving list of AI influencers, potential podcast guests, and trending topics by analyzing current AI trends.

## Features (so far)

- Fetches articles from multiple RSS feeds.
- Summarizes articles using OpenAI's API.
- Scores articles based on relevance to AI, machine learning, and native development.
- Sends relevent articles to a specified Slack channel.

## Project Structure

- **workflows/**: Defines workflows for automating tasks within Slack.
- **functions/**: Contains functions for fetching and processing articles.
- **triggers/**: Sets up triggers to automate workflow execution.
- **datastores/**: Manages data storage for articles.
- **manifest.ts**: Configures the app's settings and permissions.

## Functionality

### Workflows

- **Reminder Workflow:**
  - Defines workflow with channel_id input
  - Sends the final message to Slack with the source, title, author, url, summary, relevance score, and explanation for the relevance score.

### Functions

- **Parse RSS Feed:**
  - Looks through Really Simple Syndication Feed provided by the website and gets each article or 'item' from the xml text
  - Goes through each article and finds the title, link, date published, and the creator of the article.
  - Returns every article available (around 20) with these variables
 
- **Fetch Latest Articles:**
  - Goes through each source provided and retrieves the article(s) via the Parse RSS Feed function
  - Gets articles from each source and generates a summary for each article
  - Pushes articles from source to list of all articles with the source, title, summary etc.
  - Finally, returns a sorted list of all the articles based on their publish date

- **Get Article Info:**
  - Gets the sorted list of latest articles, and returns a new list of article objects with the date published omitted
 
- **Summarize Text:**
  - Given an article's text, prompts chatgpt 4o mini to summarize the text

- **Score Relevance**
  - Rates the relevance of an article on a scale of 1-100 based on a subjective interpretation of how related the article is to AI stuff
  - Also gives an explanation on why it gave the score it did (e.g. Low score because there was no mention of AI)

### Triggers

- **Scheduled Trigger**
  - Triggers Reminder Workflow hourly on 'bot-testing' channel
 
- **Shortcut Trigger**
  - Triggers Reminder Workflow manually by providing a link to run in the channel

### Datastores

- **Article Datastore**
  - Defines a datastore to hold all previous articles
  - Purpose is to reduce spam in channel
