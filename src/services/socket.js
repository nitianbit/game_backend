import {Server} from "socket.io";
import { SOCKET_EVENTS } from "../utils/constants.js";
import http from 'http'


class SocketService {
    constructor() {
        this.io = null;
    }

    initialize = (server) => { 
        this.io = new Server(server, {
            pingInterval: 5000,
            pingTimeout: 3000,
            cors: {
                origin: "*",           // or ['http://localhost:19006', 'your-app-scheme://*']
                methods: ["GET", "POST"],
                allowedHeaders: ["Authorization", "Content-Type"],
                credentials: true,
              },
              path: "/socket.io",
        })
        
        this.io.on("connection", (socket) => {
            console.log(`⚡: ${socket.id} user just connected!`);
            console.info("New connection", { socketId: socket.id });
            this.setupSocketHandlers(socket, this.io);
        });
        this.io.on("connection_error", (error) => {
             console.error(error); 
        });
    }

    handleConnection = (socket, io) => {
        socket.on("socket", (name) => {
            // console.log("socket called");
                        console.log("socket", { name });
         });
    }

    setupSocketHandlers = (socket, io) => {
        //   socket.on(SOCKET_EVENTS.GAME_START)
    }

    emitSocket(event, data = {}) {
        try {
            if (!this.io) {
                throw new Error('Socket instance not initialized');
            }
            this.io.emit(event, data);
            console.log(`socket emitted for type: ${event}`);
            console.info("Emit socket event", { event, data });
        } catch (error) {
            console.log("error emitting socket", error);
            console.error("Socket emit error", { error: error.message, event, data });
        }
    }

}

const socketService = new SocketService()
export default socketService