import { describe, expect, it } from "vitest";
import { demoRegister, readStore } from "../demo/store";

describe("Duplicate Account Prevention", () => {
  it("rejects registration when email already exists", () => {
    // Attempting to register with an existing seed email
    expect(() =>
      demoRegister({
        email: "freelancer@mudayhub.et",
        password: "NewPassword123!",
        full_name: "Imposter User",
        role: "freelancer",
      })
    ).toThrow("An account with this email address already exists. Please log in instead.");
  });

  it("rejects registration case-insensitively for emails", () => {
    expect(() =>
      demoRegister({
        email: "FREELANCER@MUDAYHUB.ET",
        password: "NewPassword123!",
        full_name: "Imposter User",
        role: "freelancer",
      })
    ).toThrow("An account with this email address already exists. Please log in instead.");
  });

  it("rejects registration when phone number already belongs to another account", () => {
    // Look up an existing phone from store
    const store = readStore();
    const existingUser = store.users.find((u) => u.profile.phone);
    expect(existingUser).toBeDefined();

    if (existingUser && existingUser.profile.phone) {
      expect(() =>
        demoRegister({
          email: "unique-fresh-email-999@example.com",
          password: "SecurePassword123!",
          full_name: "Clone Phone User",
          role: "freelancer",
          phone: existingUser.profile.phone ?? undefined,
        })
      ).toThrow("An account with this phone number already exists.");
    }
  });

  it("allows registration when email and phone are unique", () => {
    const uniqueEmail = `user-${Date.now()}@unique-test-domain.et`;
    const uniquePhone = `+2519${Math.floor(10000000 + Math.random() * 90000000)}`;

    const res = demoRegister({
      email: uniqueEmail,
      password: "ValidPassword123!",
      full_name: "Brand New User",
      role: "client",
      phone: uniquePhone,
    });

    expect(res.user).toBeDefined();
    expect(res.user.email).toBe(uniqueEmail);
    expect(res.user.profile.phone).toBe(uniquePhone);
  });
});
