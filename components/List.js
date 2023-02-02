import React from "react";
import {
  Web3Button,
  Web3NetworkSwitch,
  useWeb3ModalNetwork,
} from "@web3modal/react";
import { useAccount, useSigner, useContract } from "wagmi";
import { Buffer } from "buffer";
import { Base64 } from "js-base64";
import dynamic from "next/dynamic";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Pagination from "@mui/material/Pagination";
import useUser from "../lib/useUser";
import fetchJson from "../lib/fetchJson";
import { checkBlockchainNetwork, getChainName, getUniqueKey } from "./Util";
//* Copy abi file from rent-market repository.
import promptNFTABI from "../contracts/promptNFT.json";
import rentmarketABI from "../contracts/rentMarket.json";

const MessageSnackbar = dynamic(() => import("./MessageSnackbar"), {
  ssr: false,
});

function List({ mode }) {
  //*---------------------------------------------------------------------------
  //* Define constant or hook variables.
  //*---------------------------------------------------------------------------
  const { selectedChain, setSelectedChain } = useWeb3ModalNetwork();
  // console.log("selectedChain: ", selectedChain);
  const { address, isConnected } = useAccount();
  // console.log("address: ", address);
  // console.log("isConnected: ", isConnected);
  const { data: signer, isError, isLoading } = useSigner();
  // console.log("signer: ", signer);
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

  const { user } = useUser();
  // console.log("user: ", user);
  const theme = useTheme();

  const PLACEHOLDER_IMAGE_URL = process.env.NEXT_PUBLIC_PLACEHOLDER_IMAGE_URL;
  const API_ALL_URL = process.env.NEXT_PUBLIC_API_ALL_URL;
  const CARD_MAX_WIDTH = 420;
  const CARD_MIN_WIDTH = 375;
  const NUMBER_PER_PAGE = 1;
  const CARD_PADDING = 1;

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
  //* Other variables.
  //*---------------------------------------------------------------------------
  const [allImageDataCount, setAllImageDataCount] = React.useState(0);
  const [allImageDataArray, setAllImageDataArray] = React.useState([]);

  const [allNftDataCount, setAllNftDataCount] = React.useState(0);
  const [allNftDataArray, setAllNftDataArray] = React.useState([]);

  const [allRegisterDataCount, setAllRegisterDataCount] = React.useState(0);
  const [allRegisterDataArray, setAllRegisterDataArray] = React.useState([]);

  const [allMyRentDataCount, setAllMyRentDataCount] = React.useState(0);
  const [allMyRentDataArray, setAllMyRentDataArray] = React.useState([]);

  const [allMyOwnDataCount, setAllMyOwnDataCount] = React.useState(0);
  const [allMyOwnDataArray, setAllMyOwnDataArray] = React.useState([]);

  const [decryptedPrompt, setDecryptedPrompt] = React.useState("");

  //*---------------------------------------------------------------------------
  //* For pagination.
  //* Keep each page index per menu (image, nft, own, and rent).
  //*---------------------------------------------------------------------------
  const [pageIndex, setPageIndex] = React.useState({
    image: 1,
    nft: 1,
    own: 1,
    rent: 1,
  });
  const [allPageCount, setAllPageCount] = React.useState({
    image: 1,
    nft: 1,
    own: 1,
    rent: 1,
  });
  const handlePageIndexChange = (event, value) => {
    setPageIndex((prevState) => {
      return {
        ...prevState,
        [mode]: value,
      };
    });
  };

  //*---------------------------------------------------------------------------
  //* For dialog.
  //*---------------------------------------------------------------------------
  const [openDialog, setOpenDialog] = React.useState(false);

  //* TODO: Fix multiple calls.
  React.useEffect(() => {
    // console.log("call useEffect()");
    // console.log("mode: ", mode);
    // console.log("selectedChain: ", selectedChain);
    // console.log("address: ", address);
    // console.log("isConnected: ", isConnected);

    async function initialize() {
      await initializeImageData();
      if (isWalletConnected() === true) {
        await initializeNftData();
      }
      // console.log("initialize done");
    }
    try {
      initialize();
    } catch (error) {
      console.error(error);
    }
  }, [mode, selectedChain, address, isConnected, signer, promptNftContract]);

  async function initializeImageData() {
    // console.log("call initializeImageData()");

    try {
      //* Get all image prompt and image data.
      const getAllResult = await fetch(API_ALL_URL);
      // console.log("getAllResult: ", getAllResult);
      let allUnencyptedPromptImages;
      if (getAllResult.status !== 200) {
        setAllImageDataArray([]);
        setAllImageDataCount(0);
        // setAllPageCount(0);
        setAllPageCount((prevState) => {
          return {
            ...prevState,
            [mode]: 0,
          };
        });
        return;
      }

      allUnencyptedPromptImages = await getAllResult.json();
      // console.log("allUnencyptedPromptImages: ", allUnencyptedPromptImages);
      if (!allUnencyptedPromptImages) {
        setAllImageDataArray([]);
        setAllImageDataCount(0);
        // setAllPageCount(0);
        setAllPageCount((prevState) => {
          return {
            ...prevState,
            [mode]: 0,
          };
        });
        return;
      }

      setAllImageDataArray(allUnencyptedPromptImages.data);
      setAllImageDataCount(allUnencyptedPromptImages.data.length);
      // console.log(
      //   "allUnencyptedPromptImages.data.length: ",
      //   allUnencyptedPromptImages.data.length
      // );

      //* Get total page count not from useState but variable directly.
      let allCount = 0;
      switch (mode) {
        case "image":
          allCount = allUnencyptedPromptImages.data.length;
          break;
      }
      const totalCount = Math.ceil(allCount / NUMBER_PER_PAGE);
      // console.log("totalCount: ", totalCount);
      // console.log("mode: ", mode);
      setAllPageCount((prevState) => {
        return {
          ...prevState,
          [mode]: totalCount,
        };
      });
    } catch (error) {
      throw error;
    }
  }

  async function initializeNftData() {
    // console.log("call initializeNftData()");

    try {
      //* Get all nft data.
      const { allNftDataCountResult, allNftDataArrayResult } =
        await getAllNftData();
      // console.log("allNftDataCountResult: ", allNftDataCountResult);
      // console.log("allNftDataArrayResult: ", allNftDataArrayResult);
      setAllNftDataCount(allNftDataCountResult);
      setAllNftDataArray(allNftDataArrayResult.reverse());

      //* Get all register data array.
      const { allRegisterDataCountResult, allRegisterDataArrayResult } =
        await getAllRegisterData({
          allNftDataArrayResult: allNftDataArrayResult,
        });
      // console.log("allRegisterDataCountResult: ", allRegisterDataCountResult);
      // console.log("allRegisterDataArrayResult: ", allRegisterDataArrayResult);
      setAllRegisterDataCount(allRegisterDataCountResult);
      setAllRegisterDataArray(allRegisterDataArrayResult.reverse());

      //* Get all my own data array.
      const { myOwnDataCountResult, myOwnDataArrayResult } =
        await getAllMyOwnData({
          owner: address,
          allNftDataArrayResult: allNftDataArrayResult,
        });
      // console.log("myOwnDataCountResult: ", myOwnDataCountResult);
      // console.log("myOwnDataArrayResult: ", myOwnDataArrayResult);
      setAllMyOwnDataCount(myOwnDataCountResult);
      setAllMyOwnDataArray(myOwnDataArrayResult.reverse());

      //* Get all my rent data array.
      const { myRentDataCountResult, myRentDataArrayResult } =
        await getAllMyRentData({
          myAccount: address,
          allNftDataArrayResult: allNftDataArrayResult,
        });
      // console.log("myRentDataCountResult: ", myRentDataCountResult);
      // console.log("myRentDataArrayResult: ", myRentDataArrayResult);
      setAllMyRentDataCount(myRentDataCountResult);
      setAllMyRentDataArray(myRentDataArrayResult.reverse());

      //* Get total page count not from useState but variable directly.
      let allCount = 0;
      switch (mode) {
        case "image":
          allCount = allImageDataCount;
          break;

        case "nft":
          allCount = allNftDataCountResult;
          break;

        case "own":
          allCount = myOwnDataCountResult;
          break;

        case "rent":
          allCount = myRentDataCountResult;
          break;
      }
      const totalCount = Math.ceil(allCount / NUMBER_PER_PAGE);
      // console.log("totalCount: ", totalCount);
      // console.log("mode: ", mode);
      setAllPageCount((prevState) => {
        return {
          ...prevState,
          [mode]: totalCount,
        };
      });
    } catch (error) {
      throw error;
    }
  }

  async function decryptData({ encryptData, decryptAddress }) {
    // console.log("call decyptData()");
    // console.log("decryptAddress: ", decryptAddress);

    //* Check input data error.
    if (!encryptData || !decryptAddress) {
      return;
    }

    const ct = `0x${Buffer.from(JSON.stringify(encryptData), "utf8").toString(
      "hex"
    )}`;

    const decrypt = await window.ethereum.request({
      method: "eth_decrypt",
      params: [ct, decryptAddress],
    });

    return Base64.decode(decrypt);
  }

  async function getAllNftData() {
    // console.log("call getAllNftData()");
    // console.log("signer: ", signer);
    // console.log("promptNftContract: ", promptNftContract);

    //* If no signer, return zero data.
    if (!promptNftContract || !signer) {
      // console.log("promptNftContract or signer is null or undefined.");
      // console.log("promptNftContract: ", promptNftContract);
      // console.log("signer: ", signer);
      //* Return error.
      return {
        allNftDataCountResult: 0,
        allNftDataArrayResult: [],
      };
    }

    //* Get all nft data from nft contract.
    const totalSupplyBigNumber = await promptNftContract
      .connect(signer)
      .totalSupply();
    // console.log("totalSupplyBigNumber: ", totalSupplyBigNumber);
    const allNftCountResult = totalSupplyBigNumber.toNumber();
    // console.log("allNftCountResult: ", allNftCountResult);

    //* Get all metadata per each token as to token uri.
    let allNftDataResultArray = [];
    for (let i = 0; i < allNftCountResult; i++) {
      //* Get token id and uri.
      const tokenId = await promptNftContract.connect(signer).tokenByIndex(i);
      const tokenURI = await promptNftContract
        .connect(signer)
        .tokenURI(tokenId);

      //* Get token metadata from token uri.
      //* TODO: Make async later.
      const fetchResult = await fetch(tokenURI);
      const tokenMetadata = await fetchResult.blob();
      const metadataJsonTextData = await tokenMetadata.text();
      const metadataJsonData = JSON.parse(metadataJsonTextData);

      //* Add token metadata.
      allNftDataResultArray.push({
        tokenId: tokenId,
        metadata: metadataJsonData,
      });
    }
    // console.log("allNftDataResultArray: ", allNftDataResultArray);

    //* Return token data array.
    return {
      allNftDataCountResult: allNftDataResultArray.length,
      allNftDataArrayResult: allNftDataResultArray,
    };
  }

  async function getAllRegisterData({ allNftDataArrayResult }) {
    if (!rentMarketContract || !signer) {
      console.error("rentMarketContract or signer is null or undefined.");
      return {
        allRegisterDataCountResult: 0,
        allRegisterDataArrayResult: [],
      };
    }

    //* Get all nft data from rentmarket contract.
    const allRegisterDataArray = await rentMarketContract
      .connect(signer)
      .getAllRegisterData();
    // console.log("allRegisterDataArray: ", allRegisterDataArray);

    const allRegisterDataWithMetadataArray = allRegisterDataArray
      .map((registerElement) => {
        // console.log("registerElement.tokenId: ", registerElement.tokenId);
        const nftDataFoundIndex = allNftDataArrayResult.findIndex(
          (nftElement) => {
            // console.log("nftElement.tokenId: ", nftElement.tokenId);
            return registerElement.tokenId.eq(nftElement.tokenId);
          }
        );
        // console.log("nftDataFoundIndex: ", nftDataFoundIndex);

        if (nftDataFoundIndex !== -1) {
          // Nft should be in register data.
          return {
            tokenId: registerElement.tokenId,
            rentFee: registerElement.rentFee,
            feeTokenAddress: registerElement.feeTokenAddress,
            rentFeeByToken: registerElement.rentFeeByToken,
            rentDuration: registerElement.rentDuration,
            metadata: allNftDataArrayResult[nftDataFoundIndex].metadata,
          };
        }
      })
      .filter((element) => element !== undefined);
    // console.log(
    //   "allRegisterDataWithMetadataArray: ",
    //   allRegisterDataWithMetadataArray
    // );

    //* Return token data array.
    return {
      allRegisterDataCountResult: allRegisterDataWithMetadataArray.length,
      allRegisterDataArrayResult: allRegisterDataWithMetadataArray,
    };
  }

  async function getAllMyOwnData({ owner, allNftDataArrayResult }) {
    // console.log("call getAllMyOwnData()");
    // console.log("signer: ", signer);

    //* If no signer, return zero data.
    if (!promptNftContract || !signer) {
      //* Return error.
      return {
        myOwnDataCountResult: 0,
        myOwnDataArrayResult: [],
      };
    }

    //* Get total supply of prompt nft.
    const totalSupplyBigNumber = await promptNftContract
      .connect(signer)
      .balanceOf(owner);
    // console.log("totalSupply: ", totalSupply);
    const totalSupply = totalSupplyBigNumber.toNumber();

    //* Get all metadata per each token as to token uri.
    let tokenDataArray = [];
    for (let i = 0; i < totalSupply; i++) {
      //* Get token id and uri.
      const tokenId = await promptNftContract
        .connect(signer)
        .tokenOfOwnerByIndex(owner, i);
      const tokenURI = await promptNftContract
        .connect(signer)
        .tokenURI(tokenId);

      //* Get token metadata from token uri.
      //* TODO: Make async later.
      const fetchResult = await fetch(tokenURI);
      const tokenMetadata = await fetchResult.blob();
      const metadataJsonTextData = await tokenMetadata.text();
      const metadataJsonData = JSON.parse(metadataJsonTextData);

      //* Add token metadata.
      tokenDataArray.push({
        tokenId: tokenId,
        metadata: metadataJsonData,
      });
    }
    // console.log("tokenURIArray: ", tokenURIArray);

    //* Return token data array.
    return {
      myOwnDataCountResult: totalSupply,
      myOwnDataArrayResult: tokenDataArray,
    };
  }

  async function getAllMyRentData({ myAccount, allNftDataArrayResult }) {
    if (!rentMarketContract || !signer) {
      console.error("rentMarketContract or signer is null or undefined.");
      return {
        myRentDataCountResult: 0,
        myRentDataArrayResult: [],
      };
    }

    const allRentDataResult = await rentMarketContract
      .connect(signer)
      .getAllRentData();

    const allRentDataArrayWithMetadata = allRentDataResult
      .filter(
        (rentElement) =>
          rentElement.renteeAddress.localeCompare(myAccount, undefined, {
            sensitivity: "accent",
          }) === 0
      )
      .map((rentElement) => {
        const nftDataFoundIndex = allNftDataArrayResult.findIndex(
          (nftElement) => {
            return rentElement.tokenId.eq(nftElement.tokenId) === true;
          }
        );

        if (nftDataFoundIndex !== -1) {
          // Nft should be in register data.
          return {
            tokenId: rentElement.tokenId,
            rentFee: rentElement.rentFee,
            feeTokenAddress: rentElement.feeTokenAddress,
            rentFeeByToken: rentElement.rentFeeByToken,
            rentDuration: rentElement.rentDuration,
            metadata: allNftDataArrayResult[nftDataFoundIndex].metadata,
          };
        }
      })
      .filter((element) => element !== undefined);
    // console.log("allRentDataArrayWithMetadata: ", allRentDataArrayWithMetadata);

    // Return all my rent data array.
    return {
      myRentDataCountResult: allRentDataArrayWithMetadata.length,
      myRentDataArrayResult: allRentDataArrayWithMetadata,
    };
  }

  function handleCardMediaImageError(e) {
    // console.log("call handleCardMediaImageError()");
    // console.log("imageUrl: ", imageUrl);
    e.target.onerror = null;
    e.target.src = PLACEHOLDER_IMAGE_URL;
  }

  function ImageCardList() {
    return allImageDataArray.map((imageData, idx) => {
      // console.log("idx: ", idx);
      // console.log("pageIndex.image: ", pageIndex.image);
      // console.log("imageData: ", imageData);
      // Check idx is in pagination.
      // pageIndex.image starts from 1.
      // idx starts from 0.
      if (
        idx >= (pageIndex.image - 1) * NUMBER_PER_PAGE &&
        idx < pageIndex.image * NUMBER_PER_PAGE
      ) {
        return (
          <Box sx={{ m: CARD_PADDING }} key={idx}>
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
    });
  }

  function RegisterCardList() {
    if (allRegisterDataCount === 0) {
      return <NoContentPage />;
    }

    return allRegisterDataArray.map((nftData, idx) => {
      // console.log("idx: ", idx);
      // console.log("pageIndex.nft: ", pageIndex.nft);
      //* Check idx is in pagination.
      //* pageIndex.nft starts from 1.
      //* idx starts from 0.
      if (
        idx >= (pageIndex.nft - 1) * NUMBER_PER_PAGE &&
        idx < pageIndex.nft * NUMBER_PER_PAGE
      ) {
        return (
          <Box
            marginTop={"20px"}
            sx={{ m: CARD_PADDING, marginTop: "20px" }}
            key={getUniqueKey()}
          >
            <Card sx={{ minWidth: CARD_MIN_WIDTH, maxWidth: CARD_MAX_WIDTH }}>
              <CardMedia
                component="img"
                width={100}
                image={nftData.metadata.image}
                onError={handleCardMediaImageError}
              />
              <CardContent>
                <Typography
                  sx={{ fontSize: 14 }}
                  color="text.secondary"
                  gutterBottom
                >
                  token id: {nftData.tokenId.toNumber()}
                </Typography>
                <Typography
                  sx={{ fontSize: 14 }}
                  color="text.secondary"
                  gutterBottom
                  component="div"
                >
                  name: {nftData.metadata.name}
                </Typography>
                <Typography
                  sx={{ fontSize: 14 }}
                  color="text.secondary"
                  gutterBottom
                  component="div"
                >
                  description: {nftData.metadata.description}
                </Typography>
                <Typography
                  sx={{ fontSize: 14 }}
                  color="text.secondary"
                  gutterBottom
                  component="div"
                >
                  rent fee: {nftData.rentFee / Math.pow(10, 18)} matic
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={async () => {
                    if (
                      status !== "connected" ||
                      checkBlockchainNetwork({ inputChainId: chainId }) ===
                        false
                    ) {
                      // TODO: Change or add blockchain network.
                      // console.log("chainName: ", getChainName({ chainId }));
                      setSnackbarSeverity("warning");
                      setSnackbarMessage(
                        `Change metamask network to ${process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK}`
                      );
                      setOpenSnackbar(true);
                      return;
                    }

                    if (!rentMarketContract || !signer) {
                      console.error(
                        "rentMarketContract or signer is null or undefined."
                      );
                      return;
                    }

                    // Rent this nft with rent fee.
                    const tx = await rentMarketContract
                      .connect(signer)
                      .rentNFT(
                        process.env.NEXT_PUBLIC_PROMPT_NFT_CONTRACT_ADDRESS,
                        nftData.tokenId,
                        process.env.NEXT_PUBLIC_SERVICE_ACCOUNT_ADDRESS,
                        {
                          value: nftData.rentFee,
                        }
                      );
                    const txResult = await tx.wait();
                  }}
                >
                  RENT
                </Button>
              </CardActions>
            </Card>
          </Box>
        );
      }
    });
  }

  function OwnCardList() {
    // console.log("call OwnCardList()");
    // console.log("allMyOwnDataCount: ", allMyOwnDataCount);

    if (allMyOwnDataCount === 0) {
      return <NoContentPage />;
    }

    return allMyOwnDataArray.map((nftData, idx) => {
      // console.log("nftData: ", nftData);
      // console.log("idx: ", idx);
      // console.log("pageIndex.own: ", pageIndex.own);
      // Check idx is in pagination.
      // pageIndex.own starts from 1.
      // idx starts from 0.
      if (
        idx >= (pageIndex.own - 1) * NUMBER_PER_PAGE &&
        idx < pageIndex.own * NUMBER_PER_PAGE
      ) {
        return (
          <Box sx={{ m: CARD_PADDING }} key={idx}>
            <Card sx={{ minWidth: CARD_MIN_WIDTH, maxWidth: CARD_MAX_WIDTH }}>
              <CardMedia
                component="img"
                image={nftData.metadata.image}
                onError={handleCardMediaImageError}
              />
              <CardContent>
                <Typography
                  sx={{ fontSize: 14 }}
                  color="text.secondary"
                  gutterBottom
                >
                  token id: {nftData.tokenId.toNumber()}
                </Typography>
                <Typography
                  sx={{ fontSize: 14 }}
                  color="text.secondary"
                  gutterBottom
                  component="div"
                >
                  name: {nftData.metadata.name}
                </Typography>
                <Typography
                  sx={{ fontSize: 14 }}
                  color="text.secondary"
                  gutterBottom
                  component="div"
                >
                  description: {nftData.metadata.description}
                </Typography>
                <Typography
                  sx={{ fontSize: 14 }}
                  color="text.secondary"
                  gutterBottom
                  component="div"
                >
                  rent fee: {nftData.rentFee / Math.pow(10, 18)} matic
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={async () => {
                    if (mode !== "image" && isWalletConnected() === true) {
                      // console.log("chainName: ", getChainName({ chainId }));
                      setSnackbarSeverity("warning");
                      setSnackbarMessage(
                        `Change metamask network to ${process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK}`
                      );
                      setOpenSnackbar(true);
                      return;
                    }

                    const encryptPromptData = await promptNftContract
                      .connect(signer)
                      .getTokenOwnerPrompt(nftData.tokenId);
                    // console.log("encryptPromptData: ", encryptPromptData);

                    const encryptData = {
                      ciphertext: encryptPromptData["ciphertext"],
                      ephemPublicKey: encryptPromptData["ephemPublicKey"],
                      nonce: encryptPromptData["nonce"],
                      version: encryptPromptData["version"],
                    };
                    // console.log("encryptData: ", encryptData);

                    const prompt = await decryptData({
                      encryptData: encryptData,
                      decryptAddress: address,
                    });
                    // console.log("prompt: ", prompt);

                    setDecryptedPrompt(prompt);
                    setOpenDialog(true);
                  }}
                >
                  PROMPT
                </Button>
              </CardActions>
            </Card>
          </Box>
        );
      }
    });
  }

  function RentCardList() {
    if (allMyRentDataCount === 0) {
      return <NoContentPage />;
    }

    return allMyRentDataArray.map((nftData, idx) => {
      // console.log("nftData: ", nftData);
      // console.log("idx: ", idx);
      // console.log("pageIndex.rent: ", pageIndex.rent);
      // Check idx is in pagination.
      // pageIndex.rent starts from 1.
      // idx starts from 0.
      if (
        idx >= (pageIndex.rent - 1) * NUMBER_PER_PAGE &&
        idx < pageIndex.rent * NUMBER_PER_PAGE
      ) {
        return (
          <Box sx={{ m: CARD_PADDING }} key={idx}>
            <Card sx={{ minWidth: CARD_MIN_WIDTH, maxWidth: CARD_MAX_WIDTH }}>
              <CardMedia
                component="img"
                image={nftData.metadata.image}
                onError={handleCardMediaImageError}
              />
              <CardContent>
                <Typography
                  sx={{ fontSize: 14 }}
                  color="text.secondary"
                  gutterBottom
                >
                  token id: {nftData.tokenId.toNumber()}
                </Typography>
                <Typography
                  sx={{ fontSize: 14 }}
                  color="text.secondary"
                  gutterBottom
                  component="div"
                >
                  name: {nftData.metadata.name}
                </Typography>
                <Typography
                  sx={{ fontSize: 14 }}
                  color="text.secondary"
                  gutterBottom
                  component="div"
                >
                  description: {nftData.metadata.description}
                </Typography>
                <Typography
                  sx={{ fontSize: 14 }}
                  color="text.secondary"
                  gutterBottom
                  component="div"
                >
                  rent fee: {nftData.rentFee / Math.pow(10, 18)} matic
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={async () => {
                    if (
                      status !== "connected" ||
                      checkBlockchainNetwork({ inputChainId: chainId }) ===
                        false
                    ) {
                      // TODO: Change or add blockchain network.
                      // console.log("chainName: ", getChainName({ chainId }));
                      setSnackbarSeverity("warning");
                      setSnackbarMessage(
                        `Change metamask network to ${process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK}`
                      );
                      setOpenSnackbar(true);
                      return;
                    }

                    const body = { tokenId: nftData.tokenId.toNumber() };
                    const promptResult = await fetchJson("/api/prompt", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(body),
                    });
                    // console.log("promptResult:", promptResult);
                    const decodedPrompt = Base64.decode(
                      promptResult.prompt
                    ).toString();
                    // console.log("decodedPrompt:", decodedPrompt);

                    setDecryptedPrompt(decodedPrompt);
                    setOpenDialog(true);
                  }}
                >
                  PROMPT
                </Button>
              </CardActions>
            </Card>
          </Box>
        );
      }
    });
  }

  function isWalletConnected() {
    // console.log("call isWalletConnected()");
    // console.log("isConnected: ", isConnected);
    // console.log("selectedChain: ", selectedChain);
    // if (selectedChain) {
    //   console.log(
    //     "getChainName({ chainId: selectedChain.id }): ",
    //     getChainName({ chainId: selectedChain.id })
    //   );
    // }
    // console.log(
    //   "getChainName({ chainId: process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK }): ",
    //   getChainName({ chainId: process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK })
    // );
    if (
      isConnected === false ||
      selectedChain === undefined ||
      getChainName({ chainId: selectedChain.id }) !==
        getChainName({
          chainId: process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK,
        })
    ) {
      // console.log("return false");
      return false;
    } else {
      // console.log("return true");
      return true;
    }
  }

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

  function NoContentPage() {
    return (
      <Box
        sx={{
          "& .MuiTextField-root": { m: 1, width: "25ch" },
        }}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Grid container spacing={2} justifyContent="space-around" padding={2}>
          <Grid item>
            <Web3Button />
          </Grid>
          <Grid item>
            <Web3NetworkSwitch />
          </Grid>
        </Grid>
        <Card sx={{ minWidth: CARD_MIN_WIDTH, maxWidth: CARD_MAX_WIDTH }}>
          <CardMedia component="img" image={PLACEHOLDER_IMAGE_URL} />
          <CardContent
            sx={{
              padding: "10",
            }}
          >
            <Typography variant="h7">
              Now, we're gathering prompt NFT from people who want to draw
              prompt image with NFT.
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
        minHeight="100vh"
        flexDirection="column"
      >
        {mode === "image" ? (
          <ImageCardList />
        ) : mode === "nft" ? (
          <div>
            {isWalletConnected() === false ? (
              <NoLoginPage />
            ) : (
              <RegisterCardList />
            )}
          </div>
        ) : mode === "own" ? (
          <div>
            {isWalletConnected() === false ? <NoLoginPage /> : <OwnCardList />}
          </div>
        ) : mode === "rent" ? (
          <div>
            {isWalletConnected() === false ? <NoLoginPage /> : <RentCardList />}
          </div>
        ) : (
          <ImageCardList />
        )}

        <Box sx={{ m: 5 }}>
          <Pagination
            count={allPageCount[mode]}
            page={pageIndex[mode]}
            onChange={handlePageIndexChange}
            variant="outlined"
            sx={{
              padding: "10",
              ul: {
                "& .MuiPaginationItem-root": {
                  color: "darkgrey",
                  "&.Mui-selected": {
                    background: "lightcyan",
                    color: "darkgrey",
                  },
                },
              },
            }}
          />
        </Box>

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
