import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator, CardStyleInterpolators } from "@react-navigation/stack";
import HomePage from './screens/HomePage';
import ProfilePage from "./screens/ProfilePage";
import PostsPage from "./screens/PostsPage";
import ProfileSettingsPage from "./screens/ProfileSettingsPage";
import SettingsPage from "./screens/SettingsPage";
import NewProductPage from "./screens/NewProductPage";
import ProductListPage from "./screens/ProductListPage";
import LoyaltyPage from "./screens/LoyaltyPage";
import { ThemeProvider } from "./theme/ThemeContext";
import Registration from "./screens/Registration";
import Login from "./screens/Login";
import AddOfferPage from "./screens/AddOfferPage";

const Stack = createStackNavigator();

export default function App() {
  return (
     <ThemeProvider>
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="HomePage"
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      >

    <Stack.Screen name="HomePage" component={HomePage} />
    <Stack.Screen name="ProfilePage" component={ProfilePage} />  
    <Stack.Screen name="PostsPage" component={PostsPage}/>
    <Stack.Screen name="ProfileSettingsPage" component={ProfileSettingsPage}/>
    <Stack.Screen name="SettingsPage" component={SettingsPage}/>
    <Stack.Screen name="NewProductPage" component={NewProductPage}/>
    <Stack.Screen name="ProductListPage" component={ProductListPage}/>
    <Stack.Screen name="LoyaltyPage" component={LoyaltyPage}/>
    <Stack.Screen name="Registration" component={Registration}/>
    <Stack.Screen name="Login" component={Login}/>
    <Stack.Screen name="AddOfferPage" component={AddOfferPage}/>
    
      </Stack.Navigator>
    </NavigationContainer>
    </ThemeProvider>
  );
}