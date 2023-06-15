import * as React from "react";
import { useRouter } from "next/router";
import { Web3Button, Web3NetworkSwitch } from "@web3modal/react";
import moment from "moment";
import {
  useAccount,
  useSigner,
  useContract,
  useContractRead,
  useSignTypedData,
  useContractEvent,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
  useWatchPendingTransactions,
} from "wagmi";
import Image from "mui-image";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Slide from "@mui/material/Slide";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import rentmarketABI from "@/contracts/rentMarket.json";
import useUser from "@/lib/useUser";
import { sleep } from "@/lib/util";

export default function DrawImage() {
  const DRAW_API_URL = "/api/draw";
  const POST_API_URL = "/api/post";
  const UPLOAD_IMAGE_TO_S3_URL = "/api/upload-image-to-s3";
  const FETCH_RESULT_API_URL = "/api/fetch-result";
  const PLACEHOLDER_IMAGE_URL = process.env.NEXT_PUBLIC_PLACEHOLDER_IMAGE_URL;
  const DISCORD_BOT_TOKEN = process.env.NEXT_PUBLIC_DISCORD_BOT_TOKEN;
  const CARD_MARGIN_TOP = "60px";
  const CARD_MIN_WIDTH = 375;
  const CARD_MAX_WIDTH = 420;
  const CARD_PADDING = 1;
  const IMAGE_PADDING = 400;
  const { user, mutateUser } = useUser();
  const [imageUrl, setImageUrl] = React.useState("");
  const [loadingImage, setLoadingImage] = React.useState(false);
  const [imageHeight, setImageHeight] = React.useState(0);
  const router = useRouter();
  const MARGIN_TOP = "40px";

  //*---------------------------------------------------------------------------
  //* Wagmi hook.
  //*---------------------------------------------------------------------------
  const RENT_MARKET_CONTRACT_ADDRES =
    process.env.NEXT_PUBLIC_RENT_MARKET_CONTRACT_ADDRESS;
  const PAYMENT_NFT_CONTRACT_ADDRESS =
    process.env.NEXT_PUBLIC_PAYMENT_NFT_ADDRESS;
  const PAYMENT_NFT_TOKEN_ID = process.env.NEXT_PUBLIC_PAYMENT_NFT_TOKEN;
  const SERVICE_ACCOUNT_ADDRESS =
    process.env.NEXT_PUBLIC_SERVICE_ACCOUNT_ADDRESS;
  const { address, isConnected } = useAccount();
  const [rentPaymentNft, setRentPaymentNft] = React.useState(false);
  const [paymentNftRentFee, setPaymentNftRentFee] = React.useState();
  const [currentTimestamp, setCurrentTimestamp] = React.useState();
  const [imageFetchEndTime, setImageFetchEndTime] = React.useState();
  const [paymentNftRentEndTime, setPaymentNftRentEndTime] = React.useState();

  const {
    data: swrDataAllRentData,
    isError: swrErrorAllRentData,
    isLoading: swrIsLoadingAllRentData,
    isValidating: swrIsValidatingAllRentData,
    status: swrStatusAllRentData,
    refetch: swrRefetchAllRentData,
  } = useContractRead({
    address: RENT_MARKET_CONTRACT_ADDRES,
    abi: rentmarketABI.abi,
    functionName: "getAllRentData",
    // cacheOnBlock: true,
    // cacheTime: 60_000,
    // watch: false,
    onSuccess(data) {
      // console.log("call onSuccess()");
      // console.log("data: ", data);
    },
    onError(error) {
      // console.log("call onError()");
      // console.log("error: ", error);
    },
    onSettled(data, error) {
      // console.log("call onSettled()");
      // console.log("data: ", data);
      // console.log("error: ", error);
    },
  });

  const {
    data: swrDataRentData,
    isError: swrErrorRentData,
    isLoading: swrIsLoadingRentData,
    isValidating: swrIsValidatingRentData,
    status: swrStatusRentData,
    refetch: swrRefetchRentData,
  } = useContractRead({
    address: RENT_MARKET_CONTRACT_ADDRES,
    abi: rentmarketABI.abi,
    functionName: "getRegisterData",
    args: [PAYMENT_NFT_CONTRACT_ADDRESS, PAYMENT_NFT_TOKEN_ID],
    // cacheOnBlock: true,
    // cacheTime: 60_000,
    // watch: false,
    onSuccess(data) {
      // console.log("call onSuccess()");
      // console.log("data: ", data);
      // console.log("rentFee: ", Number(data.rentFee) / Math.pow(10, 18));
      setPaymentNftRentFee(Number(data.rentFee) / Math.pow(10, 18));
    },
    onError(error) {
      // console.log("call onError()");
      // console.log("error: ", error);
    },
    onSettled(data, error) {
      // console.log("call onSettled()");
      // console.log("data: ", data);
      // console.log("error: ", error);
    },
  });

  const { config: configPrepareRentNFT, error: errorPrepareRentNFT } =
    usePrepareContractWrite({
      address: RENT_MARKET_CONTRACT_ADDRES,
      abi: rentmarketABI.abi,
      functionName: "rentNFT",
      args: [
        PAYMENT_NFT_CONTRACT_ADDRESS,
        PAYMENT_NFT_TOKEN_ID,
        SERVICE_ACCOUNT_ADDRESS,
      ],
      enabled: false,
      onError(error) {
        // console.log("call onError()");
        // console.log("error: ", error);
      },
      onMutate(args, overrides) {
        // console.log("call onMutate()");
        // console.log("args: ", args);
        // console.log("overrides: ", overrides);
      },
      onSettled(data, error) {
        // console.log("call onSettled()");
        // console.log("data: ", data);
        // console.log("error: ", error);
      },
      onSuccess(data) {
        // console.log("call onSuccess()");
        // console.log("data: ", data);
      },
    });

  const {
    data: dataRentNFT,
    error: errorRentNFT,
    isError: isErrorRentNFT,
    isIdle: isIdleRentNFT,
    isLoading: isLoadingRentNFT,
    isSuccess: isSuccessRentNFT,
    write: writeRentNFT,
    status: statusRentNFT,
  } = useContractWrite({
    address: RENT_MARKET_CONTRACT_ADDRES,
    abi: rentmarketABI.abi,
    functionName: "rentNFT",
    args: [
      PAYMENT_NFT_CONTRACT_ADDRESS,
      PAYMENT_NFT_TOKEN_ID,
      SERVICE_ACCOUNT_ADDRESS,
    ],
  });

  const waitForTransaction = useWaitForTransaction({
    hash: dataRentNFT?.hash,
    onSuccess(data) {
      // console.log("call onSuccess()");
      // console.log("data: ", data);
    },
    onError(error) {
      // console.log("call onError()");
      // console.log("error: ", error);
    },
    onSettled(data, error) {
      // console.log("call onSettled()");
      // console.log("data: ", data);
      // console.log("error: ", error);
    },
  });

  useWatchPendingTransactions({
    listener: function (tx) {
      // console.log("tx: ", tx);
    },
  });

  //*---------------------------------------------------------------------------
  //* Handle text input change.
  //*---------------------------------------------------------------------------
  const [formValue, setFormValue] = React.useState({
    prompt: "",
    negativePrompt: "",
    modelName: "",
  });
  const { prompt, negativePrompt, modelName } = formValue;
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValue((prevState) => {
      return {
        ...prevState,
        [name]: value,
      };
    });
  };

  const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  });

  React.useEffect(() => {
    // console.log("call useEffect()");
    const countdown = setInterval(() => {
      const timestamp = Math.floor(Date.now() / 1000);
      // console.log("timestamp: ", timestamp);
      setCurrentTimestamp(timestamp);
    }, 1000);
    return () => clearInterval(countdown);
  }, [currentTimestamp]);

  React.useEffect(
    function () {
      // console.log("call useEffect()");

      //* Check user has rented the payment nft.
      if (swrDataAllRentData) {
        swrDataAllRentData.map(function (rentData) {
          // console.log("rentData: ", rentData);
          if (
            rentData.renteeAddress.toLowerCase() === address?.toLowerCase() &&
            rentData.nftAddress.toLowerCase() ===
              PAYMENT_NFT_CONTRACT_ADDRESS.toLowerCase() &&
            Number(rentData.tokenId) === Number(PAYMENT_NFT_TOKEN_ID)
          ) {
            const rentEndTime =
              Number(rentData.rentStartTimestamp) +
              Number(rentData.rentDuration);
            setPaymentNftRentEndTime(rentEndTime);
            setRentPaymentNft(true);
          }
        });
      }

      setImageHeight(window.innerHeight - IMAGE_PADDING);

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    },
    [swrDataAllRentData]
  );

  function handleResize() {
    setImageHeight(window.innerHeight - IMAGE_PADDING);
  }

  async function fetchImage() {
    setLoadingImage(true);

    //* Make stable diffusion api option by json.
    const jsonData = {
      prompt: prompt,
      negative_prompt: negativePrompt,
    };

    const fetchResponse = await fetch(DRAW_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jsonData),
    });
    // console.log("fetchResponse: ", fetchResponse);

    //* Check error response.
    if (fetchResponse.status !== 200) {
      console.error("jsonResponse.status is not success.");
      setLoadingImage(false);
      return;
    }

    //* Get the stable diffusion api result by json.
    const jsonResponse = await fetchResponse.json();
    // console.log("jsonResponse: ", jsonResponse);

    //* Handle fetch result.
    if (jsonResponse.status === "processing") {
      const eta = jsonResponse.eta;
      const timestamp = Math.floor(Date.now() / 1000);
      setImageFetchEndTime(timestamp + eta);

      await sleep((eta + 1) * 1000);
      setImageFetchEndTime(undefined);

      const fetchJsonData = {
        id: jsonResponse.id,
      };
      const fetchResultResponse = await fetch(FETCH_RESULT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fetchJsonData),
      });

      //* Check error response.
      if (fetchResultResponse.status !== 200) {
        console.error("jsonResponse.status is not success.");
        setLoadingImage(false);
        return;
      }

      //* Get the stable diffusion api result by json.
      const jsonResponse = await fetchResultResponse.json();
      // console.log("jsonResponse: ", jsonResponse);

      //* Set image url.
      setImageUrl(jsonResponse.output[0]);
      setLoadingImage(false);
    }

    if (jsonResponse.status === "success") {
      const imageUrlResponse = jsonResponse.imageUrl[0];
      const meta = jsonResponse.meta;
      // console.log("imageUrlResponse: ", imageUrlResponse);
      // console.log("meta.negative_prompt: ", meta.negative_prompt);
      // console.log("meta.prompt: ", meta.prompt);
      // console.log("meta.model: ", meta.model);

      //* Change prompt, negativePrompt, modelName.
      let event = {};
      event.target = { name: "prompt", value: meta.prompt };
      handleChange(event);
      event.target = { name: "negativePrompt", value: meta.negative_prompt };
      handleChange(event);
      event.target = { name: "modelName", value: meta.model };
      handleChange(event);

      //* Upload image to S3.
      const uploadImageJsonData = {
        imageUrl: imageUrlResponse,
      };
      let responseUploadImageToS3;
      try {
        responseUploadImageToS3 = await fetch(UPLOAD_IMAGE_TO_S3_URL, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(uploadImageJsonData),
        });
      } catch (error) {
        console.error(`responseUploadImageToS3: ${responseUploadImageToS3}`);
        setLoadingImage(false);
        return;
      }

      if (responseUploadImageToS3.status !== 200) {
        console.error(`responseUploadImageToS3: ${responseUploadImageToS3}`);
        setLoadingImage(false);
        return;
      }
      const imageUploadJsonResponse = await responseUploadImageToS3.json();
      // console.log("imageUploadJsonResponse: ", imageUploadJsonResponse);

      //* Post imageUrlResponse and prompt to prompt server.
      const imageUploadResponse = await fetch(POST_API_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: meta.prompt,
          negativePrompt: meta.negative_prompt,
          imageUrl: imageUploadJsonResponse.url,
          discordBotToken: DISCORD_BOT_TOKEN,
        }),
      });
      // console.log("imageUploadResponse: ", imageUploadResponse);

      if (imageUploadResponse.status !== 200) {
        console.error(`imageUploadResponse: ${imageUploadResponse}`);
        setLoadingImage(false);
        return;
      }

      //* Set image url from image generation server.
      setImageUrl(imageUrlResponse);
      setLoadingImage(false);
    }
  }

  function buildWalletConnectPage() {
    return (
      <>
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
          <Card sx={{ minWidth: CARD_MIN_WIDTH, maxWidth: CARD_MAX_WIDTH }}>
            <CardMedia component="img" image={PLACEHOLDER_IMAGE_URL} />
            <CardContent
              sx={{
                padding: "10",
              }}
            >
              <Typography variant="h7">
                You should connect with your wallet such as metamask. Click the
                upper "Connect Wallet" button.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </>
    );
  }

  function buildWalletLoginPage() {
    return (
      <>
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
          <Card sx={{ minWidth: CARD_MIN_WIDTH, maxWidth: CARD_MAX_WIDTH }}>
            <CardMedia component="img" image={PLACEHOLDER_IMAGE_URL} />
            <CardContent
              sx={{
                padding: "10",
              }}
            >
              <Typography variant="h7">
                You should login with your wallet such as metamask. Click the
                upper-right "Login" button.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </>
    );
  }

  function buildLoadingPage() {
    // console.log("call buildLoadingPage()");

    return (
      <>
        <Typography>Loading ...</Typography>
      </>
    );
  }

  function buildPaymentPage() {
    return (
      <>
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
          <Card sx={{ minWidth: CARD_MIN_WIDTH, maxWidth: CARD_MAX_WIDTH }}>
            <CardMedia component="img" image={PLACEHOLDER_IMAGE_URL} />
            <CardContent
              sx={{
                padding: "10",
              }}
            >
              <Typography variant="h7">
                You should rent this nft for drawing image.
              </Typography>
              <Button
                onClick={function () {
                  // console.log("dataRentNFT: ", dataRentNFT);
                  // console.log("errorRentNFT: ", errorRentNFT);
                  // console.log("isErrorRentNFT: ", isErrorRentNFT);
                  // console.log("isIdleRentNFT: ", isIdleRentNFT);
                  // console.log("isLoadingRentNFT: ", isLoadingRentNFT);
                  // console.log("isSuccessRentNFT: ", isSuccessRentNFT);
                  // console.log("writeRentNFT: ", writeRentNFT);
                  // console.log("statusRentNFT: ", statusRentNFT);
                  // console.log("swrDataRentData: ", swrDataRentData);

                  if (writeRentNFT && swrDataRentData) {
                    writeRentNFT?.({
                      value: swrDataRentData.rentFee,
                    });
                  }
                }}
              >
                Rent NFT ({paymentNftRentFee} matic)
              </Button>
            </CardContent>
          </Card>
        </Box>
      </>
    );
  }

  function buildDrawPage() {
    // console.log("call buildDrawPage()");
    // console.log("swrDataAllRentData: ", swrDataAllRentData);

    return (
      <>
        <Box
          component="form"
          noValidate
          autoComplete="off"
          display="flex"
          flexDirection="column"
        >
          {paymentNftRentEndTime && currentTimestamp && (
            <Typography color="black">
              {moment
                .duration((paymentNftRentEndTime - currentTimestamp) * 1000)
                .hours()}
              :
              {moment
                .duration((paymentNftRentEndTime - currentTimestamp) * 1000)
                .minutes()}
              :
              {moment
                .duration((paymentNftRentEndTime - currentTimestamp) * 1000)
                .seconds()}{" "}
              /
              {moment
                .duration((paymentNftRentEndTime - currentTimestamp) * 1000)
                .humanize()}
            </Typography>
          )}
          <TextField
            required
            id="outlined-required"
            label="prompt"
            error={prompt === "" ? true : false}
            name="prompt"
            value={prompt}
            onChange={handleChange}
            style={{
              width: "80vw",
            }}
            disabled={loadingImage}
            autoComplete="on"
          />
          <TextField
            required
            id="outlined-required"
            label="negative prompt"
            error={negativePrompt === "" ? true : false}
            name="negativePrompt"
            value={negativePrompt}
            onChange={handleChange}
            style={{
              width: "80vw",
            }}
            disabled={loadingImage}
            autoComplete="on"
          />
          <Button
            variant="contained"
            onClick={fetchImage}
            sx={{
              m: 1,
            }}
            disabled={loadingImage}
          >
            Draw
          </Button>
        </Box>
        <Box
          component="form"
          noValidate
          autoComplete="off"
          display="flex"
          flexDirection="column"
          alignItems="center"
        >
          {imageFetchEndTime && (
            <Typography color="black">
              {moment
                .duration((imageFetchEndTime - currentTimestamp) * 1000)
                .hours()}
              :
              {moment
                .duration((imageFetchEndTime - currentTimestamp) * 1000)
                .minutes()}
              :
              {moment
                .duration((imageFetchEndTime - currentTimestamp) * 1000)
                .seconds()}{" "}
              /
              {moment
                .duration((imageFetchEndTime - currentTimestamp) * 1000)
                .humanize()}
            </Typography>
          )}
          {loadingImage ? (
            <Box
              height={imageHeight}
              display="flex"
              flexDirection="row"
              alignItems="center"
            >
              <CircularProgress size={imageHeight * 0.4} />
            </Box>
          ) : (
            <Image
              src={imageUrl}
              height={imageHeight}
              fit="contain"
              duration={10}
              easing="ease"
              shiftDuration={10}
            />
          )}
          <Button
            variant="contained"
            onClick={() => {
              //* Get URI encoded string.
              const imageUrlEncodedString = encodeURIComponent(imageUrl);
              const promptEncodedString = encodeURIComponent(prompt);
              const negativePromptEncodedString =
                encodeURIComponent(negativePrompt);
              const link = `/mint/${promptEncodedString}/${imageUrlEncodedString}/${negativePromptEncodedString}`;
              router.push(link);
            }}
            sx={{
              width: "80vw",
              marginTop: 1,
            }}
            disabled={loadingImage}
          >
            Mint
          </Button>
        </Box>
      </>
    );
  }

  function buildPage() {
    if (isConnected === false) {
      return buildWalletConnectPage();
    }

    if (!swrDataAllRentData) {
      return buildLoadingPage();
    }

    if (user === undefined || user.isLoggedIn === false) {
      return buildWalletLoginPage();
    }
    if (user !== undefined && user.rentPaymentNft === true) {
      return buildDrawPage();
    } else {
      return buildPaymentPage();
    }
  }

  return (
    <>
      <Grid
        container
        spacing={2}
        justifyContent="end"
        sx={{ marginTop: MARGIN_TOP }}
      >
        <Grid item>
          <Web3Button />
        </Grid>
        <Grid item>
          <Web3NetworkSwitch />
        </Grid>
      </Grid>
      {buildPage()}
    </>
  );
}
