# Database Seeding Guide

This guide explains how to use the database seeding script to create admin users and roles in your Vendor Service application.

## Prerequisites

- MongoDB must be running and accessible
- Application environment variables must be properly configured
- Node.js dependencies must be installed (`npm install`)

## Available Commands

### 1. Create All Roles and Users
```bash
npm run seed all
```
Creates all default roles and admin users in one command.

### 2. Create Roles Only
```bash
npm run seed roles
```
Creates/updates the following roles with their respective permissions:
- **admin**: Full system access (35 permissions)
- **manager**: Management operations (20 permissions) 
- **user**: Read-only access (5 permissions)
- **finance**: Financial operations (8 permissions)
- **procurement**: Vendor and purchase order management (6 permissions)
- **sales**: Sales order management (5 permissions)

### 3. Create Default Admin Users
```bash
npm run seed users
```
Creates the following default users:
- **admin@company.com** (password: `Admin123!`) - Role: admin
- **manager@company.com** (password: `Manager123!`) - Role: manager

### 4. Create Custom User
```bash
npm run seed create-user <username> <password> <role1> [role2] [role3]
```

Examples:
```bash
# Create a user with single role
npm run seed create-user john.doe@company.com SecurePass123! user

# Create a user with multiple roles
npm run seed create-user finance.manager@company.com FinPass456! manager finance

# Create a procurement specialist
npm run seed create-user procurement@company.com ProcPass789! procurement user
```

### 5. List Users
```bash
npm run seed list-users
```
Displays all users in the database (passwords are hidden for security).

### 6. List Roles
```bash
npm run seed list-roles
```
Displays all roles and their permission counts.

## Security Features

- **Password Hashing**: All passwords are securely hashed using bcrypt with salt rounds of 10
- **Duplicate Prevention**: Script prevents creating duplicate users
- **Role Validation**: Validates that assigned roles exist before creating users
- **System Audit**: All seeded data is marked as created/updated by 'system'

## Role Permissions Matrix

| Role | Tenants | Vendors | Orders | Invoices | Users | System |
|------|---------|---------|---------|----------|-------|---------|
| **admin** | Full Access | Full Access | Full Access | Full Access | Full Access | Full Access |
| **manager** | Read/Config | Create/Read/Update | Create/Read/Update/Approve | Create/Read/Update/Pay | Read Only | None |
| **user** | Read Only | Read Only | Read Only | Read Only | None | None |
| **finance** | None | Read Only | Read Only | Full Access | None | None |
| **procurement** | None | Create/Read/Update | Purchase Orders Only | None | None | None |
| **sales** | None | Read Only | Sales Orders Only | None | None | None |

## Environment Setup

Ensure your application can connect to MongoDB. The script uses the same database connection as your main application.

## Troubleshooting

### Connection Issues
```
❌ Seeding failed: connect ECONNREFUSED
```
- Ensure MongoDB is running
- Check DATABASE_URL in your environment variables
- Verify network connectivity

### User Already Exists
```
❌ Seeding failed: User 'admin@company.com' already exists
```
- Use `npm run seed list-users` to see existing users
- Choose a different username or update existing user manually

### Role Not Found
```
❌ Seeding failed: Role 'invalid-role' does not exist
```
- Run `npm run seed roles` first to create all roles
- Use `npm run seed list-roles` to see available roles

## Production Usage

⚠️ **Security Warning**: Change default passwords immediately in production!

1. Run the seeding script:
```bash
npm run seed all
```

2. Change default passwords through the application UI or create new admin users with secure passwords:
```bash
npm run seed create-user admin.production@company.com VerySecurePassword123! admin
```

3. Disable or remove default admin accounts if desired.

## Script Location

The seeding script is located at: `src/scripts/seed-database.ts`

You can modify the default users, passwords, or roles by editing this file.