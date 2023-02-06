import React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";

function CardImage({ imageData }) {
  console.log("call CardImage()");

  //*---------------------------------------------------------------------------
  //* Define constant variables.
  //*---------------------------------------------------------------------------
  const PLACEHOLDER_IMAGE_URL = process.env.NEXT_PUBLIC_PLACEHOLDER_IMAGE_URL;
  const CARD_MARGIN_TOP = "50px";
  const CARD_MAX_WIDTH = 420;
  const CARD_MIN_WIDTH = 375;
  const CARD_PADDING = 1;

  function handleCardMediaImageError(e) {
    // console.log("call handleCardMediaImageError()");
    e.target.onerror = null;
    e.target.src = PLACEHOLDER_IMAGE_URL;
  }

  return (
    <Box sx={{ m: CARD_PADDING, marginTop: CARD_MARGIN_TOP }}>
      <Card sx={{ minWidth: CARD_MIN_WIDTH, maxWidth: CARD_MAX_WIDTH }}>
        <CardMedia
          component="img"
          image={imageData.imageUrl}
          onError={handleCardMediaImageError}
        />
        <CardContent>
          <Typography
            sx={{ fontSize: 14 }}
            color="text.secondary"
            gutterBottom
            component="div"
          >
            {imageData.prompt}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default CardImage;
