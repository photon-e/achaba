import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { RoleBadge } from "@/components/RoleBadge";
import { Screen } from "@/components/Screen";
import { useApp } from "@/context/AppContext";
import { register } from "@/services/authService";
import { UserRole } from "@/types";

export const RegisterScreen = ({ navigation }: any) => {
  const { setSession } = useApp();
  const [role, setRole] = useState<UserRole>("customer");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [bikeNumber, setBikeNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    try {
      const session = await register({
        phone_number: phoneNumber,
        password,
        role,
        bike_number: role === "rider" ? bikeNumber : undefined
      });
      await setSession(session);
    } catch {
      Alert.alert("Registration failed", "Please confirm your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="mt-10 rounded-3xl bg-white p-6 shadow-sm">
        <Text className="mb-2 text-3xl font-bold text-slate-900">Create account</Text>
        <Text className="mb-6 text-base text-slate-600">
          Register as a customer or okada rider to get started.
        </Text>
        <View className="mb-4 flex-row gap-3">
          {(["customer", "rider"] as UserRole[]).map((nextRole) => (
            <Pressable
              key={nextRole}
              onPress={() => setRole(nextRole)}
              className={`rounded-2xl border px-4 py-3 ${
                role === nextRole ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white"
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
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Use any secure password"
          secureTextEntry
        />
        {role === "rider" ? (
          <Input
            label="Bike number"
            value={bikeNumber}
            onChangeText={setBikeNumber}
            placeholder="ABC-123XY"
          />
        ) : null}
        <View className="gap-3">
          <Button title="Register" onPress={handleRegister} loading={loading} />
          <Button title="Back to login" onPress={() => navigation.goBack()} variant="secondary" />
        </View>
      </View>
    </Screen>
  );
};
