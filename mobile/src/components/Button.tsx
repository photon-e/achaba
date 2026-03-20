import { ActivityIndicator, Pressable, Text, View } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost";
}

export const Button = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary"
}: ButtonProps) => {
  const isDisabled = disabled || loading;
  const variantStyles = {
    primary: "bg-brand-600 shadow-sm",
    secondary: "bg-slate-900",
    ghost: "bg-transparent border border-slate-200"
  } satisfies Record<NonNullable<ButtonProps["variant"]>, string>;

  const textStyles = {
    primary: "text-white",
    secondary: "text-white",
    ghost: "text-slate-900"
  } satisfies Record<NonNullable<ButtonProps["variant"]>, string>;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`rounded-2xl px-4 py-4 ${variantStyles[variant]} ${isDisabled ? "opacity-60" : ""}`}
    >
      {loading ? (
        <View className="flex-row items-center justify-center gap-3">
          <ActivityIndicator color={variant === "ghost" ? "#0f172a" : "#ffffff"} />
          <Text className={`text-base font-semibold ${textStyles[variant]}`}>{title}</Text>
        </View>
      ) : (
        <Text className={`text-center text-base font-semibold ${textStyles[variant]}`}>{title}</Text>
      )}
    </Pressable>
  );
};
