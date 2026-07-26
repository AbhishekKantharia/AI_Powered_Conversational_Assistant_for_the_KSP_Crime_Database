import { Server as SocketServer } from 'socket.io'
import jwt from 'jsonwebtoken'
import { logger } from './logger'

export function setupSocketHandlers(io: SocketServer): void {
  // Auth middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('Authentication required'))

    try {
      const secret = process.env.JWT_ACCESS_SECRET!
      const decoded = jwt.verify(token, secret)
      socket.data.user = decoded
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.data.user?.userId
    logger.info(`Socket connected: ${socket.id} (user: ${userId})`)

    // Join user-specific room
    if (userId) socket.join(`user:${userId}`)

    // Join role-based rooms
    const role = socket.data.user?.role
    if (role) socket.join(`role:${role}`)

    socket.on('join:case', (caseId: string) => {
      socket.join(`case:${caseId}`)
      logger.debug(`User ${userId} joined case room: ${caseId}`)
    })

    socket.on('leave:case', (caseId: string) => {
      socket.leave(`case:${caseId}`)
    })

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`)
    })
  })
}

// Emit helpers
export function emitToUser(io: SocketServer, userId: string, event: string, data: unknown): void {
  io.to(`user:${userId}`).emit(event, data)
}

export function emitToCase(io: SocketServer, caseId: string, event: string, data: unknown): void {
  io.to(`case:${caseId}`).emit(event, data)
}

export function emitToRole(io: SocketServer, role: string, event: string, data: unknown): void {
  io.to(`role:${role}`).emit(event, data)
}
