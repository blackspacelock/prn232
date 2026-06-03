import { createRoot } from 'react-dom/client'
import { ApolloProvider } from '@apollo/client/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './app/App.tsx'
import { apolloClient } from './lib/apollo'
import { queryClient } from './lib/queryClient'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
    <ApolloProvider client={apolloClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ApolloProvider>
  </GoogleOAuthProvider>
)
