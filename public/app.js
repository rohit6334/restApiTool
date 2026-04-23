const methodInput = document.querySelector("#method");
const urlInput = document.querySelector("#url");
const headersInput = document.querySelector("#headers");
const bodyInput = document.querySelector("#body");
const sendButton = document.querySelector("#send");
const clearButton = document.querySelector("#clear");
const metaBox = document.querySelector("#meta");
const responseBox = document.querySelector("#response");

function parseHeaders(headersText) {
  if (!headersText.trim()) {
    return {};
  }

  const parsed = JSON.parse(headersText);

  if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) {
    throw new Error("Headers must be a JSON object.");
  }

  return parsed;
}

function setLoading(isLoading) {
  sendButton.disabled = isLoading;
  sendButton.textContent = isLoading ? "Sending..." : "Send Request";
}

function renderMeta(text, className = "") {
  metaBox.className = `meta ${className}`.trim();
  metaBox.textContent = text;
}

function prettyPrint(text) {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch (_error) {
    return text;
  }
}

function getStatusClass(statusCode) {
  if (statusCode >= 200 && statusCode < 300) {
    return "status-ok";
  }

  if (statusCode >= 400) {
    return "status-error";
  }

  return "status-warn";
}

async function sendRequest() {
  setLoading(true);
  renderMeta("Sending request...");
  responseBox.textContent = "";

  let headers;
  try {
    headers = parseHeaders(headersInput.value);
  } catch (error) {
    setLoading(false);
    renderMeta(
      `Invalid headers JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
      "status-error",
    );
    return;
  }

  const payload = {
    method: methodInput.value.toUpperCase(),
    url: urlInput.value.trim(),
    headers,
    body: bodyInput.value,
  };

  if (!payload.url) {
    setLoading(false);
    renderMeta("Request URL is required.", "status-error");
    return;
  }

  try {
    const response = await fetch("/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok || result.error) {
      throw new Error(result.detail || result.error || "Request failed.");
    }

    renderMeta(
      `${result.status} ${result.statusText} in ${result.durationMs} ms`,
      getStatusClass(result.status),
    );

    const responseText = [`Headers:`, JSON.stringify(result.headers ?? {}, null, 2), "", "Body:", prettyPrint(result.body ?? "")]
      .join("\n");

    responseBox.textContent = responseText;
  } catch (error) {
    renderMeta(error instanceof Error ? error.message : "Unexpected request failure.", "status-error");
  } finally {
    setLoading(false);
  }
}

function clearResponse() {
  renderMeta("No request sent yet.");
  responseBox.textContent = "";
}

sendButton.addEventListener("click", sendRequest);
clearButton.addEventListener("click", clearResponse);

clearResponse();
