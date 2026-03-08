import { Typography } from '@mui/material';

interface UtilizationSummaryProps {
  confirmedPercentage: number;
  totalPercentage: number;
}

export default function UtilizationSummary({
  confirmedPercentage,
  totalPercentage,
}: UtilizationSummaryProps) {
  if (totalPercentage <= 0) {
    return null;
  }

  if (confirmedPercentage === totalPercentage) {
    return (
      <Typography
        component="span"
        variant="body2"
        fontWeight={confirmedPercentage >= 100 ? 700 : 400}
      >
        {totalPercentage}%
      </Typography>
    );
  }

  return (
    <>
      <Typography
        component="span"
        variant="body2"
        fontWeight={confirmedPercentage >= 100 ? 700 : 400}
      >
        {confirmedPercentage}%
      </Typography>
      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
        ({totalPercentage}%)
      </Typography>
    </>
  );
}
