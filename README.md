# Driver Info Hub - Backend API

Backend API for Driver Info Hub, built with Next.js API Routes and designed for Vercel deployment.

## API Endpoints

### Root Endpoint
- **GET** `/api` - Returns API status and available endpoints

### Contact Form
- **POST** `/api/contact` - Submit contact form
  - Body: `{ name, email, subject, message }`

## Environment Variables

Required environment variables for deployment:

```env
SMTP_HOST=your-smtp-host
SMTP_PORT=465
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
CONTACT_TO=recipient-email@example.com
```

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with required variables

3. Run development server:
```bash
npm run dev
```

API will be available at `http://localhost:3000/api`

## Deployment to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard:
   - Go to Project Settings > Environment Variables
   - Add all required SMTP configuration variables

4. Your API will be available at: `https://your-project.vercel.app/api`

## Project Structure

```
├── src/
│   └── app/
│       ├── api/
│       │   ├── route.ts          # Root API endpoint
│       │   └── contact/
│       │       └── route.ts      # Contact form endpoint
│       ├── layout.tsx
│       └── page.tsx
├── .env
├── package.json
├── next.config.js
├── tsconfig.json
└── vercel.json
```

## Tech Stack

- **Framework**: Next.js 16
- **Runtime**: Node.js
- **Email**: Nodemailer
- **Deployment**: Vercel
- **Language**: TypeScript
