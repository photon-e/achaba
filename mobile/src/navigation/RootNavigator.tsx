import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";

import { useApp } from "@/context/AppContext";
import { LoginScreen } from "@/screens/auth/LoginScreen";
import { RegisterScreen } from "@/screens/auth/RegisterScreen";
import { CustomerHomeScreen } from "@/screens/customer/CustomerHomeScreen";
import { RiderHomeScreen } from "@/screens/rider/RiderHomeScreen";

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { loading, session } = useApp();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : session.user.role === "rider" ? (
          <Stack.Screen name="RiderHome" component={RiderHomeScreen} />
        ) : (
          <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
