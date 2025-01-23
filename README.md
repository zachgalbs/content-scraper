# Overview

## Description

This project is a Slack app designed to fetch, summarize, and score the relevance of articles from various news sources. It utilizes the Slack CLI and Deno runtime to automate workflows and send reminders with article information.

## Goal

To build an evolving list of AI influencers, potential podcast guests, and trending topics by analyzing current AI trends.

## Features (so far)

- Fetches and parses articles from multiple RSS feeds.
- Filters articles based on relevance to AI native development.
- Summarizes articles using OpenAI's API.
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

#### Getting Articles:

  - **Parse RSS Feed:**
    - Looks through Really Simple Syndication Feed provided by the source and gets each article or 'item' from the xml text
    - Goes through each article and finds the title, link, date published, creator, and full text of the article.
    - Returns every article available (around 20) with these variables
   
  - **Fetch Latest Articles:**
    - Goes through each source provided and retrieves the articles via the Parse RSS Feed function
    - Sorts articles by date published, adds the three latest articles to a list
    - Returns the list of all the articles
   
  - **Summarize Text:**
    - Given an article's full text, prompts chatgpt 4o mini to summarize the text
  
  - **Score Relevance**
    - Rates the relevance of an article on a scale of 1-100 based on a subjective interpretation of how related the article is to AI stuff
    - Also gives an explanation on why it gave the score it did (e.g. Low score because there was no mention of AI)

#### Filtering Articles:

  - **Datastore Filter Articles:**
    - Checks each article against a datastore to determine if it already exists.
    - If an article is found in the datastore, it is skipped to avoid duplicate messages.
    - Articles not found in the datastore are added to a 'filtered list'.
    - Returns a list of unique articles that are not already stored.
   
      
  - **Filter Relevant Articles:**
    - Takes the 'filtered list' and filters them again based on their relevance to AI, machine learning, and native development.
    - For each article, it uses a 'Score Relevance' function to determine a relevance score with ChatGPT.
    - Only articles with a score greater than 70 are considered relevant and included in the output.
    - Returns a list of relevant articles, each annotated with a relevance score and an explanation.

 - **Store Article Function**
   - First, defines the inputs as the article title, link, and date published
   - Next, defines the outputs as a boolean 'success' parameter and a message (e.g. success: true, message: saved successfully at __)
   - Lastly, uses Slack's datastore.put command to put a list of articles in the datastore.

### Triggers

- **Scheduled Trigger**
  - Triggers Reminder Workflow hourly on 'bot-testing' channel
 
- **Shortcut Trigger**
  - Triggers Reminder Workflow manually by providing a link to run in the channel

### Datastores

- **Article Datastore**
  - Defines a datastore to hold all previous articles
  - Purpose is to reduce spam in channel
