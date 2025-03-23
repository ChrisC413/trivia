import React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import QRCode from 'qrcode.react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface ShareLinkProps {
  gameUrl: string;
  onCopy: () => void;
}

const ShareLink: React.FC<ShareLinkProps> = ({ gameUrl, onCopy }) => {
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Share with Players:
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2,
          p: 2,
          bgcolor: 'grey.100',
          borderRadius: 1,
        }}
      >
        <Typography
          variant="body1"
          sx={{
            flexGrow: 1,
            fontFamily: 'monospace',
            wordBreak: 'break-all',
          }}
        >
          {gameUrl}
        </Typography>
        <Tooltip title="Copy link">
          <IconButton onClick={onCopy} size="small">
            <ContentCopyIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mb: 2,
          p: 2,
          bgcolor: 'grey.100',
          borderRadius: 1,
        }}
      >
        <QRCode
          value={gameUrl}
          size={200}
          level="H"
          includeMargin={true}
          style={{ background: 'white', padding: '1rem' }}
        />
      </Box>
    </Box>
  );
};

export default ShareLink;