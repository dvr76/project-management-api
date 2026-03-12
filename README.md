# Project Management API

A simple, multi-tenant project management api built as a technical assessment.

## Prerequisites

- **Docker** & **Docker Compose**

For local development without Docker:

- Node.js ≥ 20
- PostgreSQL 17

## Quick Start (Docker — Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/dvr76/project-management-api.git
cd project-management-api
```

```bash
# 2. Create environment file
cp .env.example .env
```

```bash
# 3. Start everything
docker compose up --build -d
```

Server runs at http://localhost:3000.

## Demo UI

A simple React frontend is served directly from the API for demo purposes:

URL: http://localhost:3000

## Testing with Postman

1. Import postman/Project_Management_API.postman_collection.json into Postman
2. The collection is designed to run top-to-bottom as a full flow
3. Cookies auto-persist in Postman (no manual token management needed)
4. Collection variables (projectId, inviteId, inviteToken) are set automatically by test scripts

### API Tech Stack

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)
![Pino](https://img.shields.io/badge/Pino-FFD000?style=for-the-badge&logo=pino&logoColor=black)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![Supertest](https://img.shields.io/badge/Supertest-000000?style=for-the-badge)

### Demo UI Tech Stack

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000000?style=for-the-badge)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)
![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white)
