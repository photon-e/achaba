import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Screen } from "@/components/Screen";
import { useApp } from "@/context/AppContext";
import { requestOtp, verifyOtp } from "@/services/authService";
import { getApiBaseUrl, getApiErrorMessage, isLocalApiBaseUrl } from "@/services/api";

export const LoginScreen = ({ navigation }: any) => {
  const { setSession } = useApp();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [mockOtp, setMockOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const phoneError = useMemo(() => {
    if (!phoneNumber) {
      return "";
    }

    return /^\+?[0-9]{10,15}$/.test(phoneNumber.trim()) ? "" : "Use a valid phone number.";
  }, [phoneNumber]);

  const otpError = useMemo(() => {
    if (!otp) {
      return "";
    }

    return /^\d{6}$/.test(otp.trim()) ? "" : "OTP must be 6 digits.";
  }, [otp]);

  const handleRequestOtp = async () => {
    if (!phoneNumber.trim() || phoneError) {
      setErrorMessage("Enter a valid phone number to request an OTP.");
      return;
    }

    setRequestingOtp(true);
    setErrorMessage("");
    try {
      const response = await requestOtp(phoneNumber.trim());
      setMockOtp(response.otp_code);
      setOtp(response.otp_code);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to request OTP. Please try again."));
    } finally {
      setRequestingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!phoneNumber.trim() || phoneError || !otp.trim() || otpError) {
      setErrorMessage("Provide a valid phone number and 6-digit OTP.");
      return;
    }

    setVerifyingOtp(true);
    setErrorMessage("");
    try {
      const session = await verifyOtp(phoneNumber.trim(), otp.trim());
      await setSession(session);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Invalid OTP. Please request a new OTP and try again."));
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <View className="rounded-[32px] bg-slate-900 p-7">
          <Text className="text-sm font-semibold uppercase tracking-[3px] text-brand-200">Achaba</Text>
          <Text className="mt-3 text-3xl font-bold text-white">Move through the city faster.</Text>
          <Text className="mt-3 text-base leading-6 text-slate-300">
            Sign in with your phone number to request or manage motorcycle rides with fewer taps.
          </Text>
        </View>

        <View className="-mt-6 rounded-[32px] bg-white p-6 shadow-sm">
          <Text className="mb-2 text-2xl font-bold text-slate-900">Welcome back</Text>
          <Text className="mb-6 text-base text-slate-600">
            We will generate a mock OTP for local development and auto-fill it for you.
          </Text>

          {isLocalApiBaseUrl() ? (
            <View className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <Text className="text-sm text-amber-800">
                API base URL is set to {getApiBaseUrl()}. If you are testing on a physical phone, replace localhost or 127.0.0.1 with your computer's local network IP in `EXPO_PUBLIC_API_BASE_URL`.
              </Text>
            </View>
          ) : null}

          {errorMessage ? (
            <View className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
              <Text className="text-sm text-rose-700">{errorMessage}</Text>
            </View>
          ) : null}

          <Input
            label="Phone number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="+2348012345678"
            keyboardType="phone-pad"
            error={phoneError}
            hint="Use the phone number tied to your customer or rider profile."
          />
          <Input
            label="OTP code"
            value={otp}
            onChangeText={setOtp}
            placeholder="Enter the 6-digit OTP"
            keyboardType="numeric"
            error={otpError}
            hint="Request a code first if you are signing in locally."
          />

          {mockOtp ? (
            <View className="mb-4 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3">
              <Text className="text-sm font-medium text-brand-700">Mock OTP ready: {mockOtp}</Text>
            </View>
          ) : null}

          <View className="gap-3">
            <Button
              title="Request OTP"
              onPress={handleRequestOtp}
              loading={requestingOtp}
              disabled={Boolean(phoneError) || verifyingOtp}
              variant="ghost"
            />
            <Button
              title="Login"
              onPress={handleVerifyOtp}
              loading={verifyingOtp}
              disabled={Boolean(phoneError) || Boolean(otpError) || requestingOtp}
            />
            <Button
              title="Create account"
              onPress={() => navigation.navigate("Register")}
              variant="secondary"
              disabled={requestingOtp || verifyingOtp}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
};
