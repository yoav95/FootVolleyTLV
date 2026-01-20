# FootVolleyTLV

A React application built with Vite and Firebase/Firestore.

## Project Structure

```
src/
├── components/     # React components
├── hooks/         # Custom React hooks
├── firebase/      # Firebase configuration and services
├── assets/        # Static assets
├── App.jsx        # Main App component
└── main.jsx       # Application entry point
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure Firebase:
   - Copy `.env.example` to `.env`
   - Add your Firebase configuration values to `.env`
   - Update `src/firebase/config.js` with your Firebase settings

3. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Technologies

- React 19
- Vite 7
- Firebase & Firestore
- ESLint
