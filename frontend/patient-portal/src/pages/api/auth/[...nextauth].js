import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { mcpApi } from '@/lib/api';

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        try {
          // Call the AuthLinc agent via MCP for authentication
          const response = await fetch(`${process.env.MCP_API_URL}/query`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.MCP_DEFAULT_TOKEN}`  // For initial auth
            },
            body: JSON.stringify({
              agent: 'AuthLinc',
              task: 'login',
              data: {
                username: credentials.username,
                password: credentials.password
              }
            })
          });
          
          const data = await response.json();
          
          if (data.status === 'success' && data.data?.token) {
            // Return the user object with token
            return {
              id: data.data.userId,
              name: data.data.name,
              email: data.data.email,
              token: data.data.token,
              role: data.data.role
            };
          }
          
          // Auth failed
          return null;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.accessToken = user.token;
        token.role = user.role;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken;
      session.user.role = token.role;
      session.user.id = token.userId;
      
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // 1 hour
  },
  secret: process.env.NEXTAUTH_SECRET,
});
