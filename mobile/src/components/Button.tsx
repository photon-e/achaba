import { ActivityIndicator, Pressable, Text } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary";
}

export const Button = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary"
}: ButtonProps) => (
  <Pressable
    onPress={onPress}
    disabled={disabled || loading}
    className={`rounded-2xl px-4 py-4 ${
      variant === "primary" ? "bg-brand-600" : "bg-slate-200"
    } ${disabled ? "opacity-50" : ""}`}
  >
    {loading ? (
      <ActivityIndicator color={variant === "primary" ? "#ffffff" : "#0f172a"} />
    ) : (
      <Text
        className={`text-center text-base font-semibold ${
          variant === "primary" ? "text-white" : "text-slate-900"
        }`}
      >
        {title}
      </Text>
    )}
  </Pressable>
);
