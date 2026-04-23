const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const tools = [
  {
    id: 1,
    name: "JSON Formatter",
    category: "developer",
    active: true,
  },
  {
    id: 2,
    name: "Image Resizer",
    category: "media",
    active: true,
  },
];

app.get("/", (_req, res) => {
  res.json({
    message: "REST API Tool is running",
    endpoints: ["/api/health", "/api/tools", "/api/tools/:id"],
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/tools", (_req, res) => {
  res.status(200).json(tools);
});

app.get("/api/tools/:id", (req, res) => {
  const toolId = Number(req.params.id);
  const tool = tools.find((item) => item.id === toolId);

  if (!tool) {
    return res.status(404).json({
      error: "Tool not found",
      message: `No tool found with id ${toolId}`,
    });
  }

  return res.status(200).json(tool);
});

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `No route matches ${req.method} ${req.originalUrl}`,
  });
});

app.listen(PORT, () => {
  console.log(`REST API Tool listening on port ${PORT}`);
});
