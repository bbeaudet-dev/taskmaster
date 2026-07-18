import { Button, Column, Host, Text as ExpoUIText } from "@expo/ui";
import { api } from "@taskmaster/backend/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import { View, ScrollView, StyleSheet } from "react-native";

import { Container } from "@/components/container";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { authClient } from "@/lib/auth-client";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

export default function Home() {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
  const healthCheck = useQuery(api.healthCheck.get);
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.auth.getCurrentUser, isAuthenticated ? {} : "skip");

  return (
    <Container>
      <ScrollView style={styles.scrollView} contentInsetAdjustmentBehavior="never">
        <View style={styles.content}>
          <Host style={styles.titleHost}>
            <ExpoUIText
              textStyle={{
                color: theme.text,
                fontSize: 24,
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              BETTER T STACK
            </ExpoUIText>
          </Host>

          <View
            style={[styles.statusCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Host style={styles.statusCardTitleHost} matchContents={{ vertical: true }}>
              <ExpoUIText textStyle={{ color: theme.text, fontSize: 16, fontWeight: "bold" }}>
                API Status
              </ExpoUIText>
            </Host>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: healthCheck ? "#10b981" : "#f59e0b" },
                ]}
              />
              <View style={styles.statusContent}>
                <Host matchContents={{ vertical: true }}>
                  <ExpoUIText
                    textStyle={{ color: theme.text, fontSize: 12 }}
                    style={{ opacity: 0.7 }}
                  >
                    {healthCheck === undefined
                      ? "Checking..."
                      : healthCheck === "OK"
                        ? "Connected to API"
                        : "API Disconnected"}
                  </ExpoUIText>
                </Host>
              </View>
            </View>
          </View>

          {user ? (
            <View
              style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <Host style={styles.userHeader} matchContents>
                <Column spacing={6}>
                  <ExpoUIText textStyle={{ color: theme.text, fontSize: 16, fontWeight: "bold" }}>
                    {`Welcome, ${user.name}`}
                  </ExpoUIText>
                  <ExpoUIText
                    textStyle={{ color: theme.text, fontSize: 14 }}
                    style={{ opacity: 0.7 }}
                  >
                    {user.email}
                  </ExpoUIText>
                </Column>
              </Host>
              <Host matchContents={{ vertical: true }}>
                <Button
                  label="Sign Out"
                  variant="outlined"
                  onPress={() => {
                    authClient.signOut();
                  }}
                />
              </Host>
            </View>
          ) : (
            <>
              <SignIn />
              <SignUp />
            </>
          )}
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 32,
  },
  titleHost: {
    alignSelf: "stretch",
    height: 34,
    marginBottom: 24,
  },
  card: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusIndicator: {
    height: 10,
    width: 10,
    borderRadius: 999,
  },
  statusContent: {
    flex: 1,
  },
  userCard: {
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
  },
  userHeader: {
    marginBottom: 8,
  },
  paymentActions: {
    marginTop: 12,
  },
  authHost: {
    marginBottom: 12,
  },
  authActionsHost: {
    marginTop: 4,
  },
  statusCard: {
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
  },
  statusCardTitleHost: {
    marginBottom: 8,
  },
});
