import { describe, expect, it } from "vitest";
import { readStore, writeStore, demoLogin, demoRegister } from "../demo/store";
import type { PaymentMethodItem } from "../types";

describe("Account Management & Settings", () => {
  it("allows setting profile avatar and payment methods on demo users", () => {
    const store = readStore();
    const user = store.users.find((u) => u.email === "freelancer@mudayhub.et");
    expect(user).toBeDefined();

    if (user) {
      const sampleAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb";
      const samplePaymentMethods: PaymentMethodItem[] = [
        {
          id: "pm-test-1",
          type: "telebirr",
          title: "Telebirr Mobile Wallet",
          account_identifier: "+251911000111",
          is_default: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "pm-test-2",
          type: "bank_transfer",
          title: "Commercial Bank of Ethiopia (CBE)",
          account_identifier: "1000987654321",
          bank_details: {
            bank_name: "Commercial Bank of Ethiopia (CBE) / የኢትዮጵያ ንግድ ባንክ",
            account_number: "1000987654321",
            account_holder_name: "Abebe Kebede",
          },
          is_default: false,
          created_at: new Date().toISOString(),
        },
      ];

      user.profile.avatar_url = sampleAvatar;
      user.profile.payment_methods = samplePaymentMethods;
      writeStore(store);

      const refreshed = readStore();
      const updatedUser = refreshed.users.find((u) => u.email === "freelancer@mudayhub.et");
      expect(updatedUser?.profile.avatar_url).toBe(sampleAvatar);
      expect(updatedUser?.profile.payment_methods?.length).toBe(2);
      expect(updatedUser?.profile.payment_methods?.[0].type).toBe("telebirr");
      expect(updatedUser?.profile.payment_methods?.[1].bank_details?.bank_name).toContain("Commercial Bank of Ethiopia");
    }
  });

  it("handles password resets and allows sign in with new password", () => {
    const tempEmail = `pw-reset-user-${Date.now()}@example.et`;
    const origPassword = "InitialPassword123!";
    const newPassword = "BrandNewPassword456!";

    // Register user
    demoRegister({
      email: tempEmail,
      password: origPassword,
      full_name: "Password Reset Test User",
      role: "freelancer",
    });

    const store = readStore();
    const user = store.users.find((u) => u.email === tempEmail);
    expect(user).toBeDefined();

    // Verify initial login succeeds
    const initialLogin = demoLogin(tempEmail, origPassword);
    expect(initialLogin).not.toBeNull();

    // Simulate password reset
    if (user) {
      user.password = newPassword;
      writeStore(store);
    }

    // Old password should fail
    const oldLogin = demoLogin(tempEmail, origPassword);
    expect(oldLogin).toBeNull();

    // New password should succeed
    const newLogin = demoLogin(tempEmail, newPassword);
    expect(newLogin).not.toBeNull();
    expect(newLogin?.user.email).toBe(tempEmail);
  });

  it("allows safe account deletion when no active contracts exist", () => {
    const tempEmail = `delete-user-${Date.now()}@example.et`;
    const reg = demoRegister({
      email: tempEmail,
      password: "TestPassword123!",
      full_name: "Ephemeral User",
      role: "client",
    });

    const userId = reg.user.id;
    let store = readStore();
    expect(store.users.some((u) => u.id === userId)).toBe(true);

    // Simulate deletion (safety check: contracts filter)
    const activeContracts = store.contracts.filter(
      (c) =>
        (c.client_id === userId || c.freelancer_id === userId) &&
        ["awaiting_deposit", "funded", "work_submitted", "disputed"].includes(c.escrow_status)
    );
    expect(activeContracts.length).toBe(0);

    // Remove user and sessions
    store.users = store.users.filter((u) => u.id !== userId);
    writeStore(store);

    store = readStore();
    expect(store.users.some((u) => u.id === userId)).toBe(false);
  });
});
