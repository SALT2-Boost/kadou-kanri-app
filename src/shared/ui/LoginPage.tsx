import { Box, Button, Paper, Typography, Stack } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { signInWithGoogle } from '../lib/auth';

export default function LoginPage() {
  const handleLogin = () => {
    void signInWithGoogle();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#FAFAFA',
      }}
    >
      <Paper sx={{ p: 6, maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <Stack spacing={3}>
          <Typography variant="h5" fontWeight={600}>
            稼働管理
          </Typography>
          <Typography variant="body2" color="text.secondary">
            boostconsulting.co.jp のアカウントでログインしてください
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleLogin}
            sx={{ textTransform: 'none' }}
          >
            Google でログイン
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
