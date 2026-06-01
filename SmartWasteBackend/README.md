# SmartWaste Backend API

Node.js + Express + MongoDB backend for the SmartWaste Management System.

## Features

- ✅ User authentication (register/login with JWT)
- ✅ Role-based access control (user, admin, worker)
- ✅ Waste report management (CRUD)
- ✅ Bin tracking and management
- ✅ Worker task assignment
- ✅ Eco-points system
- ✅ Geolocation support
- ✅ Protected routes with middleware

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **CORS**: Enabled for frontend integration

## Prerequisites

- Node.js >= 16
- MongoDB (local or cloud instance)
- npm or yarn

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Edit `.env`:
```
MONGODB_URI=mongodb://localhost:27017/smartwaste
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_this
FRONTEND_URL=http://localhost:5173
```

### 3. Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**Or use MongoDB Atlas (cloud):**
Update `MONGODB_URI` in `.env` with your connection string.

### 4. Run Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server runs on `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Reports

- `GET /api/reports` - Get all reports (with filters)
- `GET /api/reports/:id` - Get single report
- `POST /api/reports` - Create report (protected)
- `PATCH /api/reports/:id` - Update report status (protected)
- `DELETE /api/reports/:id` - Delete report (admin only)

### Bins

- `GET /api/bins` - Get all bins
- `GET /api/bins/:id` - Get single bin
- `POST /api/bins` - Create bin (admin only)
- `PATCH /api/bins/:id` - Update bin fill level (admin/worker)
- `DELETE /api/bins/:id` - Delete bin (admin only)

### Workers

- `GET /api/workers` - Get all workers (admin only)
- `GET /api/workers/:id` - Get worker details with tasks
- `POST /api/workers/:workerId/assign/:reportId` - Assign task (admin only)
- `POST /api/workers/:workerId/unassign/:reportId` - Unassign task (admin only)

### Users

- `GET /api/users/me` - Get current user profile (protected)
- `GET /api/users/:id` - Get user by ID (protected)
- `PATCH /api/users` - Update own profile (protected)
- `POST /api/users/:id/add-points` - Add points to user (protected)

### Health Check

- `GET /api/health` - Server health status

## Authentication

All protected routes require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are returned on login/register and valid for 7 days.

## Data Models

### User
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "user" | "admin" | "worker",
  points: Number,
  assignedTasks: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

### Report
```javascript
{
  _id: ObjectId,
  location: String,
  type: "wet" | "dry" | "hazardous",
  status: "pending" | "assigned" | "completed",
  reporter: ObjectId (User),
  assignedTo: ObjectId (User),
  description: String,
  photo: String (URL),
  coords: { lat: Number, lng: Number },
  createdAt: Date,
  completedAt: Date,
  updatedAt: Date
}
```

### Bin
```javascript
{
  _id: ObjectId,
  name: String,
  fill: Number (0-100),
  type: "wet" | "dry" | "hazardous",
  coords: { lat: Number, lng: Number },
  location: String,
  lastEmptied: Date,
  capacity: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Example Requests

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "secure123",
    "role": "user"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "secure123"
  }'
```

### Create Report
```bash
curl -X POST http://localhost:5000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "location": "MG Road, Block A",
    "type": "wet",
    "description": "Overflowing bin near bus stop",
    "coords": { "lat": 12.97, "lng": 77.59 }
  }'
```

### Get Reports
```bash
curl http://localhost:5000/api/reports?status=pending&type=wet
```

## Connecting Frontend

In your React frontend (Vite), update API calls:

1. Create an API client file:

```javascript
// src/api/client.ts
export const API_BASE_URL = 'http://localhost:5000/api';

export async function apiCall(endpoint: string, options?: RequestInit) {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
```

2. Update AuthContext to use backend:

```typescript
// Replace mock login with API call
const login = async (credentials) => {
  const data = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  
  localStorage.setItem('token', data.token);
  setUser(data.user);
};
```

## Folder Structure

```
backend/
├── models/           # Mongoose schemas
│   ├── User.js
│   ├── Report.js
│   └── Bin.js
├── routes/           # API route handlers
│   ├── auth.js
│   ├── reports.js
│   ├── bins.js
│   ├── workers.js
│   └── users.js
├── middleware/       # Express middleware
│   └── auth.js       # JWT authentication
├── server.js         # Main entry point
├── .env              # Environment variables
├── .env.example      # Example environment
├── package.json
└── README.md
```

## Error Handling

All errors return JSON with status code and error message:

```json
{
  "error": "Invalid credentials"
}
```

## Security Notes

1. **JWT Secret**: Change `JWT_SECRET` in production to a strong random string
2. **CORS**: Currently allows any origin. Restrict to frontend URL in production
3. **Password**: Always hashed with bcryptjs before storage
4. **HTTPS**: Use HTTPS in production
5. **Rate Limiting**: Consider adding rate limiting middleware for production

## Future Enhancements

- [ ] File upload for report photos
- [ ] Email verification
- [ ] Two-factor authentication
- [ ] Real-time updates with WebSockets
- [ ] Advanced geospatial queries
- [ ] API rate limiting
- [ ] Logging and monitoring
- [ ] Automated testing

## Support

For issues or questions, check the frontend integration guide in the main README.

## License

MIT
