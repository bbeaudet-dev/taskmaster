import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

export function IconButton({
	name,
	label,
	color,
	onPress,
}: {
	name: keyof typeof Ionicons.glyphMap;
	label: string;
	color: string;
	onPress: () => void;
}) {
	return (
		<Pressable
			accessibilityLabel={label}
			accessibilityRole="button"
			onPress={onPress}
			style={styles.iconButton}
		>
			<Ionicons name={name} size={21} color={color} />
		</Pressable>
	);
}

export function SegmentButton({
	label,
	active,
	onPress,
}: {
	label: string;
	active: boolean;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			style={[styles.segmentButton, active ? styles.segmentButtonActive : null]}
		>
			<Text style={active ? styles.segmentTextActive : styles.segmentText}>
				{label}
			</Text>
		</Pressable>
	);
}

export function ActionButton({
	label,
	onPress,
	variant = "primary",
	disabled = false,
}: {
	label: string;
	onPress: () => void;
	variant?: "primary" | "secondary" | "danger";
	disabled?: boolean;
}) {
	return (
		<Pressable
			disabled={disabled}
			onPress={onPress}
			style={[
				styles.actionButton,
				styles[`${variant}Button`],
				disabled ? styles.disabledButton : null,
			]}
		>
			<Text style={styles.actionButtonText}>{label}</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	iconButton: {
		borderRadius: 999,
		padding: 6,
	},
	segmentButton: {
		borderRadius: 999,
		borderWidth: 1,
		borderColor: "#6b7280",
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	segmentButtonActive: {
		backgroundColor: "#2563eb",
		borderColor: "#2563eb",
	},
	segmentText: {
		color: "#6b7280",
		fontWeight: "600",
		textTransform: "capitalize",
	},
	segmentTextActive: {
		color: "#ffffff",
		fontWeight: "700",
		textTransform: "capitalize",
	},
	actionButton: {
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 10,
	},
	primaryButton: {
		backgroundColor: "#2563eb",
	},
	secondaryButton: {
		backgroundColor: "#4b5563",
	},
	dangerButton: {
		backgroundColor: "#dc2626",
	},
	disabledButton: {
		opacity: 0.4,
	},
	actionButtonText: {
		color: "#ffffff",
		fontWeight: "700",
	},
});
