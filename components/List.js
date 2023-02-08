import React from "react";
import {
  Web3Button,
  Web3NetworkSwitch,
  useWeb3ModalNetwork,
} from "@web3modal/react";
import { useAccount, useSigner, useContract, useSignTypedData } from "wagmi";
import dynamic from "next/dynamic";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import { getChainId, isWalletConnected } from "../lib/util";
import promptNFTABI from "../contracts/promptNFT.json";
import rentmarketABI from "../contracts/rentMarket.json";
import ListImage from "./ListImage";
import ListNft from "./ListNft";
import ListOwn from "./ListOwn";
import ListRent from "./ListRent";

const MessageSnackbar = dynamic(() => import("./MessageSnackbar"), {
  ssr: false,
});

function List({ mode }) {
  // console.log("call List()");
  // console.log("mode: ", mode);

  //*---------------------------------------------------------------------------
  //* Define constant variables.
  //*---------------------------------------------------------------------------
  const PLACEHOLDER_IMAGE_URL = process.env.NEXT_PUBLIC_PLACEHOLDER_IMAGE_URL;

  const CARD_MARGIN_TOP = "50px";
  const CARD_MAX_WIDTH = 420;
  const CARD_MIN_WIDTH = 375;
  const CARD_PADDING = 1;

  //*---------------------------------------------------------------------------
  //* Define hook variables.
  //*---------------------------------------------------------------------------
  const { selectedChain, setSelectedChain } = useWeb3ModalNetwork();
  // console.log("selectedChain: ", selectedChain);
  const { address, isConnected } = useAccount();
  // console.log("address: ", address);
  // console.log("isConnected: ", isConnected);
  const {
    data: dataSigner,
    isError: isErrorSigner,
    isLoading: isLoadingSigner,
  } = useSigner();
  // console.log("dataSigner: ", dataSigner);
  // console.log("isError: ", isError);
  // console.log("isLoading: ", isLoading);
  const promptNftContract = useContract({
    address: process.env.NEXT_PUBLIC_PROMPT_NFT_CONTRACT_ADDRESS,
    abi: promptNFTABI["abi"],
  });
  // console.log("promptNftContract: ", promptNftContract);
  const rentMarketContract = useContract({
    address: process.env.NEXT_PUBLIC_RENT_MARKET_CONTRACT_ADDRESS,
    abi: rentmarketABI["abi"],
  });
  // console.log("rentMarketContract: ", rentMarketContract);

  //*---------------------------------------------------------------------------
  //* Define signature data.
  //*---------------------------------------------------------------------------
  const domain = {
    chainId: getChainId({
      chainName: process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK,
    }),
    name: "Realbits",
  };

  const types = {
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "chainId", type: "uint256" },
    ],
    //* Refer to PrimaryType
    Login: [{ name: "contents", type: "string" }],
  };

  const value = {
    contents: process.env.NEXT_PUBLIC_LOGIN_SIGN_MESSAGE,
  };

  const {
    data: dataSignTypedData,
    isError: isErrorSignTypedData,
    isLoading: isLoadingSignTypedData,
    isSuccess: isSuccessSignTypedData,
    signTypedData,
    signTypedDataAsync,
  } = useSignTypedData({
    domain: domain,
    types: types,
    value: value,
  });
  // console.log("dataSignTypedData: ", dataSignTypedData);
  // console.log("isErrorSignTypedData: ", isErrorSignTypedData);
  // console.log("isLoadingSignTypedData: ", isLoadingSignTypedData);
  // console.log("isSuccessSignTypedData: ", isSuccessSignTypedData);
  // console.log("signTypedData: ", signTypedData);

  const theme = useTheme();

  //*---------------------------------------------------------------------------
  //* Handle snackbar.
  //*---------------------------------------------------------------------------
  const [snackbarMessage, setSnackbarMessage] = React.useState("");
  const [openSnackbar, setOpenSnackbar] = React.useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = React.useState("info");
  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };

  //*---------------------------------------------------------------------------
  //* Define state variables.
  //*---------------------------------------------------------------------------
  const [decryptedPrompt, setDecryptedPrompt] = React.useState("");
  const [openDialog, setOpenDialog] = React.useState(false);

  function NoLoginPage() {
    // console.log("theme: ", theme);
    return (
      <Box
        sx={{
          "& .MuiTextField-root": { m: 1, width: "25ch" },
        }}
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Card sx={{ minWidth: CARD_MIN_WIDTH, maxWidth: CARD_MAX_WIDTH }}>
          <CardMedia component="img" image={PLACEHOLDER_IMAGE_URL} />
          <Grid
            container
            justifyContent="space-around"
            marginTop={3}
            marginBottom={1}
          >
            <Grid item>
              <Web3Button />
            </Grid>
            <Grid item>
              <Web3NetworkSwitch />
            </Grid>
          </Grid>
          <CardContent
            sx={{
              padding: "10",
            }}
          >
            <Typography variant="h7" color={theme.palette.text.primary}>
              Click Connect Wallet button above.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <div>
      <Box
        sx={{
          "& .MuiTextField-root": { m: 1, width: "25ch" },
        }}
        display="flex"
        justifyContent="center"
        alignItems="center"
        flexDirection="column"
      >
        {mode === "image" ? (
          <div>
            <ListImage
              selectedChain={selectedChain}
              address={address}
              isConnected={isConnected}
              dataSigner={dataSigner}
              promptNftContract={promptNftContract}
              rentMarketContract={rentMarketContract}
            />
          </div>
        ) : mode === "nft" ? (
          <div>
            {isWalletConnected({ isConnected, selectedChain }) === false ? (
              <NoLoginPage />
            ) : (
              <ListNft
                selectedChain={selectedChain}
                address={address}
                isConnected={isConnected}
                dataSigner={dataSigner}
                promptNftContract={promptNftContract}
                rentMarketContract={rentMarketContract}
              />
            )}
          </div>
        ) : mode === "own" ? (
          <div>
            {isWalletConnected({ isConnected, selectedChain }) === false ? (
              <NoLoginPage />
            ) : (
              <ListOwn
                selectedChain={selectedChain}
                address={address}
                isConnected={isConnected}
                dataSigner={dataSigner}
                promptNftContract={promptNftContract}
                rentMarketContract={rentMarketContract}
              />
            )}
          </div>
        ) : mode === "rent" ? (
          <div>
            {isWalletConnected({ isConnected, selectedChain }) === false ? (
              <NoLoginPage />
            ) : (
              <ListRent
                selectedChain={selectedChain}
                address={address}
                isConnected={isConnected}
                dataSigner={dataSigner}
                promptNftContract={promptNftContract}
                rentMarketContract={rentMarketContract}
              />
            )}
          </div>
        ) : null}

        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">Prompt</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {decryptedPrompt}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} autoFocus>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      <MessageSnackbar
        open={openSnackbar}
        autoHideDuration={10000}
        onClose={handleCloseSnackbar}
        severity={snackbarSeverity}
        message={snackbarMessage}
      />
    </div>
  );
}

export default List;
