import fetch from "cross-fetch";
import { jwtDecode } from "jwt-decode";
import { LocalStorage } from "node-localstorage";
const local_Storage = new LocalStorage("./scratch");

//types
type typeResponse = {
  token_type: string;
  expires_in: number;
  access_token: string;
};
type JWTType = {
  exp: number;
  aud: string;
  jti: string;
};
async function generateToken() {
  const link_URL = "https://api.petfinder.com/v2/oauth2/token";
  const pet_Finder_apiKEY =
    "ELliqAokgOa4cn3pNWhuCSR5blKteEla5GCCbZ32lvZrG5iUY6";
  const pet_Finder_mySecreteKEY = "t79xwqwvALTCyTBiH0N1Na1xQ32cE8SVhZ7vsZN9";

  const post_Request_Body = {
    grant_type: "client_credentials",
    client_id: pet_Finder_apiKEY,
    client_secret: pet_Finder_mySecreteKEY,
  };

  try {
    const rawResponse = await fetch(link_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post_Request_Body),
    });

    if (rawResponse) {
      const result: typeResponse = await rawResponse.json();
      return result;
    } else {
      return undefined;
    }
  } catch (error) {
    console.log("Unable to process the request");
  }
}
async function getTokenOnly() {
  try {
    const objectToken = await generateToken();
    if (objectToken) {
      const token_encrypted = objectToken.access_token;
      const decoded = jwtDecode<JWTType>(token_encrypted);
      return decoded;
    } else {
      return undefined;
    }
  } catch (error) {
    console.log("Unable to find encrypted token");
    return undefined;
  }
}

const access_Token = getTokenOnly().then((token_decoded) => {
  local_Storage.setItem("access_token", JSON.stringify(token_decoded));
});

const readData = local_Storage.getItem("access_token");

let readDataParse;
if (readData) {
  readDataParse = JSON.parse(readData);
  console.log("The exp time is", readDataParse.exp);
} else {
  console.log("Data is not available in local storage");
}

if (readDataParse.exp * 1000 > Date.now()) {
} else {
  getTokenOnly();
}
