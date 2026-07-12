import React, {useEffect} from "react";
import * as SplashScreen from "expo-splash-screen";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator, CardStyleInterpolators } from "@react-navigation/stack";
import { ThemeProvider } from "./theme/ThemeContext";
import HomePage from './screens/HomePage';
import ProfilePage from "./screens/ProfilePage";
import PostsPage from "./screens/PostsPage";
import ProfileSettingsPage from "./screens/ProfileSettingsPage";
import NewProductPage from "./screens/NewProductPage";
import ProductListPage from "./screens/ProductListPage";
import LoyaltyPage from "./screens/LoyaltyPage";
import Registration from "./screens/Registration";
import Login from "./screens/Login";
import AddOfferPage from "./screens/AddOfferPage";
import NotificationsPage from "./screens/NotificationsPage";
import OrderDetailPage from "./screens/OrderDetailPage";
import AllReviewsPage from "./screens/AllReviewsPage";
import ScanQRCodePage from "./screens/ScanQRCodePage";
import Orders from "./components/Orders";
import ResetPassword from "./screens/ResetPassword";
import AuthLoading from "./screens/AuthLoading";
import BannerPage from "./screens/BannerPage";
import BannerList from "./screens/BannerList";
import UpgradePlanPage from "./screens/UpgradePlanPage";
import PaymentPage from "./screens/PaymentPage";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { startMerchantNotificationPolling, stopMerchantNotificationPolling } from "./services/notificationService";

SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

export default function App() {

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    startMerchantNotificationPolling();

    return () => {
      stopMerchantNotificationPolling();
    };
  }, []);

  // ⚠️ Must return null while fonts are loading
  if (!fontsLoaded) return null;

  return ( 
     <ThemeProvider>
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="AuthLoading"
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      >

    <Stack.Screen name="AuthLoading" component={AuthLoading} />
    <Stack.Screen name="HomePage" component={HomePage} />
    <Stack.Screen name="ProfilePage" component={ProfilePage} />  
    <Stack.Screen name="PostsPage" component={PostsPage}/>
    <Stack.Screen name="ProfileSettingsPage" component={ProfileSettingsPage}/>
    <Stack.Screen name="NewProductPage" component={NewProductPage}/>
    <Stack.Screen name="ProductListPage" component={ProductListPage}/>
    <Stack.Screen name="LoyaltyPage" component={LoyaltyPage}/>
    <Stack.Screen name="Registration" component={Registration}/>
    <Stack.Screen name="Login" component={Login}/>
    <Stack.Screen name="AddOfferPage" component={AddOfferPage}/>
    <Stack.Screen name="NotificationsPage" component={NotificationsPage}/>
    <Stack.Screen name="OrderDetailPage" component={OrderDetailPage}/>
    <Stack.Screen name="Orders" component={Orders} />
    <Stack.Screen name="ScanQRCodePage" component={ScanQRCodePage}/>
    <Stack.Screen name="AllReviewsPage" component={AllReviewsPage}/>
    <Stack.Screen name="ResetPassword" component={ResetPassword}/>
    <Stack.Screen name="BannerPage" component={BannerPage}/>
    <Stack.Screen name="BannerList" component={BannerList}/>
    <Stack.Screen name="UpgradePlanPage" component={UpgradePlanPage}/>
    <Stack.Screen name="PaymentPage" component={PaymentPage}/>
      </Stack.Navigator>
    </NavigationContainer>
    </ThemeProvider>
  );
}