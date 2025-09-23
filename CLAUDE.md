# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (React + TypeScript)
- `npm start` - Start development server
- `npm run build` - Create production build
- `npm test` - Run test suite
- `npm run lint` - Check code quality with ESLint
- `npm run lint:fix` - Auto-fix linting issues

### Backend (Node.js + Express + TypeScript)
- `npm run dev` - Start development server with auto-reload (nodemon)
- `npm start` - Start production server
- `npm run build` - Compile TypeScript to JavaScript
- `npm test` - Run tests with database reset
- `npm run db:migrate` - Run database migrations
- `npm run db:reset` - Reset database to clean state

## Technology Stack

This project follows the developer's established patterns:

### Frontend Architecture
- **Framework**: React 18+ with TypeScript
- **UI Library**: Material-UI (@mui/material)
- **State Management**: React Redux
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **Build Tool**: Create React App with custom configuration

### Backend Architecture
- **Runtime**: Node.js 18+ with Express.js
- **Language**: TypeScript with strict configuration
- **Database**: PostgreSQL with Knex.js query builder
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcrypt, helmet, hpp, cors
- **Logging**: Pino with pretty printing
- **Validation**: class-validator, class-transformer

### Mobile Architecture (if applicable)
- **Framework**: React Native with Expo
- **Navigation**: React Navigation v6
- **UI Components**: React Native Paper
- **Maps**: React Native Maps
- **Development**: Expo Dev Client

## Project Structure

### Frontend Projects
```
src/
├── components/     # Reusable UI components
├── api/           # API integration layer
├── helpers/       # Utility functions and helpers
├── screens/       # Main application screens/pages
└── App.tsx        # Root application component
```

### Backend Projects
```
src/
├── controllers/   # Route handlers and business logic
├── middleware/    # Custom Express middleware
├── models/        # Database models and schemas
├── routes/        # API route definitions
├── utils/         # Utility functions
└── server.ts      # Application entry point
```

## Code Quality Standards

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Airbnb configuration with TypeScript support
- **Prettier**: Consistent code formatting
- **Husky**: Git hooks for pre-commit validation
- **Path Aliases**: Use `@/*` for clean imports from src directory

## Development Patterns

### Component Architecture
- Functional components with React hooks
- TypeScript interfaces for all props and state
- Material-UI for consistent design system
- Responsive design principles

### API Integration
- Axios for HTTP requests with interceptors
- Centralized API configuration in `/api` directory
- Error handling with user-friendly messages
- Request/response TypeScript interfaces

### Database Management
- Migration-based schema management with Knex.js
- Separate development, testing, and production databases
- Transaction support for data integrity
- Connection pooling for performance

### Authentication & Security
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- API rate limiting and security headers

## Testing Strategy

- **Frontend**: Jest + React Testing Library
- **Backend**: Jest with supertest for API testing
- **Database**: Test database reset between test suites
- **Coverage**: Aim for comprehensive test coverage

## Docker Support

Backend projects include Docker configuration:
- `docker-compose.yml` for development environment
- Separate containers for application and database
- Volume mounting for development hot-reload

## Environment Configuration

- `.env` files for environment-specific configuration
- Separate configurations for development, testing, production
- Database connection strings and JWT secrets via environment variables