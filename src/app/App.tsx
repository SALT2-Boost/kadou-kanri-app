import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import AppRouter from './router';
import { useAuth } from '@/shared/hooks/useAuth';
import { UnsavedChangesProvider } from '@/shared/hooks/useUnsavedChanges';
import LoginPage from '@/shared/ui/LoginPage';
import LoadingOverlay from '@/shared/ui/LoadingOverlay';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingOverlay />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <BrowserRouter>
      <UnsavedChangesProvider>
        <AppRouter />
      </UnsavedChangesProvider>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthGate />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
