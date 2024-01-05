# 📧 Auto-Reply Email System

## Overview 🌐
This project automates the process of responding to unread emails in Gmail 📬. It's particularly useful for times when you're unavailable, like during vacations 🏖️. Using Google's Gmail API, it scans your inbox for unread messages, sends a predefined auto-reply, and organizes your inbox by labeling and moving processed emails.

## Features 🌟

- **Automatic Email Replies:** 🚀 Sends custom auto-replies to unread emails.
- **Label Management:** 🏷️ Applies a specific label to processed emails and moves them out of the inbox.
- **Randomized Intervals:** ⏱️ Operates at random intervals for a more human-like interaction.
- **Secure Authentication:** 🔒 Uses Google's secure authentication to access your Gmail account.

## Technologies 💻

- Node.js
- Google APIs
- JavaScript (ES6+)

## Setup and Installation 🛠️

1. **Clone the Repository**
2. **Install Dependencies**
3. **Configure Google API Credentials**
- Set up your credentials following [Google's guide](https://developers.google.com/gmail/api/quickstart/nodejs).
- Save your credentials in `credentials.json`.
4. **Run the Application**



## Usage 📋

After running the application, it will periodically check your Gmail inbox for unread emails. When it finds any, it will send an auto-reply and apply the label `"open-in-app-backend"` to the email, then move it out of the inbox.

Thank-You

Regards,
Sarthak Saraf
