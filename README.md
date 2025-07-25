# SplitSync – AI-Powered Group Expense Management Platform

SplitSync is an intelligent, real-time expense-splitting application built to simplify shared finances among friends, families, roommates, and teams. With a sleek modern interface and deep AI integration, it offers an effortless and engaging way to track expenses, manage groups, and settle up collaboratively.

---

## 🌟 Features

### ✨ Core Functionalities

* **Group Creation & Management**: Create customizable groups (e.g., "Goa Trip", "Flatmates"), invite users via email or shareable link, and manage group details.
* **Flexible Expense Tracking**: Add, edit, and delete expenses with descriptions, categories, receipts, date, and payer.
* **Advanced Splitting**: Split expenses equally or unequally (percentages, shares, or exact values) across selected members.
* **Debt Settlement Engine**: Smart algorithm suggests minimal transactions required to settle all balances.
* **User Profiles**: Secure sign-up, login/logout, profile management with avatar, email update, and password change.
* **Persistent State**: Zustand-based global state management with localStorage support ensures data persistence across sessions.
* **Mock Payment Flow**: Simulate payments using QR code-based confirmation and update balances accordingly.

### 🤖 AI-Powered Enhancements (via Genkit & Google Gemini)

* **Conversational AI Assistant (/chat)**: Natural language commands like "/add 1200 for lunch paid by Tanveer in Goa Trip" to auto-log expenses.
* **Receipt Scanning**: Upload receipts to auto-fill description, amount, and date using OCR.
* **Smart Suggestions**:

  * Category prediction
  * Merchant name autocomplete
  * Personalized settlement nudges
  * AI-generated analytics summaries
  * Badge prediction and next achievement tips
* **Voice Accessibility**: Convert AI assistant replies into speech using text-to-speech.

### 📊 Analytics & Visualizations

* **Dashboard Overview**: Summary cards showing total groups, balances, and invitations.
* **Analytics Page**:

  * Bar chart of member contributions
  * Pie chart of spend categories
  * AI-generated natural language group summary
  * Leaderboard of top contributors

### 💬 Real-Time Collaboration

* **Chat Room (/chat)**: Group-wide messaging with mentions, reactions, edits, deletions, and image uploads.
* **AI Interaction in Chat**: Chatbot auto-responds to commands or triggers with smart replies and expense actions.
* **Real-Time Sync**: Live updates to expenses, payments, and balances using WebSockets or Firebase.

### 🎮 Gamification

* Earn badges such as:

  * "First Timer"
  * "Group Starter"
  * "Quick Settler"
* Badge tracking and motivational nudges on profile page

### 📧 Email Automation (Resend + Genkit)

* Password reset flows
* Invite emails and group join confirmations
* Notifications for added expenses, payments, and settle-ups

### 🌍 Novel & Unique Features

* **Natural Language Expense Entry**: Users can enter expenses using plain English commands.
* **AI Receipt Intelligence**: Automated scanning and form-filling for uploaded bills and receipts.
* **Badge Suggestion Engine**: Genkit suggests achievable badges based on user activity.
* **Merchant & Category AI Autocomplete**: Predict merchant names and assign categories in real-time.
* **Voice-Enabled Assistant**: Text-to-speech for accessibility and user engagement.
* **Smart Settle Nudges**: Personalized reminders when you’re close to a debt threshold.
* **Gamified Analytics**: Fun leaderboard and activity charts to encourage timely reimbursements.
* **Fully Editable Group Info**: Edit group name, avatar, and members dynamically.
* **Mock QR Payment Flow**: Simulated reimbursements with visual feedback.

---

## 💡 Tech Stack

| Category           | Technology                                          |
| ------------------ | --------------------------------------------------- |
| Frontend           | Next.js, React, TypeScript, Tailwind CSS, ShadCN UI |
| State Management   | Zustand                                             |
| Forms              | React Hook Form                                     |
| Icons & Animations | Lucide React, Framer Motion                         |
| Charts             | Recharts                                            |
| AI Integration     | Genkit, Google Gemini Models                        |
| Backend/Infra      | Next.js API Routes                                  |
| Email              | Resend + Genkit Flows                               |

---

## 📅 Pages Overview

| Route        | Description                                    |
| ------------ | ---------------------------------------------- |
| `/`          | Landing page with app intro and pricing tiers  |
| `/dashboard` | Group overview with balance summaries          |
| `/analytics` | AI-powered insights and visual breakdowns      |
| `/chat`      | Real-time chat interface for each group        |
| `/profile`   | Manage user info, view badges, change password |

---

## 🛠️ Setup Instructions

Open a terminal or command prompt, navigate into the project folder you just created, and run the following commands:

```bash
# Clone the repository
git clone https://github.com/your-username/splitsync.git
cd splitsync

# Install all the necessary dependencies
npm install

# Start the local development server
npm run dev
```

Your application should now be running locally, and you can open it in your web browser at the address provided in the terminal (usually `http://localhost:9002`).

> Ensure environment variables are configured for Genkit, Resend, and your DB.

```bash
git clone https://github.com/your-username/splitsync.git
cd splitsync
npm install
npm run dev
```

> Ensure environment variables are configured for Genkit, Resend, and your DB.

---

## 🎥 Working Visuals

![Dashboard View](https://github.com/tanveerbedi/SplitSync-Smart-Group-Expense-Tracker/blob/b8f0d2c818146564d0bda5c89fbcd7063c5e84f6/Dashboard.png)
![Expense Entry Form](https://github.com/tanveerbedi/SplitSync-Smart-Group-Expense-Tracker/blob/b8f0d2c818146564d0bda5c89fbcd7063c5e84f6/Expense%20form.png)
![AI Enabled Chat Room](https://github.com/tanveerbedi/SplitSync-Smart-Group-Expense-Tracker/blob/b8f0d2c818146564d0bda5c89fbcd7063c5e84f6/Chat%20room.png)
![AI Assistant Bot](https://github.com/tanveerbedi/SplitSync-Smart-Group-Expense-Tracker/blob/b8f0d2c818146564d0bda5c89fbcd7063c5e84f6/AI%20assistant.png)

---

## 🎓 Credits

Made with ❤️ by [Tanveer Singh]

* [LinkedIn](https://www.linkedin.com/in/tanveer-singh-bedi-a8b811177/)
* [GitHub](https://github.com/tanveerbedi)
* Email: [tsbedi2604@gmail.com](mailto:tsbedi2604@gmail.com)
---

## 🌐 License

MIT License. Feel free to use, improve, or contribute.

---
