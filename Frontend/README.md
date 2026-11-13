# TrackMe – Personal Job Application Tracker

TrackMe is a full-stack web application designed to help students and job seekers efficiently manage and track their job applications in one place.

Instead of maintaining multiple spreadsheets or manually remembering application details, TrackMe provides a centralized dashboard where users can organize applications, monitor their progress, and keep track of important job opportunities.

##  Key Features

- **User Authentication:** Secure registration and login functionality using JWT and password hashing with bcrypt.
- **Personalized Dashboard:** Manage job applications through an individual user account.
- **Application Management:** Add and maintain job application details, including:
  - Company name
  - Job position
  - Career page URL
  - Application URL
  - Application date
  - Application status
- **Status Tracking:** Monitor the progress of applications through statuses such as:
  - Applied
  - In Progress
  - Rejected
- **Database Integration:** Store user and application information in a MySQL database.
- **Organized Tracking:** Keep application details and dates accessible from one place.

##  Tech Stack

| Technology | Purpose |
|---|---|
| React.js | Frontend development |
| Node.js | Backend runtime |
| Express.js | REST API development |
| MySQL | Relational database |
| JWT | Authentication |
| bcrypt.js | Password hashing |
| mysql2 | MySQL database connectivity |

##  Project Structure

```text
TrackMe/
│
├── frontend/          # React.js application
│
├── backend/           # Node.js and Express.js server
│   ├── config/        # Database configuration
│   ├── routes/        # API routes
│   ├── controllers/   # Request handling
│   └── middleware/   # Authentication middleware
│
└── README.md
```

*The folder structure may vary depending on the final implementation.*

##  Getting Started

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd TrackMe
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=trackme
DB_PORT=3306

JWT_SECRET=your_secret_key
```

Start the backend server:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Database Setup

Create a MySQL database:

```sql
CREATE DATABASE trackme;
```

Configure the required tables and database credentials before starting the application.

##  Project Objective

The primary goal of TrackMe is to simplify the job application process by providing a structured and user-friendly platform for managing applications, tracking progress, and staying organized throughout the job search journey.

 Future Enhancements

- Telegram notifications for new applications and status updates.
- Application analytics and visual progress reports.
- Search, filter, and sort applications.
- Interview scheduling and reminders.
- Calendar-based application tracking.

---

