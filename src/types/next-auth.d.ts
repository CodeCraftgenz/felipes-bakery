import type { DefaultSession, DefaultJWT } from 'next-auth'

// Extensão dos tipos padrão do NextAuth para incluir role e adminUser
declare module 'next-auth' {
  interface Session {
    user: {
      id:        string
      role:      string
      adminUser: boolean
    } & DefaultSession['user']
  }

  interface User {
    role?:      string
    adminUser?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?:        string
    role?:      string
    adminUser?: boolean
  }
}
