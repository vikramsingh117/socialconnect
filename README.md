# SocialConnect API

A comprehensive social media backend API built with NextJS and Supabase.

## Features

- 🔐 JWT-based authentication
- 👥 User profiles and following system
- 📝 Post creation with image upload
- ❤️ Like and comment functionality
- 🔔 Real-time notifications
- 👨‍💼 Admin dashboard
- 🔍 User search and discovery

## Tech Stack

- **Framework**: NextJS 14 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT + Supabase Auth
- **Real-time**: Supabase Real-time subscriptions
- **Language**: TypeScript

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd socialconnect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL schema from `database/schema.sql`
   - Get your project URL and API keys

4. **Environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/[id]` - Get user by ID
- `POST /api/users/follow` - Follow a user
- `DELETE /api/users/follow` - Unfollow a user
- `GET /api/users/search` - Search users

### Posts
- `POST /api/posts/create` - Create a new post
- `GET /api/posts/[id]` - Get post by ID
- `PUT /api/posts/[id]` - Update post
- `DELETE /api/posts/[id]` - Delete post
- `GET /api/posts/feed` - Get personalized feed
- `POST /api/posts/[id]/like` - Like a post
- `DELETE /api/posts/[id]/like` - Unlike a post
- `POST /api/posts/[id]/comment` - Comment on a post
- `GET /api/posts/[id]/comments` - Get post comments

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/[id]` - Mark notification as read

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/posts` - Get all posts (admin only)

## Database Schema

The application uses the following main tables:
- `users` - User profiles and authentication
- `posts` - Text content with image URLs
- `follows` - Follow/unfollow relationships
- `likes` - Post likes
- `comments` - Post comments
- `notifications` - Real-time notifications

## Development

### Project Structure
```
socialconnect/
├── app/
│   ├── api/           # API routes
│   └── page.tsx       # Home page
├── components/        # React components
├── lib/              # Utility libraries
├── types/            # TypeScript definitions
├── database/         # Database schema
└── utils/            # Helper functions
```

### Adding New Features

1. **Create API route** in `app/api/`
2. **Add TypeScript types** in `types/index.ts`
3. **Update database schema** if needed
4. **Add authentication middleware** if required
5. **Test the endpoint**

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License
