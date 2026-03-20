import { useState } from "react";
import { Alert, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Screen } from "@/components/Screen";
import { useApp } from "@/context/AppContext";
import { requestOtp, verifyOtp } from "@/services/authService";

export const LoginScreen = ({ navigation }: any) => {
  const { setSession } = useApp();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [mockOtp, setMockOtp] = useState("");

  const handleRequestOtp = async () => {
    setLoading(true);
    try {
      const response = await requestOtp(phoneNumber);
      setMockOtp(response.otp_code);
      Alert.alert("Mock OTP generated", `Use ${response.otp_code} to continue.`);
    } catch (error) {
      Alert.alert("Unable to request OTP", "Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const session = await verifyOtp(phoneNumber, otp);
      await setSession(session);
    } catch {
      Alert.alert("Invalid OTP", "Please request a new OTP and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="mt-10 rounded-3xl bg-white p-6 shadow-sm">
        <Text className="mb-2 text-3xl font-bold text-slate-900">Achaba</Text>
        <Text className="mb-8 text-base text-slate-600">
          Fast motorcycle rides for Lagos, Abuja, Port Harcourt and beyond.
        </Text>
        <Input
          label="Phone number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="+2348012345678"
          keyboardType="phone-pad"
        />
        <Input
          label="OTP code"
          value={otp}
          onChangeText={setOtp}
          placeholder="Enter the 6-digit OTP"
          keyboardType="numeric"
        />
        {mockOtp ? <Text className="mb-4 text-sm text-brand-700">Mock OTP: {mockOtp}</Text> : null}
        <View className="gap-3">
          <Button title="Request OTP" onPress={handleRequestOtp} loading={loading} />
          <Button title="Login" onPress={handleVerifyOtp} loading={loading} />
          <Button
            title="Create account"
            onPress={() => navigation.navigate("Register")}
            variant="secondary"
          />
        </View>
      </View>
    </Screen>
  );
};
