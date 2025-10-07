import React, { createContext, useContext } from 'react'
import { useSettings } from './SettingsContext'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const settings = useSettings()
  
  // Create a theme object that matches what components might expect
  const theme = {
    isDark: settings.darkMode,
    darkMode: settings.darkMode,
    colorScheme: settings.colorTheme,
    colors: settings.getThemeColors(),
    toggleTheme: () => settings.setDarkMode(!settings.darkMode),
    setColorScheme: settings.setColorTheme
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}

// Backward compatibility - export useTheme as default if needed
export default useTheme