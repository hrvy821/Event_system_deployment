# Event System Deployment

Full-stack event organizer system.

## Local Development

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:3000

## Deployment

- Deploy `backend` as the API service.
- Deploy `frontend` as the Vite React app.
- Set backend `MONGODB_URI` and `MONGODB_DB=event_db`.
- Set frontend `VITE_API_URL` to the deployed backend URL.
