/**
 * Tests for Zod schemas
 */

import { describe, expect, it } from "vitest";
import {
  MessageIdSchema,
  OutputFormatSchema,
  ThreadIdSchema,
} from "@/schemas/shared.ts";
import { OAuth2CredentialsSchema, StoredTokensSchema } from "@/types.ts";

describe("OutputFormatSchema", () => {
  it("accepts markdown format", () => {
    const result = OutputFormatSchema.parse("markdown");
    expect(result).toBe("markdown");
  });

  it("accepts json format", () => {
    const result = OutputFormatSchema.parse("json");
    expect(result).toBe("json");
  });

  it("defaults to markdown", () => {
    const result = OutputFormatSchema.parse(undefined);
    expect(result).toBe("markdown");
  });

  it("rejects invalid format", () => {
    expect(() => OutputFormatSchema.parse("xml")).toThrow();
  });
});

describe("MessageIdSchema", () => {
  it("accepts valid message ID", () => {
    const result = MessageIdSchema.parse("18f3c5d4e8a2b1c0");
    expect(result).toBe("18f3c5d4e8a2b1c0");
  });

  it("rejects empty string", () => {
    expect(() => MessageIdSchema.parse("")).toThrow(
      "Message ID cannot be empty"
    );
  });
});

describe("ThreadIdSchema", () => {
  it("accepts valid thread ID", () => {
    const result = ThreadIdSchema.parse("18f3c5d4e8a2b1c0");
    expect(result).toBe("18f3c5d4e8a2b1c0");
  });

  it("rejects empty string", () => {
    expect(() => ThreadIdSchema.parse("")).toThrow("Thread ID cannot be empty");
  });
});

describe("OAuth2CredentialsSchema", () => {
  it("accepts valid credentials", () => {
    const validCreds = {
      installed: {
        client_id: "test-client-id",
        project_id: "test-project",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url:
          "https://www.googleapis.com/oauth2/v1/certs",
        client_secret: "test-secret",
        redirect_uris: ["http://localhost"],
      },
    };

    const result = OAuth2CredentialsSchema.parse(validCreds);
    expect(result).toEqual(validCreds);
  });

  it("rejects missing client_id", () => {
    const invalidCreds = {
      installed: {
        project_id: "test-project",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url:
          "https://www.googleapis.com/oauth2/v1/certs",
        client_secret: "test-secret",
        redirect_uris: ["http://localhost"],
      },
    };

    expect(() => OAuth2CredentialsSchema.parse(invalidCreds)).toThrow();
  });

  it("rejects invalid URL format", () => {
    const invalidCreds = {
      installed: {
        client_id: "test-client-id",
        project_id: "test-project",
        auth_uri: "not-a-url",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url:
          "https://www.googleapis.com/oauth2/v1/certs",
        client_secret: "test-secret",
        redirect_uris: ["http://localhost"],
      },
    };

    expect(() => OAuth2CredentialsSchema.parse(invalidCreds)).toThrow();
  });
});

describe("StoredTokensSchema", () => {
  it("accepts valid tokens", () => {
    const validTokens = {
      access_token: "ya29.test-access-token",
      refresh_token: "1//test-refresh-token",
      scope: "https://www.googleapis.com/auth/gmail.readonly",
      token_type: "Bearer",
      expiry_date: 1_704_067_200_000,
    };

    const result = StoredTokensSchema.parse(validTokens);
    expect(result).toEqual(validTokens);
  });

  it("rejects missing access_token", () => {
    const invalidTokens = {
      refresh_token: "1//test-refresh-token",
      scope: "https://www.googleapis.com/auth/gmail.readonly",
      token_type: "Bearer",
      expiry_date: 1_704_067_200_000,
    };

    expect(() => StoredTokensSchema.parse(invalidTokens)).toThrow();
  });

  it("rejects invalid expiry_date (negative)", () => {
    const invalidTokens = {
      access_token: "ya29.test-access-token",
      refresh_token: "1//test-refresh-token",
      scope: "https://www.googleapis.com/auth/gmail.readonly",
      token_type: "Bearer",
      expiry_date: -1,
    };

    expect(() => StoredTokensSchema.parse(invalidTokens)).toThrow();
  });

  it("rejects invalid expiry_date (not integer)", () => {
    const invalidTokens = {
      access_token: "ya29.test-access-token",
      refresh_token: "1//test-refresh-token",
      scope: "https://www.googleapis.com/auth/gmail.readonly",
      token_type: "Bearer",
      expiry_date: 1_704_067_200.5,
    };

    expect(() => StoredTokensSchema.parse(invalidTokens)).toThrow();
  });
});
