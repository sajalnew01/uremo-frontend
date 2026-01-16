/*
  Socket smoke test for Order Support Chat.
  Usage (from uremo-frontend): node scripts/socket-smoke.js

  This is a developer utility and is not used by the app at runtime.
*/

const { io } = require("socket.io-client");

async function main() {
  const base =
    process.env.SOCKET_BASE_URL || "https://uremo-backend.onrender.com";
  const email = process.env.SMOKE_EMAIL || "final@uremo.online";
  const password = process.env.SMOKE_PASSWORD || "test1234";
  const orderId = process.env.SMOKE_ORDER_ID;

  if (!orderId) {
    console.error("Missing SMOKE_ORDER_ID env var");
    process.exit(1);
  }

  const loginRes = await fetch(base + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const login = await loginRes.json();
  const token = login?.token;
  if (!token) {
    console.error("Login failed", loginRes.status, login);
    process.exit(1);
  }

  const socket = io(base, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    withCredentials: true,
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  });

  let connectCount = 0;
  let disconnectCount = 0;

  socket.on("connect", () => {
    connectCount += 1;
    console.log("[smoke] connect", connectCount, socket.id);

    socket.emit("join:order", { orderId }, (ack) => {
      console.log("[smoke] join ack", ack);

      socket.emit(
        "message:send",
        {
          orderId,
          tempId: `temp-smoke-${Date.now()}`,
          text: "socket smoke test",
        },
        (ack2) => {
          console.log("[smoke] send ack", ack2);
        }
      );
    });
  });

  socket.on("messages:history", (d) =>
    console.log("[smoke] history", (d?.messages || []).length)
  );
  socket.on("message:new", (m) =>
    console.log("[smoke] message:new", m?._id, m?.tempId)
  );
  socket.on("disconnect", (r) => {
    disconnectCount += 1;
    console.log("[smoke] disconnect", disconnectCount, r);
  });
  socket.on("connect_error", (e) =>
    console.log("[smoke] connect_error", e?.message || e)
  );

  setTimeout(() => {
    console.log("[smoke] closing");
    socket.close();

    setTimeout(() => {
      console.log("[smoke] done", { connectCount, disconnectCount });
      process.exit(0);
    }, 250);
  }, 15000);
}

main().catch((err) => {
  console.error("[smoke] fatal", err?.message || err);
  process.exit(1);
});
