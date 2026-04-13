# Nhà Mình - Expense Management PWA 🏠💸

A simple, private, and beautiful expense management web application built for couples to track their shared finances seamlessly.

![Nhà Mình Preview](https://github.com/emlanam2608/our-pocket/raw/main/public/icons/icon-512.png)

## 🚀 Built With
- **Next.js 16 (App Router)**: Fast, server-side rendered, and modern.
- **Firebase**: Firestore for real-time data, Authentication (Anonymous) for security.
- **Tailwind CSS v4**: Ultra-modern styling with glassmorphism and custom animations.
- **Serwist**: Robust PWA support with advanced caching and push notifications.
- **Framer Motion**: Smooth page transitions and interactive micro-animations.
- **Shadcn UI & Recharts**: Beautiful components and insightful data visualization.

## ✨ Key Features
- **Password Gate**: Private access secured by a global password.
- **Real-time Sync**: Transactions shared instantly between devices.
- **Mobile-First Design**: Optimized for "Add to Home Screen" experience.
- **Push Notifications**: Get notified instantly when your partner adds a transaction.
- **Detailed Insights**: Pie charts and group history for clear spending analysis.
- **Offline Support**: Access your data even without an active internet connection.

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- Firebase Project
- Vercel Account (recommended for deployment)

### 1. Installation
```bash
git clone https://github.com/emlanam2608/our-pocket.git
cd our-pocket
npm install
```

### 2. Environment Setup
Create a `.env.local` file in the root and fill in the following:

```env
GLOBAL_PASSWORD="your_secret_password"

NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_auth_domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
NEXT_PUBLIC_FIREBASE_VAPID_KEY="your_vapid_key"
```

### 3. Run Locally
```bash
npm run dev
```

## 📦 Deployment

### Frontend (Vercel)
Connect your repository to Vercel and ensure all environment variables are added to the project settings.

### Background Logic (Firebase Functions)
Ensure the Cloud Functions are deployed to handle cross-device notifications:
```bash
firebase deploy --only functions
```

## 📝 License
This project is private and for personal use.

---
Built with ❤️ for **Nhà Mình**.
