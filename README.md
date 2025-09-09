# Neurolancer - AI Freelance Marketplace

A comprehensive platform connecting clients with AI experts and freelancers specializing in artificial intelligence services.

## 🏗️ Project Structure

```
neurolancer/
├── backend/          # Django REST API
├── web/             # Next.js Frontend
├── mobile/          # Future React Native App
└── README.md        # This file
```

## 🚀 Quick Start

### Backend (Django)
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python populate_db.py
python manage.py runserver 8000
```

### Frontend (Next.js)
```bash
cd web
npm install
npm run dev
```

## 📱 Applications

### 🔧 Backend API (Django)
- **Location**: `/backend`
- **Port**: 8000
- **Database**: PostgreSQL (Production) / SQLite (Development)
- **Features**: Complete REST API with authentication, real-time messaging, payments

### 🌐 Web Frontend (Next.js)
- **Location**: `/web`
- **Port**: 3000
- **Framework**: Next.js 14 with TypeScript
- **Features**: Modern React app with 40+ pages, real-time chat, responsive design

### 📱 Mobile App (Future)
- **Location**: `/mobile`
- **Framework**: React Native (Planned)
- **Features**: Native mobile experience

## 🔗 Live Demo

- **Frontend**: [https://neurolancer-9omq-6xxk34397-kbrian1237s-projects.vercel.app/](https://neurolancer-9omq-6xxk34397-kbrian1237s-projects.vercel.app/)
- **Backend API**: [https://neurolancer.onrender.com/api](https://neurolancer.onrender.com/api)
- **Admin Panel**: [https://neurolancer.onrender.com/admin](https://neurolancer.onrender.com/admin)

## 🛠️ Technology Stack

### Backend
- Django 5.2.5 + Django REST Framework
- PostgreSQL (Production) / SQLite (Development)
- WebSocket support for real-time features
- Paystack payment integration
- JWT authentication

### Frontend
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Real-time messaging
- Responsive design

## 📋 Features

### Core Functionality
- ✅ User authentication & profiles
- ✅ Gig marketplace
- ✅ Order management system
- ✅ Real-time messaging
- ✅ Payment processing
- ✅ Learning platform
- ✅ Assessment system
- ✅ Admin dashboard

### AI Service Categories
- Machine Learning
- Computer Vision
- Natural Language Processing
- Data Science
- Automation
- AI Security

## 🚀 Deployment

### Backend (Render)
```bash
cd backend
# Already configured with build.sh and production settings
```

### Frontend (Vercel)
```bash
cd web
npm run build
# Deploy to Vercel
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational and demonstration purposes.

## 📞 Contact

For questions or support, please open an issue in this repository.