import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { navigationRef } from "./src/NavigationRoute";

import Stack from "./src/Components/Navigations/Stack";
import { Provider } from "react-redux";
import { store } from "./src/app/store/store";

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer ref={navigationRef}>
        <StatusBar backgroundColor="#F7EEFF" />
        <Stack />
      </NavigationContainer>
    </Provider>
  );
}
