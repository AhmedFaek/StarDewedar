## Directory Structure

```
backend/
├── src/
│   ├── config/
│   │   └── env.js                 # Environment variables configuration
│   ├── middleware/
│   │   ├── auth.middleware.js     # JWT authentication middleware
│   │   ├── roles.middleware.js    # Role-based authorization middleware
│   │   └── validation.middleware.js # Request body validation middleware
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.js     # Route definitions for auth endpoints
│   │   │   ├── auth.controller.js # Request handlers and HTTP logic
│   │   │   ├── auth.service.js    # Business logic for authentication
│   │   │   └── auth.validation.js # Zod schemas for input validation
│   │   └── users/
│   │       └── user.repository.js # Database operations for users
│   ├── utils/
│   │   ├── constants.js           # Application constants (roles, etc.)
│   │   └── prisma.js              # Prisma Client instance
│   ├── app.js                      # Express app configuration
│   └── server.js                   # Server entry point
├── prisma/
│   ├── schema.prisma               # Prisma data model
│   └── migrations/                 # Database migration files
├── .env                            # Environment variables (local)
├── .env.example                    # Environment variables template
├── package.json                    # Dependencies and scripts
├── prisma.config.js                # Prisma configuration
└── README.md                       # Project documentation
```


