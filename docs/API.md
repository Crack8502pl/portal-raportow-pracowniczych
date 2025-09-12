# Portal Raportów Pracowniczych - API Documentation

## Overview
This document describes the REST API endpoints for the Portal Raportów Pracowniczych.

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints (except login) require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout  
- `POST /auth/refresh` - Refresh JWT token

### Reports
- `GET /reports` - Get all reports (paginated)
- `POST /reports` - Create new report
- `GET /reports/:id` - Get specific report
- `PUT /reports/:id` - Update report
- `DELETE /reports/:id` - Delete report
- `GET /reports/:id/export` - Export report to Excel

### Users
- `GET /users` - Get all users (admin only)
- `POST /users` - Create new user (admin only)
- `GET /users/:id` - Get specific user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user (admin only)

### Admin
- `GET /admin/stats` - Get system statistics
- `GET /admin/logs` - Get activity logs
- `POST /admin/settings` - Update system settings

## Response Format
All responses follow this format:
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

## Error Format
```json
{
  "success": false,
  "error": "Error message",
  "code": 400
}
```