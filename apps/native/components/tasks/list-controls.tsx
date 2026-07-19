import { StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton, SegmentButton } from "./task-buttons";
import type { ListId, TaskList } from "./types";

type ListControlsProps = {
	lists: TaskList[] | undefined;
	selectedListId: ListId | undefined;
	newListName: string;
	shareEmail: string;
	theme: {
		background: string;
		border: string;
		card: string;
		text: string;
	};
	onSelectList: (listId: ListId | undefined) => void;
	onChangeNewListName: (name: string) => void;
	onCreateList: () => void;
	onChangeShareEmail: (email: string) => void;
	onShareList: () => void;
};

export function ListControls({
	lists,
	selectedListId,
	newListName,
	shareEmail,
	theme,
	onSelectList,
	onChangeNewListName,
	onCreateList,
	onChangeShareEmail,
	onShareList,
}: ListControlsProps) {
	const selectedList = lists?.find((list) => list._id === selectedListId);
	const canShareSelectedList = selectedList !== undefined && selectedList.access === "owner";

	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: theme.card, borderColor: theme.border },
			]}
		>
			<Text style={[styles.cardTitle, { color: theme.text }]}>Lists</Text>
			<View style={styles.segmentRow}>
				<SegmentButton
					label="All"
					active={selectedListId === undefined}
					onPress={() => onSelectList(undefined)}
				/>
				{lists?.map((list) => (
					<SegmentButton
						key={list._id}
						label={list.access === "shared" ? `${list.name} (shared)` : list.name}
						active={selectedListId === list._id}
						onPress={() => onSelectList(list._id)}
					/>
				))}
			</View>
			<View style={styles.inlineRow}>
				<TextInput
					value={newListName}
					onChangeText={onChangeNewListName}
					placeholder="New list"
					placeholderTextColor={theme.text + "80"}
					style={[
						styles.input,
						styles.flexInput,
						{
							borderColor: theme.border,
							color: theme.text,
							backgroundColor: theme.background,
						},
					]}
				/>
				<ActionButton
					label="Create"
					onPress={onCreateList}
					disabled={newListName.trim().length === 0}
				/>
			</View>
			{canShareSelectedList ? (
				<View style={styles.inlineRow}>
					<TextInput
						value={shareEmail}
						onChangeText={onChangeShareEmail}
						placeholder="Share selected list by email"
						placeholderTextColor={theme.text + "80"}
						autoCapitalize="none"
						keyboardType="email-address"
						style={[
							styles.input,
							styles.flexInput,
							{
								borderColor: theme.border,
								color: theme.text,
								backgroundColor: theme.background,
							},
						]}
					/>
					<ActionButton
						label="Share"
						onPress={onShareList}
						disabled={shareEmail.trim().length === 0}
					/>
				</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		borderWidth: 1,
		borderRadius: 16,
		padding: 16,
		gap: 10,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: "700",
	},
	segmentRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	inlineRow: {
		alignItems: "center",
		flexDirection: "row",
		gap: 8,
	},
	input: {
		borderWidth: 1,
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 16,
	},
	flexInput: {
		flex: 1,
	},
});
