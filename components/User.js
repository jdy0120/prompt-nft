import { useAccount, useWalletClient, useNetwork } from "wagmi";
import Button from "@mui/material/Button";
import { Typography } from "@mui/material";
import useUser from "@/lib/useUser";
import fetchJson, { FetchError } from "@/lib/fetchJson";

export default function User() {
  //*----------------------------------------------------------------------------
  //* Define constance variables.
  //*----------------------------------------------------------------------------
  const { chains, chain: selectedChain } = useNetwork();
  // console.log("selectedChain: ", selectedChain);
  const { address, isConnected } = useAccount();
  // console.log("address: ", address);
  // console.log("isConnected: ", isConnected);
  const { data: walletClient } = useWalletClient();
  // console.log("walletClient: ", walletClient);
  // console.log("isError: ", isError);
  // console.log("isLoading: ", isLoading);
  const { user, mutateUser } = useUser();
  // const { status, connect, account, chainId, ethereum } = useMetaMask();

  // console.log("user: ", user);

  const handleLoginClick = async () => {
    const publicAddress = address.toLowerCase();
    // console.log("publicAddress: ", publicAddress);

    // Popup MetaMask confirmation modal to sign message with nonce data.
    const signMessageResult = await handleSignMessage();
    // console.log("signMessageResult: ", signMessageResult);

    // Send signature to back-end on the /auth route.
    await handleAuthenticate({
      publicAddress: publicAddress,
      signature: signMessageResult,
    });
  };

  const handleSignMessage = async () => {
    const msgParams = JSON.stringify({
      domain: {
        chainId: selectedChain.id,
        name: "Realbits",
      },

      // Defining the message signing data content.
      message: {
        contents: process.env.NEXT_PUBLIC_LOGIN_SIGN_MESSAGE,
      },
      // Refers to the keys of the *types* object below.
      primaryType: "Login",

      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "chainId", type: "uint256" },
        ],
        // Refer to PrimaryType
        Login: [{ name: "contents", type: "string" }],
      },
    });

    const params = [address, msgParams];
    const method = "eth_signTypedData_v4";

    const requestResult = await ethereum.request({
      method,
      params,
    });
    // console.log("requestResult: ", requestResult);
    return requestResult;
  };

  const handleAuthenticate = async ({ publicAddress, signature }) => {
    const body = { publicAddress, signature };
    try {
      mutateUser(
        await fetchJson(
          { url: "/api/login" },
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        )
      );
    } catch (error) {
      if (error instanceof FetchError) {
        console.error(error.data.message);
      } else {
        console.error("An unexpected error happened:", error);
      }
    }
  };

  const handleLogoutClick = async () => {
    try {
      mutateUser(
        await fetchJson({ url: "/api/logout" }, { method: "POST" }),
        false
      );
    } catch (error) {
      if (error instanceof FetchError) {
        console.error(error.data.message);
      } else {
        console.error("An unexpected error happened:", error);
      }
    }
  };

  return (
    <>
      {(user === undefined || user.isLoggedIn === false) && (
        <Typography
          sx={{ my: 2, color: "white", display: "block" }}
          onClick={async () => {
            await handleLoginClick();
          }}
        >
          Login
        </Typography>
      )}
      {user !== undefined && user.isLoggedIn === true && (
        <Typography
          sx={{ my: 2, color: "white", display: "block" }}
          onClick={async () => {
            await handleLogoutClick();
          }}
        >
          Logout
        </Typography>
      )}
    </>
  );
}
