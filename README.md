# Real Estate Dashboard

<div align="center">

![React](https://img.shields.io/badge/React-18.2-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.0-purple?logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Latest-green?logo=supabase)
![Tailwind](https://img.shields.io/badge/Tailwind-3.3-cyan?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-yellow)

A complete, production-ready real estate management web application with role-based access control, built with React.js and Supabase.

[Quick Start](#quick-start) • [Features](#features) • [Demo](#demo) • [Documentation](#documentation) • [Deploy](#deployment)

</div>

---

## 📸 Screenshots

### Admin Dashboard
Beautiful overview with statistics and quick actions.

### Agent Dashboard
Personal dashboard for agents to manage their listings.

### Property Management
Full CRUD operations with image uploads and advanced filtering.

---

## ✨ Features

### 👨‍💼 Admin Features
- ✅ **Dashboard** - Comprehensive overview with statistics
- ✅ **Agent Management** - Add, edit, and remove agent accounts
- ✅ **Project Management** - Create and manage property projects
- ✅ **Property Oversight** - View and manage all property listings
- ✅ **Advanced Search** - Filter by type, location, price, and status
- ✅ **Full CRUD** - Complete control over all data

### 🏠 Agent Features
- ✅ **Personal Dashboard** - Overview of their listings and performance
- ✅ **Add Properties** - Create new property listings with images
- ✅ **Edit Properties** - Update their own property details
- ✅ **Copy Properties** - Duplicate listings for quick entry
- ✅ **Search & Filter** - Find properties quickly
- ✅ **Image Uploads** - Upload multiple property images

### 🔐 Common Features
- ✅ **Authentication** - Secure login, signup, and password reset
- ✅ **Role-Based Access** - Admin and Agent permissions
- ✅ **File Uploads** - Images stored in Supabase Storage
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Real-time Updates** - See changes instantly
- ✅ **Modern UI** - Beautiful design with Tailwind CSS
- ✅ **API/Webhook** - Add properties programmatically via REST API

---

## 🚀 Quick Start

Get up and running in 5 minutes!

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Add your Supabase credentials to .env

# 3. Set up database (run SQL in Supabase)
# Copy contents of supabase/migrations.sql to Supabase SQL Editor

# 4. Start development server
npm run dev
```

Visit `http://localhost:3000` and create your account!

📚 **Need more help?** See [QUICK_START.md](QUICK_START.md) for detailed instructions.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool & dev server |
| **Supabase** | Backend (Auth, Database, Storage) |
| **Tailwind CSS** | Styling |
| **React Router** | Routing |
| **React Hook Form** | Form handling |
| **Lucide React** | Icons |
| **React Hot Toast** | Notifications |

---

## 📊 Database Schema

### Profiles (Users)
```sql
id, name, email, role (admin/agent), created_at, updated_at
```

### Projects
```sql
id, name, description, location, created_by, created_at, updated_at
```

### Properties
```sql
id, project_id, agent_id, title, type, price, description, 
images, status, bedrooms, bathrooms, area, address, 
created_at, updated_at
```

All tables have **Row Level Security (RLS)** enabled for maximum security.

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [QUICK_START.md](QUICK_START.md) | 5-minute setup guide |
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | Detailed setup with troubleshooting |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Deploy to Vercel, Netlify, AWS, etc. |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | API usage and examples |
| [API_WEBHOOK.md](API_WEBHOOK.md) | **Property API/Webhook documentation** |
| [WEBHOOK_SETUP.md](WEBHOOK_SETUP.md) | **Quick webhook setup guide** |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | Complete project overview |

---

## 🔒 Security Features

- ✅ **Row Level Security (RLS)** - Database-level access control
- ✅ **Role-Based Permissions** - Admin and Agent roles
- ✅ **Protected Routes** - Frontend route protection
- ✅ **Secure File Uploads** - Storage policies
- ✅ **Password Hashing** - Handled by Supabase Auth
- ✅ **SQL Injection Prevention** - Parameterized queries
- ✅ **XSS Protection** - React's built-in protection

---

## 📱 Responsive Design

Works perfectly on:
- 📱 Mobile (iOS & Android)
- 📱 Tablet (iPad, Android tablets)
- 💻 Desktop (all screen sizes)
- 🖥️ Large displays

---

## 🎯 Use Cases

Perfect for:
- 🏢 Real estate agencies
- 👨‍💼 Independent real estate agents
- 🏘️ Property developers
- 🏗️ Construction companies
- 🏠 Property management companies

---

## 🚀 Deployment

Deploy to your favorite platform in minutes:

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Docker
```bash
docker build -t real-estate-dashboard .
docker run -p 80:80 real-estate-dashboard
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment guides.

---

## 📦 Project Structure

```
dashboard/
├── src/
│   ├── components/       # Reusable components
│   ├── contexts/         # React contexts
│   ├── lib/             # Utilities (includes propertyApi.js)
│   └── pages/           # Page components
│       ├── auth/        # Authentication pages
│       ├── admin/       # Admin pages
│       └── agent/       # Agent pages
├── supabase/
│   ├── migrations.sql   # Database schema
│   └── functions/       # Edge Functions
│       └── add-property/ # Property API endpoint
├── examples/            # Code examples
│   └── webhook-example.js
├── public/              # Static assets
└── docs/               # Documentation
```

---

## 🎨 Customization

Easy to customize:
- **Colors** - Edit `tailwind.config.js`
- **Logo** - Replace icon in `Layout.jsx`
- **Branding** - Update text throughout
- **Features** - Add new features easily
- **Database** - Extend schema in migrations

---

## 📈 Performance

- ⚡ Fast page loads (< 2s)
- 📦 Optimized bundle size
- 🖼️ Image optimization via Supabase CDN
- 💾 Efficient database queries
- 📊 Lazy loading support

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with amazing open-source technologies:
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)

---

## 📞 Support

- 📖 [Documentation](SETUP_GUIDE.md)
- 🐛 [Report Issues](https://github.com/yourusername/dashboard/issues)
- 💬 [Discussions](https://github.com/yourusername/dashboard/discussions)

---

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

<div align="center">

**Built with ❤️ using React, Supabase, and Tailwind CSS**

[⬆ Back to Top](#real-estate-dashboard)

</div>

