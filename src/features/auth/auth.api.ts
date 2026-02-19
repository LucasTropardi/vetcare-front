export async function login(): Promise<never> {
  throw new Error("Deprecated: use OIDC Authorization Code + PKCE flow");
}
