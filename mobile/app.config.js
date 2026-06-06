const path = require("path");
const { load } = require("@expo/env");
const appJson = require("./app.json");

load(path.resolve(__dirname));

const apiUrl = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:9000").trim();

/** @type {import("expo/config").ExpoConfig} */
module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      apiUrl,
    },
  },
};
