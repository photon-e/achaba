import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { RoleBadge } from "@/components/RoleBadge";
import { Screen } from "@/components/Screen";
import { useApp } from "@/context/AppContext";
import { getApiErrorMessage } from "@/services/api";
import { register } from "@/services/authService";
import { UserRole } from "@/types";

export const RegisterScreen = ({ navigation }: any) => {
  const { setSession } = useApp();
  const [role, setRole] = useState<UserRole>("customer");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [bikeNumber, setBikeNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const phoneError = useMemo(() => {
    if (!phoneNumber) {
      return "";
    }

    return /^\+?[0-9]{10,15}$/.test(phoneNumber.trim()) ? "" : "Use a valid phone number.";
  }, [phoneNumber]);

  const passwordError = useMemo(() => {
    if (!password) {
      return "";
    }

    return password.trim().length >= 6 ? "" : "Password must be at least 6 characters.";
  }, [password]);

  const bikeNumberError = useMemo(() => {
    if (role !== "rider" || !bikeNumber) {
      return "";
    }

    return bikeNumber.trim().length >= 4 ? "" : "Enter a valid bike number.";
  }, [bikeNumber, role]);

  const handleRegister = async () => {
    if (!phoneNumber.trim() || !password.trim() || phoneError || passwordError || bikeNumberError) {
      setErrorMessage("Please fix the highlighted fields before continuing.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const session = await register({
        phone_number: phoneNumber.trim(),
        password: password.trim(),
        role,
        bike_number: role === "rider" ? bikeNumber.trim() : undefined
      });
      await setSession(session);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Registration failed. Please review your details and try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <View className="rounded-[32px] bg-white p-6 shadow-sm">
          <Text className="mb-2 text-3xl font-bold text-slate-900">Create account</Text>
          <Text className="mb-6 text-base text-slate-600">
            Join as a customer to book rides or as a rider to start receiving nearby requests.
          </Text>

          {errorMessage ? (
            <View className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
              <Text className="text-sm text-rose-700">{errorMessage}</Text>
            </View>
          ) : null}

          <View className="mb-5 flex-row gap-3">
            {(["customer", "rider"] as UserRole[]).map((nextRole) => (
              <Pressable
                key={nextRole}
                onPress={() => setRole(nextRole)}
                className={`flex-1 rounded-2xl border px-4 py-4 ${
                  role === nextRole ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-slate-50"
                }`}
              >
                <RoleBadge role={nextRole} />
              </Pressable>
            ))}
          </View>

          <Input
            label="Phone number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="+2348012345678"
            keyboardType="phone-pad"
            error={phoneError}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Use any secure password"
            secureTextEntry
            error={passwordError}
            hint="Local MVP accounts use standard password auth for quick testing."
          />
          {role === "rider" ? (
            <Input
              label="Bike number"
              value={bikeNumber}
              onChangeText={setBikeNumber}
              placeholder="ABC-123XY"
              error={bikeNumberError}
            />
          ) : null}

          <View className="gap-3">
            <Button
              title={role === "rider" ? "Create rider account" : "Create customer account"}
              onPress={handleRegister}
              loading={loading}
              disabled={Boolean(phoneError) || Boolean(passwordError) || Boolean(bikeNumberError)}
            />
            <Button title="Back to login" onPress={() => navigation.goBack()} variant="ghost" disabled={loading} />
          </View>
        </View>
      </View>
    </Screen>
  );
};
