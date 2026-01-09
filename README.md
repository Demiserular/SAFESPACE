# Safe Space

A secure, anonymous mental health support platform built with Next.js and Supabase, featuring AI-powered conversations and community support tools.

## Overview

Safe Space is a comprehensive mental health support application that provides users with a safe, anonymous environment to connect with others, access AI-powered support, and participate in moderated discussions. The platform emphasizes user privacy, security, and accessibility.

## Features

### Core Functionality

- **Anonymous User System**: Users can participate without revealing personal information
- **Real-time Chat Rooms**: Community discussions with WebSocket support
- **AI Companion (Serene)**: Google Gemini-powered conversational AI for mental health support
- **Post and Comment System**: Structured discussions with nested comments
- **Reaction System**: Emotional support through likes, hearts, and hugs
- **Moderation Tools**: Admin and moderator capabilities for content management

### Technical Features

- **Progressive Web App (PWA)**: Offline-capable with service worker caching
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Real-time Updates**: Live notifications and chat updates
- **Offline Support**: Core functionality works without internet connection
- **Accessibility**: WCAG-compliant design with screen reader support

## Technology Stack

### Frontend

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Smooth animations and transitions

### Backend & Database

- **Supabase**: PostgreSQL database with real-time subscriptions
- **Row Level Security (RLS)**: Database-level access control
- **Supabase Auth**: Secure authentication system

### AI & APIs

- **Google Gemini AI**: Conversational AI companion
- **Crisis Detection**: Automated safety monitoring
- **Content Moderation**: AI-assisted moderation tools

### Infrastructure

- **Vercel/Netlify**: Serverless deployment
- **Progressive Web App**: Service worker caching
- **WebSocket**: Real-time communication

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Demiserular/SAFESPACE.git
   cd SAFESPACE
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file with the following variables:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Database Setup**

   - Create a new Supabase project
   - Run the database setup script located in `docs/QUICK-START.md`
   - Update your environment variables with the Supabase credentials

5. **Development Server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Schema

The application uses a PostgreSQL database with the following main tables:

- `posts`: User-generated content and discussions
- `comments`: Nested comment system
- `reactions`: Emotional support reactions
- `reports`: Content moderation system
- `user_roles`: Administrative permissions

All tables implement Row Level Security (RLS) policies for data protection.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── chat/              # Chat room functionality
│   └── posts/             # Post and comment system
├── components/            # Reusable React components
│   ├── ui/               # UI component library
│   └── comments/         # Comment system components
├── lib/                  # Utility functions and configurations
├── hooks/                # Custom React hooks
├── styles/               # Global styles and themes
├── public/               # Static assets
└── supabase/             # Database migrations and configuration
```


### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security & Privacy

Safe Space prioritizes user privacy and security:

- **Anonymous Participation**: No personal information required
- **End-to-End Security**: Encrypted data transmission
- **Crisis Detection**: Automated monitoring for safety
- **Content Moderation**: Human and AI-assisted moderation
- **Data Protection**: GDPR-compliant data handling

## License

This project is private and proprietary.

## Support

For technical support or questions:

- Create an issue in the GitHub repository
- Contact me

