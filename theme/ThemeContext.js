import React, { createContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LightTheme } from "./colors";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const theme = "light";
  const colors = LightTheme;
  const isDarkMode = false;

  useEffect(() => {
    AsyncStorage.setItem("APP_THEME", "light").catch(() => { });
  }, []);

  const toggleTheme = () => {
    // Dark mode is permanently disabled; app only supports light mode
  };

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

