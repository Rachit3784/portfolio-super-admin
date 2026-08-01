// D:\Portfolio\rachit-super-admin-portfolio\src\socket.js
import { io } from 'socket.io-client';

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.NEXT_PUBLIC_SERVER_URL ||
  'http://localhost:5000';

export const socket = io(SERVER_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
