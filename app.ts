import fetch from "cross-fetch";
import { jwtDecode } from "jwt-decode";
import prompts from "prompts";
import { LocalStorage } from "node-localstorage";
import { JWTType, Animal, Choice, Pet } from "./types";
const localStorage = new LocalStorage("./scratch");

class FinalProject {
  #apiKey = "7rcWlG1jTkSyKDVcKkT2gsK0X8x8wjaYVyA63A16Fdvnh3qNOx";
  #secretKey = "v07CGa6J1tCIpup4j3JmQxzV9e5C0QfMcrTTrOjl";
  #accessTokenKey = "";
  #expireAccessToken: number = 0;
  #url = "https://api.petfinder.com/v2/";
  #animals: Animal[] = [];

  async readLocalAccessToken() {
    const rawData = localStorage.getItem("access-token");
    if (rawData) {
      const { accessToken } = JSON.parse(rawData);
      this.#accessTokenKey = accessToken.key;
      this.#expireAccessToken = accessToken.exp;
    }
  }
  async requestAccessToken() {
    const reqBody = {
      grant_type: "client_credentials",
      client_id: this.#apiKey,
      client_secret: this.#secretKey,
    };
    const rawResponse = await fetch(`${this.#url}oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody),
    });
    const response = await rawResponse.json();
    this.#accessTokenKey = response.access_token;
    console.log("AccessToken - Generated");
    await this.decodeToJwt();
  }
  saveLocalAccessToken() {
    const accessTokenObj = {
      accessToken: {
        key: this.#accessTokenKey,
        exp: this.#expireAccessToken,
      },
    };
    localStorage.setItem("access-token", JSON.stringify(accessTokenObj));
  }
  decodeToJwt(): void {
    const accessToken = this.#accessTokenKey;
    const decoded = jwtDecode<JWTType>(accessToken);
    this.#expireAccessToken = decoded.exp * 1000;
    const dataDecode = { token: decoded, expTime: decoded.exp };
    localStorage.setItem("token-decode", JSON.stringify(dataDecode));
    this.saveLocalAccessToken();
    const readData = localStorage.getItem("token-decode");

    let readDataParse;
    if (readData) {
      readDataParse = JSON.parse(readData);
    }
    this.promptUser();
  }

  async fetchPetData(type: string, gender: string) {
    try {
      if (this.#expireAccessToken < Date.now()) {
        console.log("Access Token Expired, Getting new one!");
        this.requestAccessToken();
      }
      const url = "https://api.petfinder.com/v2/animals";
      const reqUrl = `${url}?type=${type}&gender=${gender}`;
      const rawResponse = await fetch(reqUrl, {
        headers: { Authorization: `Bearer ${this.#accessTokenKey}` },
      });
      const data = await rawResponse.json();
      for (const animal of data.animals) {
        this.#animals.push({
          title: animal.name,
          value: animal.id,
        });
      }
      const userChoice = await this.selectPrompt(
        "id",
        "Select 1 Pet:",
        this.#animals
      );
      const id = userChoice.id;
      const rawResponse2 = await fetch(`${url}/${id}`, {
        headers: { Authorization: `Bearer ${this.#accessTokenKey}` },
      });
      const data2 = await rawResponse2.json();
      console.log(
        "########################################################################################################################"
      );
      let { animal } = data2;
      animal = {
        name: animal.name,
        breeds: animal.breeds,
        size: animal.size,
        age: animal.age,
        colors: animal.colors,
        status: animal.status,
        id: animal.id,
      };
      const pet: Pet = {
        [animal.id]: animal.name,
      };
      console.log(
        "                                     ----- Your Pick ----- "
      );
      console.log(animal.name);
      console.log(animal);
      console.log(
        "########################################################################################################################"
      );
      // this.promptUser();
      this.secoundQuestion(pet);
    } catch (e) {
      console.log("Error - fetchPetData: ", e);
    }
  }
  bookmarkPet(pet: Pet) {
    console.log(pet);
    const readBookmark = localStorage.getItem("bookmark");
    if (!readBookmark) {
      localStorage.setItem("bookmark", JSON.stringify(pet));
    } else {
      console.log(`
      File Found. Reading...
      `);
      const bookmark = JSON.parse(readBookmark);
      const id = Object.keys(pet)[0];
      if (!bookmark.hasOwnProperty(id)) {
        const value = Object.values(pet)[0];
        bookmark[id] = value;
        localStorage.setItem("bookmark", JSON.stringify(bookmark));
        console.log(bookmark);
      } else {
        console.log("Pet already exist");
      }
    }
  }
  removeBookmarkedPet(pet: Pet) {
    const petValue = Object.values(pet);
    console.log(`
    Removing BookMarked...
    ${petValue} `);
    const readBookmark = localStorage.getItem("bookmark");
    if (!readBookmark) console.log("File not found");
    else {
      const bookmark = JSON.parse(readBookmark);
      const id = Object.keys(pet)[0];
      if (bookmark.hasOwnProperty(id)) {
        delete bookmark[id];
        console.log("Successfully removed ", petValue);
        localStorage.setItem("bookmark", JSON.stringify(bookmark));
      } else {
        console.log(petValue, "- not found!");
      }
    }
  }
  displayBookmarkslist() {
    const readBookmark = localStorage.getItem("bookmark");
    if (!readBookmark) {
      console.log("No bookmarks");
    } else {
      console.log(`
      Your Pet BookMarks
      `);
      const bookmark = JSON.parse(readBookmark);
      console.log(bookmark);
    }
  }
  async secoundQuestion(pet: Pet | null) {
    console.log(pet);
    let continueLoop = true;

    while (continueLoop) {
      const options = [
        { title: "Bookmark selected pet", value: "1" },
        { title: "Remove selected pet bookmark list", value: "2" },
        { title: "Display Bookmarks list", value: "3" },
        { title: "Search pet prompt", value: "4" },
      ];
      const userInput = await this.selectPrompt(
        "select",
        "Please Select one option:",
        options
      );
      const choiceValue = +userInput.select;

      switch (choiceValue) {
        case 1:
          this.bookmarkPet(pet as Pet);
          break;
        case 2:
          this.removeBookmarkedPet(pet as Pet);
          break;
        case 3:
          this.displayBookmarkslist();
          break;
        case 4:
          console.log("=============== Asking 3 questions... ===============");
          this.promptUser();
          continueLoop = false;
          break;
        default:
          console.log("Invalid Choice");
      }
    }
  }
  async selectPrompt(name: string, msg: string, choices: Choice[]) {
    return await prompts({
      type: "select",
      name: name,
      message: msg,
      choices: choices,
    });
  }
  async promptUser() {
    try {
      if (this.#expireAccessToken < Date.now()) {
        this.requestAccessToken(); // work on it
      }
      const userResponseType = await this.selectPrompt("type", "Pet Type?", [
        { title: "Dog", value: "dog" },
        { title: "Cat", value: "cat" },
      ]);
      const userResponseGender = await this.selectPrompt(
        "gender",
        "Pet Gender?",
        [
          { title: "Male", value: "male" },
          { title: "Female", value: "female" },
        ]
      );
      console.log(
        "You Choices - ",
        userResponseType.type,
        userResponseGender.gender
      );
      this.fetchPetData(userResponseType.type, userResponseGender.gender);
    } catch (e) {
      console.log("Error: ", e);
    }
  }
  async run() {
    this.readLocalAccessToken();
    this.promptUser();
  }
}

const finalProject = new FinalProject();
finalProject.run();
