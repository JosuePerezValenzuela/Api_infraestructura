export interface AuthUser {
  sub: string;
  name: string;
  email?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  roles: string[];
}

export interface AuthSessionRecord {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  createdAt: number;
  expiresAt: number;
  refreshExpiresAt?: number;
}

export interface CookiePayload {
  name: string;
  value: string;
  options: {
    domain?: string;
    httpOnly: boolean;
    maxAge?: number;
    path: string;
    sameSite: 'lax' | 'strict' | 'none';
    secure: boolean;
  };
}
