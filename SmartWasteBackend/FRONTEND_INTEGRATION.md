# Frontend-Backend Integration Guide

This guide shows how to connect your React frontend to the SmartWaste backend API.

## Quick Start

### 1. Install Backend & Start Server

```bash
cd ../SmartWasteBackend
npm install
npm run dev
```

Server will run on `http://localhost:5000`

### 2. Create API Client

Create `src/api/client.ts` in your React app:

```typescript
const API_BASE_URL = 'http://localhost:5000/api';

export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
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
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  return response.json() as Promise<T>;
}
```

### 3. Update AuthContext

Replace mock authentication in `src/context/AuthContext.tsx`:

```typescript
import { apiCall } from '@/api/client';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      localStorage.setItem('token', response.token);
      setUser(response.user);
      return response.user;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }) => {
    try {
      setIsLoading(true);
      const response = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      localStorage.setItem('token', response.token);
      setUser(response.user);
      return response.user;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addPoints = async (points: number) => {
    if (!user) return;
    try {
      const response = await apiCall(`/users/${user.id}/add-points`, {
        method: 'POST',
        body: JSON.stringify({ points }),
      });
      setUser(prev => prev ? { ...prev, points: response.points } : null);
    } catch (error) {
      console.error('Error adding points:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, addPoints, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 4. Fetch Reports

In `UserDashboard.tsx`:

```typescript
import { apiCall } from '@/api/client';

async function loadReports() {
  try {
    const data = await apiCall('/reports?status=pending');
    setReports(data);
  } catch (error) {
    toast.error('Failed to load reports');
  }
}

// Call in useEffect
useEffect(() => {
  loadReports();
}, []);
```

### 5. Create Report with Backend

```typescript
const submit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!location) return toast.error("Please add a location");
  
  try {
    setLoading(true);
    const reportData = {
      location,
      type,
      description: desc,
      coords: { lat: 12.97, lng: 77.59 }, // From geolocation
      photo: file ? await uploadPhoto(file) : undefined,
    };
    
    const response = await apiCall('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
    
    addPoints(20); // Award points
    toast.success("Report submitted! +20 Eco-Points earned.");
    setLocation("");
    setDesc("");
    setFile(null);
  } catch (error) {
    toast.error('Failed to submit report');
  } finally {
    setLoading(false);
  }
};
```

### 6. Fetch Bins

```typescript
async function loadBins() {
  try {
    const data = await apiCall('/bins');
    setBins(data);
  } catch (error) {
    console.error('Failed to load bins:', error);
  }
}
```

## Database Models Mapping

### Frontend Type → Backend API Response

**User:**
```typescript
// Frontend sends:
{ name, email, role, points }

// Backend returns (after login):
{
  id: ObjectId,
  name: string,
  email: string,
  role: "user" | "admin" | "worker",
  points: number
}
```

**Report:**
```typescript
// Frontend sends to POST /api/reports:
{
  location: string,
  type: "wet" | "dry" | "hazardous",
  description?: string,
  coords: { lat: number, lng: number },
  photo?: string (URL)
}

// Backend returns:
{
  _id: string,
  location: string,
  type: string,
  status: "pending" | "assigned" | "completed",
  reporter: { _id, name, email },
  assignedTo?: { _id, name, email },
  description?: string,
  photo?: string,
  coords: { lat, lng },
  createdAt: string,
  completedAt?: string
}
```

**Bin:**
```typescript
{
  _id: string,
  name: string,
  fill: number (0-100),
  type: "wet" | "dry" | "hazardous",
  coords: { lat: number, lng: number },
  location: string,
  lastEmptied?: string (ISO date),
  capacity: number,
  createdAt: string
}
```

## API Endpoints Quick Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | No | Login user |
| POST | `/auth/register` | No | Register user |
| GET | `/reports` | No | Get all reports |
| GET | `/reports/:id` | No | Get report details |
| POST | `/reports` | Yes | Create report |
| PATCH | `/reports/:id` | Yes | Update report |
| DELETE | `/reports/:id` | Yes (Admin) | Delete report |
| GET | `/bins` | No | Get all bins |
| GET | `/bins/:id` | No | Get bin details |
| PATCH | `/bins/:id` | Yes (Admin/Worker) | Update bin |
| GET | `/users/me` | Yes | Get current user |
| GET | `/users/:id` | Yes | Get user profile |
| PATCH | `/users` | Yes | Update profile |
| POST | `/users/:id/add-points` | Yes | Add eco-points |
| GET | `/workers` | Yes (Admin) | List workers |
| GET | `/workers/:id` | Yes | Get worker details |
| POST | `/workers/:id/assign/:reportId` | Yes (Admin) | Assign task |

## Error Handling

Wrap API calls in try-catch:

```typescript
try {
  const data = await apiCall('/reports');
} catch (error) {
  if (error instanceof Error) {
    toast.error(error.message);
  }
}
```

## CORS Configuration

The backend allows requests from `http://localhost:5173` by default.

For production, update `server.js`:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

## Environment Setup

Add to `.env` in your React project (optional, if you want env-based API URL):

```
VITE_API_BASE_URL=http://localhost:5000/api
```

Then update client.ts:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
```

## Testing with Seed Data

Run the seed script to populate test data:

```bash
cd SmartWasteBackend
npm run seed  # or: node seed.js
```

Then login with:
- **Admin**: admin@example.com / admin123
- **User**: anita@example.com / user123
- **Worker**: ravi@example.com / worker123

## Troubleshooting

### CORS Error
- Ensure backend is running on port 5000
- Check `FRONTEND_URL` in backend `.env`

### 401 Unauthorized
- Token not being sent in headers
- Token expired (7 day validity)
- Invalid token format

### 404 Not Found
- Check endpoint spelling
- Verify backend routes are loaded
- Check `app.use()` mounting in server.js

### MongoDB Connection Error
- Ensure MongoDB is running locally or connection string is correct
- Check `MONGODB_URI` in `.env`

## Next Steps

1. ✅ Set up backend
2. ✅ Create API client
3. ✅ Update AuthContext
4. ✅ Integrate report creation
5. ✅ Add real data fetching
6. 📋 Deploy backend (Heroku, Railway, etc.)
7. 📋 Set up production database
8. 📋 Add file upload for photos
9. 📋 Implement real-time updates

For detailed API docs, see the backend [README.md](../SmartWasteBackend/README.md).
