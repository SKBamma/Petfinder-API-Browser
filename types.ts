export interface TypeResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
}
export interface JWTType {
  exp: number;
  aud: string;
  jti: string;
}
export interface Animal {
  title: string;
  value: string;
}
// export interface AnimalBookmark {
//   title: string;
//   value: string;
// }
export interface Choice {
  title: string;
  value: string;
}
export interface Pet {
  [id: string]: string;
}
