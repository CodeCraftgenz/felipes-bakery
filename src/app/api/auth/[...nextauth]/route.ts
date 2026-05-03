import { handlers } from '@backend/lib/auth'

// Route handler padrão do NextAuth v5
// Responde GET e POST em /api/auth/*
export const { GET, POST } = handlers
