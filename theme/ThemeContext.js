import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";
import { LightTheme, DarkTheme } from "./colors";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {

  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState("light");
  const [colors, setColors] = useState(LightTheme);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const savedTheme = await AsyncStorage.getItem("APP_THEME");

    const selectedTheme = savedTheme || systemTheme || "light";

    applyTheme(selectedTheme);
  };

  const applyTheme = async (mode) => {
    setTheme(mode);
    setColors(mode === "dark" ? DarkTheme : LightTheme);
    await AsyncStorage.setItem("APP_THEME", mode);
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
