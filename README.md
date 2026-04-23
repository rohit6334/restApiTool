# Local REST API Tester

Small standalone app for quickly testing REST APIs on your local machine.

## Run

From the repository root:

```bash
npm run rest-tester
```

Then open:

```
http://localhost:5055
```

## Features

- Choose HTTP method (GET/POST/PUT/PATCH/DELETE)
- Set full request URL
- Add headers as JSON object
- Send raw body payload
- View response status, duration, headers, and body

## Notes

- The UI sends requests through a local proxy endpoint (`/proxy`) to avoid browser CORS limitations.
- Default port is `5055`; override it with:

```bash
PORT=6060 npm run rest-tester
```
