# restApiTool

Simple REST API example built with Express.

## Setup

```bash
npm install
```

## Run

```bash
npm start
```

Server starts on `http://localhost:3000`.

## Available endpoints

- `GET /` - API welcome + endpoint list
- `GET /api/health` - health check
- `GET /api/tools` - list tools
- `GET /api/tools/:id` - fetch one tool by id

## Why you were seeing "not found"

If every request was returning not found, either:

1. The route path did not match what you requested, or
2. No routes were registered before the 404 handler.

This project now has explicit route registration and a fallback 404 handler so only unknown routes return not found.
